class PollutantMetrics {
  final double pm25;
  final double pm10;
  final double no2;
  final double so2;
  final double co;
  final double o3;

  const PollutantMetrics({
    required this.pm25,
    required this.pm10,
    required this.no2,
    required this.so2,
    required this.co,
    required this.o3,
  });

  factory PollutantMetrics.fromJson(Map<String, dynamic> json) {
    return PollutantMetrics(
      pm25: (json['pm25'] as num).toDouble(),
      pm10: (json['pm10'] as num).toDouble(),
      no2: (json['no2'] as num).toDouble(),
      so2: (json['so2'] as num).toDouble(),
      co: (json['co'] as num).toDouble(),
      o3: (json['o3'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'pm25': pm25,
        'pm10': pm10,
        'no2': no2,
        'so2': so2,
        'co': co,
        'o3': o3,
      };
}

class CityAqiData {
  final String city;
  final String station;
  final String date;
  final double aqi;
  final String category;
  final String colorHex;
  final String alert;
  final int tempC;
  final int humidityPct;
  final int windKmh;
  final PollutantMetrics pollutants;

  const CityAqiData({
    required this.city,
    required this.station,
    required this.date,
    required this.aqi,
    required this.category,
    required this.colorHex,
    required this.alert,
    required this.tempC,
    required this.humidityPct,
    required this.windKmh,
    required this.pollutants,
  });

  factory CityAqiData.fromJson(Map<String, dynamic> json) {
    final weather = (json['weather'] as Map<String, dynamic>?) ?? {};
    return CityAqiData(
      city: json['city'] as String,
      station: (json['station'] as String?) ?? 'CPCB Node',
      date: (json['date'] as String?) ?? '',
      aqi: (json['aqi'] as num).toDouble(),
      category: json['category'] as String,
      colorHex: (json['color'] as String?) ?? '#DDA15E',
      alert: json['alert'] as String,
      tempC: (weather['temp_c'] as num?)?.toInt() ?? 28,
      humidityPct: (weather['humidity_pct'] as num?)?.toInt() ?? 54,
      windKmh: (weather['wind_kmh'] as num?)?.toInt() ?? 8,
      pollutants: PollutantMetrics.fromJson(
        json['pollutants'] as Map<String, dynamic>,
      ),
    );
  }
}

class PredictionResult {
  final double predictedAqi;
  final String category;
  final String colorHex;
  final double confidence;
  final String healthAlert;
  final List<String> precautions;

  const PredictionResult({
    required this.predictedAqi,
    required this.category,
    required this.colorHex,
    required this.confidence,
    required this.healthAlert,
    required this.precautions,
  });

  factory PredictionResult.fromJson(Map<String, dynamic> json) {
    return PredictionResult(
      predictedAqi: (json['predicted_aqi'] as num).toDouble(),
      category: json['category'] as String,
      colorHex: (json['color'] as String?) ?? '#DDA15E',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 92.0,
      healthAlert: json['health_alert'] as String,
      precautions: ((json['precautions'] as List<dynamic>?) ?? [])
          .map((e) => e.toString())
          .toList(),
    );
  }
}

class TrendPoint {
  final String date;
  final double aqi;
  final double pm25;

  const TrendPoint({
    required this.date,
    required this.aqi,
    required this.pm25,
  });

  factory TrendPoint.fromJson(Map<String, dynamic> json) {
    return TrendPoint(
      date: json['date'] as String,
      aqi: (json['aqi'] as num).toDouble(),
      pm25: (json['pm25'] as num).toDouble(),
    );
  }
}

class CityComparison {
  final String city;
  final String station;
  final double avgAqi;
  final double avgPm25;
  final String category;

  const CityComparison({
    required this.city,
    required this.station,
    required this.avgAqi,
    required this.avgPm25,
    required this.category,
  });

  factory CityComparison.fromJson(Map<String, dynamic> json) {
    return CityComparison(
      city: json['city'] as String,
      station: (json['station'] as String?) ?? '',
      avgAqi: (json['avg_aqi'] as num).toDouble(),
      avgPm25: (json['avg_pm25'] as num).toDouble(),
      category: json['category'] as String,
    );
  }
}

class RegressionPoint {
  final String? city;
  final double pm25;
  final double mortality;

  const RegressionPoint({
    this.city,
    required this.pm25,
    required this.mortality,
  });

  factory RegressionPoint.fromJson(Map<String, dynamic> json) {
    return RegressionPoint(
      city: json['city'] as String?,
      pm25: (json['pm25'] as num).toDouble(),
      mortality: (json['mortality'] as num).toDouble(),
    );
  }
}

class LinearRegressionSummary {
  final double slope;
  final double intercept;
  final double r2Score;
  final String equation;
  final List<RegressionPoint> scatterPoints;
  final List<RegressionPoint> regressionLine;

  const LinearRegressionSummary({
    required this.slope,
    required this.intercept,
    required this.r2Score,
    required this.equation,
    required this.scatterPoints,
    required this.regressionLine,
  });

  factory LinearRegressionSummary.fromJson(Map<String, dynamic> json) {
    return LinearRegressionSummary(
      slope: (json['slope'] as num).toDouble(),
      intercept: (json['intercept'] as num).toDouble(),
      r2Score: (json['r2_score'] as num).toDouble(),
      equation: json['equation'] as String,
      scatterPoints: (json['scatter_points'] as List<dynamic>)
          .map((e) => RegressionPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
      regressionLine: (json['regression_line'] as List<dynamic>)
          .map((e) => RegressionPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AnalyticsData {
  final String city;
  final List<TrendPoint> trend7d;
  final List<TrendPoint> trend30d;
  final List<CityComparison> cityComparisons;
  final List<String> corrLabels;
  final List<List<double>> corrMatrix;
  final LinearRegressionSummary linearRegression;

  const AnalyticsData({
    required this.city,
    required this.trend7d,
    required this.trend30d,
    required this.cityComparisons,
    required this.corrLabels,
    required this.corrMatrix,
    required this.linearRegression,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    final corr = json['correlation_matrix'] as Map<String, dynamic>;
    return AnalyticsData(
      city: json['city'] as String,
      trend7d: (json['trend_7d'] as List<dynamic>)
          .map((e) => TrendPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
      trend30d: (json['trend_30d'] as List<dynamic>)
          .map((e) => TrendPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
      cityComparisons: (json['city_comparisons'] as List<dynamic>)
          .map((e) => CityComparison.fromJson(e as Map<String, dynamic>))
          .toList(),
      corrLabels: (corr['labels'] as List<dynamic>).map((e) => e.toString()).toList(),
      corrMatrix: (corr['matrix'] as List<dynamic>)
          .map((row) => (row as List<dynamic>).map((v) => (v as num).toDouble()).toList())
          .toList(),
      linearRegression: LinearRegressionSummary.fromJson(
        json['linear_regression'] as Map<String, dynamic>,
      ),
    );
  }
}
