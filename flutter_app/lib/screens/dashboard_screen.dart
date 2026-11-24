import 'package:flutter/material.dart';
import '../models/aqi_models.dart';
import '../theme/app_theme.dart';
import '../widgets/aqi_gauge_card.dart';

class DashboardScreen extends StatelessWidget {
  final List<CityAqiData> cities;
  final CityAqiData? selectedCity;
  final ValueChanged<CityAqiData> onCityChanged;
  final VoidCallback onRefresh;

  const DashboardScreen({
    super.key,
    required this.cities,
    required this.selectedCity,
    required this.onCityChanged,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final city = selectedCity;
    if (city == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final p = city.pollutants;
    final pollutantCards = [
      _PollutantTileData('PM2.5', 'Fine Dust', p.pm25, 'µg/m³', 60, (p.pm25 / 250).clamp(0.05, 1.0)),
      _PollutantTileData('PM10', 'Coarse Dust', p.pm10, 'µg/m³', 100, (p.pm10 / 400).clamp(0.05, 1.0)),
      _PollutantTileData('NO₂', 'Vehicular', p.no2, 'µg/m³', 80, (p.no2 / 150).clamp(0.05, 1.0)),
      _PollutantTileData('SO₂', 'Industrial', p.so2, 'µg/m³', 80, (p.so2 / 100).clamp(0.05, 1.0)),
      _PollutantTileData('CO', 'Carbon Monox.', p.co, 'mg/m³', 2.0, (p.co / 5.0).clamp(0.05, 1.0)),
      _PollutantTileData('O₃', 'Ground Ozone', p.o3, 'µg/m³', 100, (p.o3 / 120).clamp(0.05, 1.0)),
    ];

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      color: AppColors.copperwood,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          // City Dropdown Selector Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.cardSurface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
              boxShadow: [
                BoxShadow(
                  color: AppColors.blackForest.withValues(alpha: 0.1),
                  offset: const Offset(4, 4),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.oliveLeaf,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.location_on, color: AppColors.cornsilk),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: city.city,
                      isExpanded: true,
                      dropdownColor: AppColors.cardSurface,
                      icon: const Icon(Icons.expand_more, color: AppColors.blackForest),
                      items: cities.map((c) {
                        return DropdownMenuItem(
                          value: c.city,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${c.city} · ${c.station}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: AppColors.blackForest,
                                ),
                              ),
                              Text(
                                'CPCB Telemetry · ${c.date}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.mutedText,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value == null) return;
                        final match = cities.firstWhere((c) => c.city == value);
                        onCityChanged(match);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Weather Telemetry Strip
          Row(
            children: [
              _WeatherMiniCard(icon: Icons.thermostat, label: 'TEMP', value: '${city.tempC}°C'),
              const SizedBox(width: 8),
              _WeatherMiniCard(icon: Icons.water_drop_outlined, label: 'HUMIDITY', value: '${city.humidityPct}%'),
              const SizedBox(width: 8),
              _WeatherMiniCard(icon: Icons.air, label: 'WIND', value: '${city.windKmh} km/h'),
            ],
          ),
          const SizedBox(height: 16),

          // AQI Gauge + Health Alert Banner
          AqiGaugeCard(
            aqi: city.aqi,
            category: city.category,
            primaryPollutant: p.pm25 >= p.pm10 * 0.6 ? 'PM2.5 (Fine Inhalable)' : 'PM10 (Coarse Dust)',
            healthAlert: city.alert,
          ),
          const SizedBox(height: 20),

          // 6-Pollutant Breakdown Grid
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Pollutant Breakdown', style: Theme.of(context).textTheme.titleLarge),
              Text(
                '24H AVERAGES',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.oliveLeaf,
                      letterSpacing: 0.8,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: pollutantCards.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.32,
            ),
            itemBuilder: (context, index) {
              final item = pollutantCards[index];
              final ratio = item.value / item.limit;
              final statusColor = ratio <= 0.7
                  ? AppColors.oliveLeaf
                  : ratio <= 1.5
                      ? AppColors.sunlitClay
                      : AppColors.copperwood;
              final statusLabel = ratio <= 0.7
                  ? 'Good'
                  : ratio <= 1.5
                      ? 'Moderate'
                      : '${ratio.toStringAsFixed(1)}x Limit';

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF32441F), Color(0xFF222F14)],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.blackForest.withValues(alpha: 0.25),
                      offset: const Offset(4, 4),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              style: const TextStyle(
                                color: AppColors.secondaryFixed,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              item.subtitle,
                              style: TextStyle(
                                color: AppColors.cornsilk.withValues(alpha: 0.7),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusColor,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            statusLabel,
                            style: const TextStyle(
                              color: AppColors.cornsilk,
                              fontWeight: FontWeight.w700,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          item.name == 'CO'
                              ? item.value.toStringAsFixed(1)
                              : item.value.round().toString(),
                          style: const TextStyle(
                            color: AppColors.cornsilk,
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          item.unit,
                          style: const TextStyle(
                            color: AppColors.secondaryFixed,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: item.fill,
                        minHeight: 7,
                        backgroundColor: AppColors.darkInset,
                        valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _WeatherMiniCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _WeatherMiniCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.cardSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
        ),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: AppColors.recessedWell,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 17, color: AppColors.oliveLeaf),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: AppColors.mutedText),
                  ),
                  Text(
                    value,
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.blackForest),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PollutantTileData {
  final String name;
  final String subtitle;
  final double value;
  final String unit;
  final double limit;
  final double fill;

  _PollutantTileData(this.name, this.subtitle, this.value, this.unit, this.limit, this.fill);
}
