import 'package:flutter/material.dart';
import '../models/aqi_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class _ScenarioOption {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final PollutantMetrics metrics;

  const _ScenarioOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.metrics,
  });
}

const _scenarios = [
  _ScenarioOption(
    id: 'stubble',
    title: 'Winter Stubble Spike',
    subtitle: 'High biomass smoke under stagnant boundary-layer inversion.',
    icon: Icons.local_fire_department,
    color: AppColors.copperwood,
    metrics: PollutantMetrics(pm25: 260, pm10: 380, no2: 85, so2: 35, co: 3.6, o3: 45),
  ),
  _ScenarioOption(
    id: 'diwali',
    title: 'Diwali Eve Peak',
    subtitle: 'Extreme acute particulate and sulfur burst during nocturnal calm.',
    icon: Icons.warning_rounded,
    color: AppColors.severeRed,
    metrics: PollutantMetrics(pm25: 410, pm10: 540, no2: 145, so2: 92, co: 6.2, o3: 75),
  ),
  _ScenarioOption(
    id: 'traffic',
    title: 'Urban Morning Traffic Peak',
    subtitle: 'Elevated vehicular NO₂ and CO along dense metro corridors.',
    icon: Icons.air,
    color: AppColors.sunlitClay,
    metrics: PollutantMetrics(pm25: 140, pm10: 220, no2: 95, so2: 24, co: 2.6, o3: 52),
  ),
  _ScenarioOption(
    id: 'monsoon',
    title: 'Post-Monsoon Clear',
    subtitle: 'Wet deposition washout restoring baseline CPCB breathable air.',
    icon: Icons.water_drop,
    color: AppColors.oliveLeaf,
    metrics: PollutantMetrics(pm25: 28, pm10: 45, no2: 20, so2: 8, co: 0.6, o3: 22),
  ),
];

class PredictorScreen extends StatefulWidget {
  final ApiService apiService;

  const PredictorScreen({super.key, required this.apiService});

  @override
  State<PredictorScreen> createState() => _PredictorScreenState();
}

class _PredictorScreenState extends State<PredictorScreen> {
  _ScenarioOption _selected = _scenarios[2];
  bool _isPredicting = false;
  PredictionResult? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    _runPrediction(_selected);
  }

  Future<void> _runPrediction(_ScenarioOption scenario) async {
    setState(() {
      _selected = scenario;
      _isPredicting = true;
      _error = null;
    });
    try {
      final res = await widget.apiService.predictAqi(scenario.metrics);
      if (mounted) {
        setState(() => _result = res);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Could not reach ML backend: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isPredicting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Text(
          'AI Atmospheric Forecaster & Predictor',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 4),
        Text(
          'Select an atmospheric scenario to run Random Forest inference via Flask API.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 14),

        // Atmospheric Scenarios List
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.cardSurface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Atmospheric Scenarios', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 10),
              ..._scenarios.map((scenario) {
                final isSelected = scenario.id == _selected.id;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => _runPrediction(scenario),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.blackForest : AppColors.recessedWell,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.darkInset : AppColors.cornsilk,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              scenario.icon,
                              color: isSelected ? AppColors.sunlitClay : scenario.color,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  scenario.title,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: isSelected ? AppColors.cornsilk : AppColors.blackForest,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  scenario.subtitle,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isSelected
                                        ? AppColors.cornsilk.withValues(alpha: 0.8)
                                        : AppColors.mutedText,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Predict CTA Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isPredicting ? null : () => _runPrediction(_selected),
            icon: _isPredicting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.cornsilk),
                  )
                : const Icon(Icons.auto_awesome),
            label: Text(_isPredicting ? 'Running Random Forest...' : 'Predict AQI & Health Advisory'),
          ),
        ),
        const SizedBox(height: 16),

        if (_error != null)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.severeRed.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(_error!, style: const TextStyle(color: AppColors.severeRed)),
          ),

        if (_result != null) _PredictionOutputCard(result: _result!),
      ],
    );
  }
}

class _PredictionOutputCard extends StatelessWidget {
  final PredictionResult result;

  const _PredictionOutputCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final catColor = AppColors.fromCategory(result.category);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2D3D1B), Color(0xFF202C13)],
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.blackForest.withValues(alpha: 0.35),
            offset: const Offset(6, 8),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'RANDOM FOREST PROJECTION',
                style: TextStyle(
                  color: AppColors.sunlitClay,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                ),
              ),
              Text(
                'Confidence ${result.confidence.toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: AppColors.secondaryFixed,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    result.predictedAqi.round().toString(),
                    style: const TextStyle(
                      color: AppColors.cornsilk,
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Predicted AQI Index',
                    style: TextStyle(color: AppColors.sunlitClay, fontSize: 12),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: catColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  result.category.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.cornsilk,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.darkInset,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              result.healthAlert,
              style: const TextStyle(
                color: AppColors.cornsilk,
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
