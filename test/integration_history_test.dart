import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:scanly/stats.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('StatsHelper records daily scan', () async {
    final dir = await Directory.systemTemp.createTemp();
    Hive.init(dir.path);
    await Hive.openBox('stats');

    StatsHelper.recordScan('qr');
    final daily = StatsHelper.getDailyCounts(1);
    expect(daily.values.first, 1);

    await Hive.box('stats').close();
    await dir.delete(recursive: true);
  });
}
