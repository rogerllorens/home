import 'dart:io';
import 'package:image/image.dart' as img;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:flutter_tesseract_ocr/flutter_tesseract_ocr.dart';
import 'package:flutter/foundation.dart';

class OcrUtils {
  /// Preprocess an image for better OCR results.
  static Future<File> preprocess(File file, {bool invert = false}) async {
    return compute(_heavyPreprocess, {'path': file.path, 'invert': invert});
  }

  static Future<File> _heavyPreprocess(Map args) async {
    final file = File(args['path'] as String);
    final invert = args['invert'] as bool;
    final bytes = await file.readAsBytes();
    img.Image? image = img.decodeImage(bytes);
    if (image == null) return file;
    if (image.width < 1200 && image.height < 1200) {
      image = img.copyResize(image,
          width: image.width * 2,
          height: image.height * 2,
          interpolation: img.Interpolation.average);
    }
    image = img.grayscale(image);
    if (invert) image = img.invert(image);
    image = img.gaussianBlur(image, 1);
    image = img.threshold(image);
    final dir = await getTemporaryDirectory();
    final out = File(p.join(dir.path, 'pre_${p.basename(file.path)}'));
    await out.writeAsBytes(img.encodeJpg(image, quality: 100));
    return out;
  }

  /// Run OCR using Tesseract as a fallback when ML Kit is not enough.
  static Future<String> tesseract(File file, {String language = 'eng'}) async {
    try {
      return await FlutterTesseractOcr.extractText(file.path, language: language);
    } catch (_) {
      return '';
    }
  }

  /// Simple lexical correction using a set of common words
  static String correctText(String text) {
    final dictionary = {
      'the', 'and', 'or', 'invoice', 'date', 'total', 'amount', 'name',
      'street', 'phone', 'email'
    };
    return text
        .split(RegExp(r'\s+'))
        .map((word) {
          final lower = word.toLowerCase();
          if (dictionary.contains(lower)) return word;
          // naive correction: if word differs by 1 char
          for (final d in dictionary) {
            if (_levenshtein(lower, d) == 1) return d;
          }
          return word;
        })
        .join(' ');
  }

  static int _levenshtein(String s, String t) {
    final m = s.length;
    final n = t.length;
    var dp = List.generate(m + 1, (_) => List<int>.filled(n + 1, 0));
    for (var i = 0; i <= m; i++) dp[i][0] = i;
    for (var j = 0; j <= n; j++) dp[0][j] = j;
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        final cost = s[i - 1] == t[j - 1] ? 0 : 1;
        dp[i][j] = [
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        ].reduce((a, b) => a < b ? a : b);
      }
    }
    return dp[m][n];
  }
}
