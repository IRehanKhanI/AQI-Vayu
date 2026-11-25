"""AQI forecasting API for the reduced AQI dataset.

Run:
    pip install -r requirements_aqi.txt
    uvicorn aqi_backend:app --reload

Endpoints:
    GET /health
    GET /locations
    GET /history?state=Maharashtra&area=Amravati
    GET /forecast?state=Maharashtra&area=Amravati&days=7
"""
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestRegressor

DATA_PATH = Path(__file__).resolve().parent / "aqi_25mb.csv"
DATE_COL = "date"
AQI_COL = "aqi_value"

app = FastAPI(title="AQI Historical Data & Forecast API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend origin for production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise RuntimeError(f"Dataset not found at {DATA_PATH}. Place aqi_25mb.csv beside this script.")
    df = pd.read_csv(DATA_PATH)
    df[DATE_COL] = pd.to_datetime(df[DATE_COL], dayfirst=True, errors="coerce")
    df[AQI_COL] = pd.to_numeric(df[AQI_COL], errors="coerce")
    df = df.dropna(subset=[DATE_COL, AQI_COL])
    return df


DATA = load_dataset()


def get_series(state: Optional[str] = None, area: Optional[str] = None) -> pd.Series:
    selected = DATA.copy()
    if state:
        selected = selected[selected["state"].str.casefold() == state.casefold()]
    if area:
        selected = selected[selected["area"].str.casefold() == area.casefold()]
    if selected.empty:
        raise HTTPException(status_code=404, detail="No dataset records match the selected state/area.")
    # Multiple rows can occur for a location/date; use daily mean AQI.
    daily = selected.groupby(DATE_COL)[AQI_COL].mean().sort_index()
    daily = daily.asfreq("D")
    daily = daily.interpolate(method="time").ffill().bfill()
    if daily.empty:
        raise HTTPException(status_code=404, detail="No usable AQI time series found.")
    return daily


def build_features(values: np.ndarray, index: int) -> np.ndarray:
    # Features use the most recent 7, 14, and 28 days, plus rolling means.
    lags = [1, 2, 3, 7, 14, 28]
    lag_values = [values[index - lag] if index >= lag else values[0] for lag in lags]
    recent7 = values[max(0, index - 7):index]
    recent14 = values[max(0, index - 14):index]
    recent28 = values[max(0, index - 28):index]
    return np.array(lag_values + [
        float(np.mean(recent7)) if len(recent7) else float(values[0]),
        float(np.mean(recent14)) if len(recent14) else float(values[0]),
        float(np.mean(recent28)) if len(recent28) else float(values[0]),
    ], dtype=float)


def train_and_forecast(series: pd.Series, days: int) -> list[dict]:
    vals = series.to_numpy(dtype=float)
    if len(vals) < 35:
        raise HTTPException(status_code=422, detail="At least 35 days of history are required for forecasting.")
    # Train using rolling history windows; the target is the next day's AQI.
    X, y = [], []
    for i in range(1, len(vals)):
        X.append(build_features(vals, i))
        y.append(vals[i])
    model = RandomForestRegressor(n_estimators=250, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(np.asarray(X), np.asarray(y))
    future_vals = vals.copy()
    last_date = series.index[-1]
    results = []
    for step in range(1, days + 1):
        idx = len(future_vals)
        features = build_features(future_vals, idx)
        prediction = float(model.predict(features.reshape(1, -1))[0])
        prediction = max(0, min(500, prediction))
        future_vals = np.append(future_vals, prediction)
        date = (last_date + pd.Timedelta(days=step)).date().isoformat()
        results.append({"date": date, "predicted_aqi": round(prediction, 1), "air_quality_status": status_from_aqi(prediction)})
    return results


def status_from_aqi(aqi: float) -> str:
    # Status thresholds commonly used for Indian AQI categories.
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


@app.get("/health")
def health():
    return {"status": "ok", "rows_loaded": int(len(DATA)), "dataset": DATA_PATH.name}


@app.get("/locations")
def locations():
    return {
        "states": sorted(DATA["state"].dropna().unique().tolist()),
        "areas": sorted(DATA["area"].dropna().unique().tolist()),
    }


@app.get("/history")
def history(state: Optional[str] = None, area: Optional[str] = None):
    series = get_series(state, area)
    return {
        "state": state,
        "area": area,
        "history": [{"date": date.date().isoformat(), "aqi": round(float(value), 1)} for date, value in series.items()],
    }


@app.get("/forecast")
def forecast(
    state: Optional[str] = None,
    area: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=30),
):
    series = get_series(state, area)
    predictions = train_and_forecast(series, days)
    return {
        "state": state,
        "area": area,
        "forecast_days": days,
        "last_observed_date": series.index[-1].date().isoformat(),
        "model": "RandomForestRegressor with lag and rolling-mean features",
        "forecast": predictions,
    }
