import 'package:flutter/material.dart';
import 'models/aqi_models.dart';
import 'screens/analytics_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/predictor_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const VayuTrackApp());
}

class VayuTrackApp extends StatelessWidget {
  const VayuTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VayuTrack AQI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.build(),
      home: const VayuTrackShell(),
    );
  }
}

class VayuTrackShell extends StatefulWidget {
  const VayuTrackShell({super.key});

  @override
  State<VayuTrackShell> createState() => _VayuTrackShellState();
}

class _VayuTrackShellState extends State<VayuTrackShell> {
  final ApiService _apiService = ApiService();

  int _tabIndex = 0;
  List<CityAqiData> _cities = [];
  CityAqiData? _selectedCity;
  AnalyticsData? _analytics;
  bool _loadingCities = true;
  bool _loadingAnalytics = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _loadingCities = true;
      _error = null;
    });

    try {
      final cities = await _apiService.fetchCities();
      if (!mounted) return;
      final defaultCity = cities.firstWhere(
        (c) => c.city.toLowerCase() == 'delhi',
        orElse: () => cities.first,
      );
      setState(() {
        _cities = cities;
        _selectedCity = defaultCity;
        _loadingCities = false;
      });
      await _loadAnalytics(defaultCity.city);
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingCities = false;
          _error = 'Failed to connect to Flask server at ${ApiService.baseUrl}: $e';
        });
      }
    }
  }

  Future<void> _loadAnalytics(String cityName) async {
    setState(() => _loadingAnalytics = true);
    try {
      final analytics = await _apiService.fetchAnalytics(cityName);
      if (mounted) {
        setState(() {
          _analytics = analytics;
          _loadingAnalytics = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loadingAnalytics = false);
      }
    }
  }

  void _handleCityChanged(CityAqiData city) {
    setState(() => _selectedCity = city);
    _loadAnalytics(city.city);
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      _loadingCities
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off, size: 48, color: AppColors.copperwood),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadInitialData,
                          child: const Text('Retry Connection'),
                        ),
                      ],
                    ),
                  ),
                )
              : DashboardScreen(
                  cities: _cities,
                  selectedCity: _selectedCity,
                  onCityChanged: _handleCityChanged,
                  onRefresh: _loadInitialData,
                ),
      PredictorScreen(apiService: _apiService),
      AnalyticsScreen(
        analytics: _analytics,
        isLoading: _loadingAnalytics,
        selectedCity: _selectedCity?.city ?? 'Delhi',
        onRetry: () => _loadAnalytics(_selectedCity?.city ?? 'Delhi'),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('VayuTrack'),
            Text(
              'SMART AQI & ML ALERT SYSTEM',
              style: TextStyle(
                fontSize: 10,
                letterSpacing: 1.1,
                color: AppColors.secondaryFixed,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _loadInitialData,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Telemetry',
          ),
        ],
      ),
      body: IndexedStack(
        index: _tabIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (idx) => setState(() => _tabIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.tune_outlined),
            selectedIcon: Icon(Icons.tune),
            label: 'Predictor',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Analytics',
          ),
        ],
      ),
    );
  }
}
