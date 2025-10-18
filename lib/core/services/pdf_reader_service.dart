import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:pdfx/pdfx.dart';

import '../../features/document/models/document_file.dart';

class PdfReaderService {
  static Future<Uint8List?> generateThumbnail(File file, DocumentType type) async {
    if (type != DocumentType.pdf) {
      return null;
    }

    final document = await PdfDocument.openFile(file.path);
    final page = await document.getPage(1);
    final pageImage = await page.render(width: page.width, height: page.height, format: PdfPageImageFormat.png);
    await page.close();
    await document.close();
    return pageImage.bytes;
  }
}
