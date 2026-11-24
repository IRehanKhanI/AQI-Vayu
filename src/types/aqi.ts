export type AqiCategory = 'Good' | 'Moderate' | 'Poor' | 'Severe';

export interface PollutantInputs {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface CityAqiRecord {
  city: string;
  station: string;
  date: string;
  aqi: number;
  category: AqiCategory;
  color: string;
  alert: string;
  weather: {
    temp_c: number;
    humidity_pct: number;
    wind_kmh: number;
  };
  pollutants: PollutantInputs;
  hourly_forecast: Array<{
    time: string;
    aqi: number;
    category: AqiCategory;
  }>;
}

export interface PredictionResponse {
  predicted_aqi: number;
  category: AqiCategory;
  color: string;
  confidence: number;
  health_alert: string;
  precautions: string[];
  inputs: PollutantInputs;
  model_info: {
    regressor: string;
    r2: number;
    mae: number;
    accuracy: number;
  };
}

export interface TrendPoint {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface CityComparisonItem {
  city: string;
  station: string;
  avg_aqi: number;
  avg_pm25: number;
  avg_pm10: number;
  delta_pct: number;
  category: AqiCategory;
}

export interface ScatterPoint {
  city: string;
  pm25: number;
  aqi: number;
  mortality: number;
}

export interface RegressionLinePoint {
  pm25: number;
  mortality: number;
}

export interface AnalyticsResponse {
  city: string;
  trend_24h: TrendPoint[];
  trend_7d: TrendPoint[];
  trend_30d: TrendPoint[];
  trend_season: TrendPoint[];
  city_comparisons: CityComparisonItem[];
  correlation_matrix: {
    labels: string[];
    matrix: number[][];
  };
  linear_regression: {
    slope: number;
    intercept: number;
    r2_score: number;
    equation: string;
    scatter_points: ScatterPoint[];
    regression_line: RegressionLinePoint[];
  };
  model_metrics: {
    rf_r2: number;
    rf_mae: number;
    rf_accuracy: number;
    lr_r2: number;
    lr_slope: number;
    lr_intercept: number;
  };
}
