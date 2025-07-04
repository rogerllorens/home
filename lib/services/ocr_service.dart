import 'dart:io';
import 'package:google_ml_kit/google_ml_kit.dart';
import 'package:google_mlkit_language_id/google_mlkit_language_id.dart';
import 'package:google_mlkit_translation/google_mlkit_translation.dart';
import '../ocr_utils.dart';

class OcrService {
  Future<Map<String, String>> detectText(File file, {bool invert = false}) async {
    // Preprocess
    final pre = await OcrUtils.preprocess(file, invert: invert);
    final input = InputImage.fromFile(pre);
    final textRecognizer = GoogleMlKit.vision.textRecognizer();
    final text = await textRecognizer.processImage(input);
    await textRecognizer.close();
    var result = text.text;
    if (result.isEmpty) {
      result = await OcrUtils.tesseract(pre);
    }
    if (result.isEmpty) return {};
    result = OcrUtils.correctText(result);
    final identifier = LanguageIdentifier(confidenceThreshold: 0.5);
    final lang = await identifier.identifyLanguage(result);
    await identifier.close();
    return {'text': result, 'language': lang};
  }

  Future<String> translate(String text, String lang, String target) async {
    final source = TranslateLanguage.values.firstWhere(
        (l) => l.bcpCode == lang,
        orElse: () => TranslateLanguage.english);
    final tgt = TranslateLanguage.values.firstWhere(
        (l) => l.bcpCode == target,
        orElse: () => TranslateLanguage.spanish);
    final translator = OnDeviceTranslator(sourceLanguage: source, targetLanguage: tgt);
    await translator.downloadModelIfNeeded();
    final result = await translator.translateText(text);
    await translator.close();
    return result;
  }
}
