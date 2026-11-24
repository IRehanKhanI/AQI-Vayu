import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/aqi_models.dart';

class ApiService {
  // Android emulator uses 10.0.2.2 to reach host localhost:5000;
  // iOS simulator, desktop, and web use 127.0.0.1:5000.
  static String get baseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://127.0.0.1:5000';
  }

  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  Future<List<CityAqiData>> fetchCities() async {
    final uri = Uri.parse('$baseUrl/api/cities');
    final response = await _client.get(uri).timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw Exception('Failed to load cities (${response.statusCode})');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final list = decoded['cities'] as List<dynamic>;
    return list
        .map((e) => CityAqiData.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PredictionResult> predictAqi(PollutantMetrics metrics) async {
    final uri = Uri.parse('$baseUrl/api/predict');
    final response = await _client
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(metrics.toJson()),
        )
        .timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw Exception('Prediction failed (${response.statusCode})');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return PredictionResult.fromJson(decoded);
  }

  Future<AnalyticsData> fetchAnalytics(String city) async {
    final uri = Uri.parse('$baseUrl/api/analytics?city=${Uri.encodeComponent(city)}');
    final response = await _client.get(uri).timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw Exception('Failed to load analytics (${response.statusCode})');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return AnalyticsData.fromJson(decoded);
  }
}
