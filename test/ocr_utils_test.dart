import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:scanly/ocr_utils.dart';

void main() {
  test('preprocess returns a file', () async {
    final file = File('test/assets/test.png');
    final pre = await OcrUtils.preprocess(file);
    expect(pre, isA<File>());
    expect(await pre.exists(), isTrue);
  });
}
