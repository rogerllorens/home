import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:scanly/stats.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('StatsHelper records scans and times', () async {
    final dir = await Directory.systemTemp.createTemp();
    Hive.init(dir.path);
    await Hive.openBox('stats');
    StatsHelper.recordScan('qr');
    StatsHelper.recordOpenTime(Duration(milliseconds: 100));
    final daily = StatsHelper.getDailyCounts(1);
    expect(daily.values.first, 1);
    final times = StatsHelper.getOpenTimes();
    expect(times.last, 100);
    await Hive.box('stats').close();
    await dir.delete(recursive: true);
  });
}
