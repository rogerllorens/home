import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';

class PdfOptimizerService {
  static Future<Uint8List> compress(Uint8List bytes) async {
    final document = PdfDocument(inputBytes: bytes);
    final options = PdfCompressionOptions(
      imageQuality: 50,
      optimizeFont: true,
      compressionLevel: PdfCompressionLevel.best,
    );
    document.compressionOptions = options;
    final output = Uint8List.fromList(document.saveSync());
    document.dispose();
    return output;
  }
}
