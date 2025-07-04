import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:scanly/sb_cache.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('SafeBrowsingCache returns cached result', () async {
    final dir = await Directory.systemTemp.createTemp();
    Hive.init(dir.path);
    await Hive.openBox('sb_cache');
    // set up mock client that should not be called
    SafeBrowsingCache.client = MockClient((request) async {
      return http.Response('{}', 200);
    });
    // put cached value
    Hive.box('sb_cache').put('http://foo', {'safe': false, 'ts': DateTime.now().toIso8601String()});
    final result = await SafeBrowsingCache.checkUrl('http://foo');
    expect(result, isFalse);
    await Hive.box('sb_cache').close();
    await dir.delete(recursive: true);
  });

  test('SafeBrowsingCache handles http response', () async {
    final dir = await Directory.systemTemp.createTemp();
    Hive.init(dir.path);
    await Hive.openBox('sb_cache');
    SafeBrowsingCache.client = MockClient((request) async {
      return http.Response('{"matches": []}', 200);
    });
    final result = await SafeBrowsingCache.checkUrl('http://bar');
    expect(result, isTrue);
    await Hive.box('sb_cache').close();
    await dir.delete(recursive: true);
  });
}

