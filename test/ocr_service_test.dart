import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:scanly/services/ocr_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('OCRService returns map with text and language', () async {
    final file = File('test/assets/test.png');
    final service = OcrService();
    final result = await service.detectText(file);
    expect(result, isA<Map<String, String>>());
  });
}
