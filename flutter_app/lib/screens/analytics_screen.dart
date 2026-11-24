import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../models/aqi_models.dart';
import '../theme/app_theme.dart';

class AnalyticsScreen extends StatefulWidget {
  final AnalyticsData? analytics;
  final bool isLoading;
  final String selectedCity;
  final VoidCallback onRetry;

  const AnalyticsScreen({
    super.key,
    required this.analytics,
    required this.isLoading,
    required this.selectedCity,
    required this.onRetry,
  });

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _show30Days = false;

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final data = widget.analytics;
    if (data == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Unable to load analytics.'),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: widget.onRetry, child: const Text('Retry')),
          ],
        ),
      );
    }

    final trendPoints = _show30Days ? data.trend30d : data.trend7d;
    final topCities = data.cityComparisons.take(6).toList();
    final lr = data.linearRegression;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Text(
          'Pollution Trends & Health Regression',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 4),
        Text(
          'Historical AQI trajectory (${data.city}), city-wise comparison, correlation matrix, and Linear Regression mortality impact.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 14),

        // 1. Timeframe switcher + Line Chart
        _SectionCard(
          title: '${data.city} AQI History',
          subtitle: 'CPCB Daily Trajectory',
          trailing: SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: false, label: Text('7D')),
              ButtonSegment(value: true, label: Text('30D')),
            ],
            selected: {_show30Days},
            onSelectionChanged: (s) => setState(() => _show30Days = s.first),
          ),
          child: SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: 420,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 100,
                  getDrawingHorizontalLine: (v) => FlLine(
                    color: AppColors.blackForest.withValues(alpha: 0.12),
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                titlesData: FlTitlesData(
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 36,
                      interval: 100,
                      getTitlesWidget: (val, _) => Text(
                        val.toInt().toString(),
                        style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: (_show30Days ? 7 : 1).toDouble(),
                      getTitlesWidget: (val, _) {
                        final idx = val.toInt();
                        if (idx < 0 || idx >= trendPoints.length) return const SizedBox();
                        final label = trendPoints[idx].date.substring(5);
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            label,
                            style: const TextStyle(fontSize: 9.5, color: AppColors.mutedText),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: List.generate(
                      trendPoints.length,
                      (i) => FlSpot(i.toDouble(), trendPoints[i].aqi),
                    ),
                    isCurved: true,
                    color: AppColors.blackForest,
                    barWidth: 3,
                    dotData: FlDotData(
                      show: !_show30Days,
                      getDotPainter: (_, __, ___, ____) => FlDotCirclePainter(
                        radius: 4,
                        color: AppColors.sunlitClay,
                        strokeWidth: 2,
                        strokeColor: AppColors.blackForest,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.copperwood.withValues(alpha: 0.32),
                          AppColors.cornsilk.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 2. City-Wise Average AQI Bar Chart
        _SectionCard(
          title: 'Indian Cities Average AQI',
          subtitle: 'Inter-Metropolitan Comparison',
          child: SizedBox(
            height: 220,
            child: BarChart(
              BarChartData(
                maxY: 360,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 100,
                  getDrawingHorizontalLine: (v) => FlLine(
                    color: AppColors.blackForest.withValues(alpha: 0.1),
                    strokeWidth: 1,
                  ),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 36,
                      interval: 100,
                      getTitlesWidget: (v, _) => Text(
                        v.toInt().toString(),
                        style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (val, _) {
                        final idx = val.toInt();
                        if (idx < 0 || idx >= topCities.length) return const SizedBox();
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            topCities[idx].city.substring(0, topCities[idx].city.length.clamp(0, 5)),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.blackForest,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                barGroups: List.generate(topCities.length, (i) {
                  final c = topCities[i];
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: c.avgAqi,
                        width: 22,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                        color: AppColors.fromCategory(c.category),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 3. Pollutant Correlation Matrix Summary
        _SectionCard(
          title: 'Pollutant Correlation Matrix',
          subtitle: 'Pearson r across CPCB Features',
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const SizedBox(width: 54),
                    ...data.corrLabels.take(4).map(
                          (lbl) => SizedBox(
                            width: 62,
                            child: Center(
                              child: Text(
                                lbl,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ),
                  ],
                ),
                const SizedBox(height: 6),
                ...List.generate(4, (r) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 54,
                          child: Text(
                            data.corrLabels[r],
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ),
                        ...List.generate(4, (c) {
                          final val = data.corrMatrix[r][c];
                          final bg = val >= 0.75
                              ? AppColors.copperwood
                              : val >= 0.45
                                  ? AppColors.sunlitClay
                                  : AppColors.oliveLeaf;
                          final fg = val >= 0.45 && val < 0.75
                              ? AppColors.blackForest
                              : AppColors.cornsilk;
                          return Container(
                            width: 56,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: bg,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                val.toStringAsFixed(2),
                                style: TextStyle(
                                  color: fg,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11.5,
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 4. Linear Regression: PM2.5 vs Mortality Rate Scatter + Trendline
        _SectionCard(
          title: 'PM2.5 vs. Mortality Rate (Linear Regression)',
          subtitle: 'OLS Fit: ${lr.equation} · R² = ${lr.r2Score.toStringAsFixed(3)}',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 240,
                child: Stack(
                  children: [
                    // Underlying ScatterPlot
                    ScatterChart(
                      ScatterChartData(
                        minX: 0,
                        maxX: 220,
                        minY: 40,
                        maxY: 220,
                        gridData: FlGridData(
                          show: true,
                          horizontalInterval: 40,
                          verticalInterval: 50,
                          getDrawingHorizontalLine: (v) => FlLine(
                            color: AppColors.blackForest.withValues(alpha: 0.1),
                            strokeWidth: 1,
                          ),
                          getDrawingVerticalLine: (v) => FlLine(
                            color: AppColors.blackForest.withValues(alpha: 0.1),
                            strokeWidth: 1,
                          ),
                        ),
                        borderData: FlBorderData(
                          show: true,
                          border: Border(
                            left: BorderSide(color: AppColors.blackForest.withValues(alpha: 0.4)),
                            bottom: BorderSide(color: AppColors.blackForest.withValues(alpha: 0.4)),
                          ),
                        ),
                        titlesData: FlTitlesData(
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 34,
                              interval: 40,
                              getTitlesWidget: (v, _) => Text(
                                v.toInt().toString(),
                                style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                              ),
                            ),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              interval: 50,
                              getTitlesWidget: (v, _) => Text(
                                '${v.toInt()}',
                                style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                              ),
                            ),
                          ),
                        ),
                        scatterSpots: lr.scatterPoints.map((pt) {
                          final color = pt.pm25 > 120
                              ? AppColors.copperwood
                              : pt.pm25 > 60
                                  ? AppColors.sunlitClay
                                  : AppColors.oliveLeaf;
                          return ScatterSpot(
                            pt.pm25,
                            pt.mortality,
                            dotPainter: FlDotCirclePainter(
                              radius: 6,
                              color: color,
                              strokeWidth: 1.5,
                              strokeColor: AppColors.cornsilk,
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    // Overlaid Regression Trendline
                    IgnorePointer(
                      child: LineChart(
                        LineChartData(
                          minX: 0,
                          maxX: 220,
                          minY: 40,
                          maxY: 220,
                          gridData: const FlGridData(show: false),
                          titlesData: const FlTitlesData(show: false),
                          borderData: FlBorderData(show: false),
                          lineBarsData: [
                            LineChartBarData(
                              spots: lr.regressionLine
                                  .map((p) => FlSpot(p.pm25, p.mortality))
                                  .toList(),
                              color: AppColors.copperwood,
                              barWidth: 2.8,
                              dotData: const FlDotData(show: false),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Y: Mortality / 100,000',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.oliveLeaf),
                  ),
                  Text(
                    'X: Annual PM2.5 (µg/m³)',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.oliveLeaf),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget? trailing;
  final Widget child;

  const _SectionCard({
    required this.title,
    required this.subtitle,
    this.trailing,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardSurface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
        boxShadow: [
          BoxShadow(
            color: AppColors.blackForest.withValues(alpha: 0.08),
            offset: const Offset(4, 5),
            blurRadius: 12,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subtitle.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.oliveLeaf,
                        letterSpacing: 0.7,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(title, style: Theme.of(context).textTheme.titleLarge),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}
