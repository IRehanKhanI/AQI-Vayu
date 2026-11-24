"""
VayuTrack Flask REST API Server
Provides /api/cities, /api/predict, and /api/analytics endpoints backed by
trained Scikit-Learn Random Forest and Linear Regression models.
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from train_models import (
    CITY_PROFILES,
    FEATURES,
    MODELS_DIR,
    bucket_from_aqi,
    train_and_save_models,
)

app = Flask(__name__)
CORS(app)

# Theme-aligned hex colors for AQI categories
CATEGORY_META = {
    "Good": {
        "color": "#606C38",
        "alert": "Normal activity.",
        "precautions": [],
    },
    "Moderate": {
        "color": "#DDA15E",
        "alert": "Limit prolonged outdoor exertion.",
        "precautions": [],
    },
    "Poor": {
        "color": "#BC6C25",
        "alert": "Reduce prolonged outdoor exposure.",
        "precautions": [],
    },
    "Severe": {
        "color": "#BA1A1A",
        "alert": "Avoid unnecessary outdoor activities.",
        "precautions": [],
    },
}


def load_artifacts():
    required_files = [
        "rf_regressor.joblib",
        "rf_classifier.joblib",
        "scaler.joblib",
        "analytics_cache.joblib",
    ]
    if not all(os.path.exists(os.path.join(MODELS_DIR, f)) for f in required_files):
        train_and_save_models()

    return {
        "rf_reg": joblib.load(os.path.join(MODELS_DIR, "rf_regressor.joblib")),
        "rf_clf": joblib.load(os.path.join(MODELS_DIR, "rf_classifier.joblib")),
        "scaler": joblib.load(os.path.join(MODELS_DIR, "scaler.joblib")),
        "cache": joblib.load(os.path.join(MODELS_DIR, "analytics_cache.joblib")),
    }


ARTIFACTS = load_artifacts()


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "model_metrics": ARTIFACTS["cache"]["metrics"],
        "using_synthetic_fallback": ARTIFACTS["cache"]["used_synthetic"],
    })


@app.route("/api/cities", methods=["GET"])
def get_cities():
    df = pd.DataFrame(ARTIFACTS["cache"]["records"])
    df = df.sort_values(["City", "Date"])
    latest = df.groupby("City", as_index=False).last()

    cities_payload = []
    for _, row in latest.iterrows():
        city = row["City"]
        profile = CITY_PROFILES.get(city, (0, 0, 0, 0, 0, 0, "CPCB Station", 28, 55, 8))
        aqi_val = round(float(row["AQI"]), 1)
        category = str(row["AQI_Bucket"])
        meta = CATEGORY_META.get(category, CATEGORY_META["Moderate"])

        cities_payload.append({
            "city": city,
            "station": profile[6],
            "date": str(row["Date"]),
            "aqi": aqi_val,
            "category": category,
            "color": meta["color"],
            "alert": meta["alert"],
            "weather": {
                "temp_c": profile[7],
                "humidity_pct": profile[8],
                "wind_kmh": profile[9],
            },
            "pollutants": {
                "pm25": round(float(row["PM2.5"]), 1),
                "pm10": round(float(row["PM10"]), 1),
                "no2": round(float(row["NO2"]), 1),
                "so2": round(float(row["SO2"]), 1),
                "co": round(float(row["CO"]), 2),
                "o3": round(float(row["O3"]), 1),
            },
        })

    cities_payload.sort(key=lambda c: c["aqi"], reverse=True)
    return jsonify({"cities": cities_payload})


@app.route("/api/predict", methods=["POST"])
def predict_aqi():
    data = request.get_json(silent=True) or {}
    try:
        pm25 = float(data.get("pm25", 0.0))
        pm10 = float(data.get("pm10", 0.0))
        no2 = float(data.get("no2", 0.0))
        so2 = float(data.get("so2", 0.0))
        co = float(data.get("co", 0.0))
        o3 = float(data.get("o3", 0.0))
    except (TypeError, ValueError):
        return jsonify({"error": "All pollutant values must be numeric."}), 400

    features_arr = np.array([[pm25, pm10, no2, so2, co, o3]], dtype=float)
    scaled = ARTIFACTS["scaler"].transform(features_arr)

    predicted_aqi = float(ARTIFACTS["rf_reg"].predict(scaled)[0])
    predicted_aqi = round(float(np.clip(predicted_aqi, 0.0, 500.0)), 1)

    predicted_category = str(ARTIFACTS["rf_clf"].predict(scaled)[0])
    # Align boundary consistency with CPCB scale
    if abs(predicted_aqi - 100) > 15 and abs(predicted_aqi - 200) > 15 and abs(predicted_aqi - 300) > 15:
        predicted_category = bucket_from_aqi(predicted_aqi)

    probs = ARTIFACTS["rf_clf"].predict_proba(scaled)[0]
    confidence = round(float(np.max(probs)) * 100.0, 1)

    meta = CATEGORY_META.get(predicted_category, CATEGORY_META["Moderate"])

    return jsonify({
        "predicted_aqi": predicted_aqi,
        "category": predicted_category,
        "color": meta["color"],
        "confidence": confidence,
        "health_alert": meta["alert"],
        "precautions": meta["precautions"],
        "inputs": {
            "pm25": pm25,
            "pm10": pm10,
            "no2": no2,
            "so2": so2,
            "co": co,
            "o3": o3,
        },
    })


@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    city = request.args.get("city", "Delhi")
    df = pd.DataFrame(ARTIFACTS["cache"]["records"])
    city_df = df[df["City"].str.lower() == city.lower()].sort_values("Date")
    if city_df.empty:
        city_df = df[df["City"] == "Delhi"].sort_values("Date")
        city = "Delhi"

    # Last 30 days & 7 days trends
    recent_30 = city_df.tail(30)
    recent_7 = city_df.tail(7)

    trend_7d = [
        {
            "date": str(r["Date"]),
            "aqi": round(float(r["AQI"]), 1),
            "pm25": round(float(r["PM2.5"]), 1),
            "pm10": round(float(r["PM10"]), 1),
        }
        for _, r in recent_7.iterrows()
    ]

    trend_30d = [
        {
            "date": str(r["Date"]),
            "aqi": round(float(r["AQI"]), 1),
            "pm25": round(float(r["PM2.5"]), 1),
            "pm10": round(float(r["PM10"]), 1),
        }
        for _, r in recent_30.iterrows()
    ]

    return jsonify({
        "city": city,
        "trend_7d": trend_7d,
        "trend_30d": trend_30d,
        "city_comparisons": ARTIFACTS["cache"]["city_comparisons"],
        "correlation_matrix": ARTIFACTS["cache"]["correlation_matrix"],
        "linear_regression": ARTIFACTS["cache"]["linear_regression"],
        "model_metrics": ARTIFACTS["cache"]["metrics"],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
