import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/mood_model.dart';

class MoodGraph extends StatelessWidget {
  final List<MoodEntry> entries;
  const MoodGraph({super.key, required this.entries});

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const SizedBox(height: 150, child: Center(child: Text('Sin datos')));
    }
    final spots = entries
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value.mood.toDouble()))
        .toList();
    return AspectRatio(
      aspectRatio: 1.7,
      child: LineChart(
        LineChartData(
          minY: 1,
          maxY: 5,
          gridData: FlGridData(show: true),
          titlesData: FlTitlesData(
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  final idx = value.toInt();
                  if (idx >= 0 && idx < entries.length) {
                    final date = entries[idx].time;
                    return Text(DateFormat('MM/dd').format(date),
                        style: const TextStyle(fontSize: 10));
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  const map = {
                    1: '😢',
                    2: '😔',
                    3: '😐',
                    4: '😊',
                    5: '😃'
                  };
                  return Text(map[value.toInt()] ?? '',
                      style: const TextStyle(fontSize: 12));
                },
              ),
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              barWidth: 3,
              dotData: FlDotData(show: true),
              color: Colors.blue,
            ),
          ],
          lineTouchData: LineTouchData(
            enabled: true,
            touchTooltipData: LineTouchTooltipData(
              tooltipBgColor: Colors.blueAccent.withOpacity(0.8),
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((touched) {
                  final date = entries[touched.spotIndex].time;
                  return LineTooltipItem(
                    '${DateFormat('MM/dd – HH:mm').format(date)}\nÁnimo: ${touched.y.toInt()}',
                    const TextStyle(color: Colors.white),
                  );
                }).toList();
              },
            ),
          ),
          swapAnimationDuration: const Duration(milliseconds: 500),
          swapAnimationCurve: Curves.easeInOut,
        ),
      ),
    );
  }
}
