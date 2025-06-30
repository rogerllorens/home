import 'package:hive/hive.dart';

class StatsHelper {
  static Box get _box => Hive.box('stats');

  static void recordScan(String mode) {
    final now = DateTime.now();
    final dayKey = _dayKey(now);
    final weekKey = _weekKey(now);
    final daily = Map<String, int>.from(_box.get('daily', defaultValue: {}));
    daily[dayKey] = (daily[dayKey] ?? 0) + 1;
    _box.put('daily', daily);
    final weekly = Map<String, int>.from(_box.get('weekly', defaultValue: {}));
    weekly[weekKey] = (weekly[weekKey] ?? 0) + 1;
    _box.put('weekly', weekly);
    final modes = Map<String, int>.from(_box.get('modes', defaultValue: {}));
    modes[mode] = (modes[mode] ?? 0) + 1;
    _box.put('modes', modes);
  }

  static void recordOpenTime(Duration duration) {
    final times = List<int>.from(_box.get('openTimes', defaultValue: []));
    times.add(duration.inMilliseconds);
    _box.put('openTimes', times);
  }

  static List<int> getOpenTimes() {
    return List<int>.from(_box.get('openTimes', defaultValue: []));
  }

  static Map<String, int> getDailyCounts(int days) {
    final daily = Map<String, int>.from(_box.get('daily', defaultValue: {}));
    final now = DateTime.now();
    return Map.fromEntries(List.generate(days, (i) {
      final date = now.subtract(Duration(days: days - 1 - i));
      final key = _dayKey(date);
      return MapEntry(key, daily[key] ?? 0);
    }));
  }

  static Map<String, int> getWeeklyCounts(int weeks) {
    final weekly = Map<String, int>.from(_box.get('weekly', defaultValue: {}));
    final now = DateTime.now();
    return Map.fromEntries(List.generate(weeks, (i) {
      final date = now.subtract(Duration(days: (weeks - 1 - i) * 7));
      final key = _weekKey(date);
      return MapEntry(key, weekly[key] ?? 0);
    }));
  }

  static Map<String, int> getModeCounts() {
    return Map<String, int>.from(_box.get('modes', defaultValue: {}));
  }

  static int getMonthlyTotal(DateTime month) {
    final weekly = Map<String, int>.from(_box.get('weekly', defaultValue: {}));
    int total = 0;
    weekly.forEach((k, v) {
      if (k.startsWith('${month.year}-')) {
        final parts = k.split('W');
        if (parts.length == 2) {
          final weekDate = _firstDateOfWeek(int.parse(parts[1]), month.year);
          if (weekDate.month == month.month) {
            total += v;
          }
        }
      }
    });
    return total;
  }

  static void clear() {
    _box.clear();
  }

  static String _dayKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  static String _weekKey(DateTime d) {
    final week = _weekNumber(d);
    return '${d.year}-W$week';
  }

  static int _weekNumber(DateTime date) {
    final firstDay = DateTime(date.year, 1, 1);
    final days = date.difference(firstDay).inDays + firstDay.weekday - 1;
    return (days ~/ 7) + 1;
  }

  static DateTime _firstDateOfWeek(int week, int year) {
    final firstDay = DateTime(year, 1, 1);
    final days = (week - 1) * 7 - (firstDay.weekday - 1);
    return firstDay.add(Duration(days: days));
  }
}
