import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' show Offset, Rect;

import 'package:flutter/foundation.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:uuid/uuid.dart';

class PdfEditorService {
  PdfEditorService() : _document = PdfDocument();

  final PdfDocument _document;

  Future<void> addPdf(File file) async {
    final bytes = await file.readAsBytes();
    final loaded = PdfDocument(inputBytes: bytes);
    _document.appendDocument(loaded);
    loaded.dispose();
  }

  Future<PdfDocument> export() async => _document;

  static Future<List<File>> splitPdf(File file, {required List<int> pageBreaks}) async {
    final bytes = await file.readAsBytes();
    final source = PdfDocument(inputBytes: bytes);
    final outputs = <File>[];
    final total = source.pages.count;
    final breaks = [...pageBreaks]..sort();
    final ranges = <List<int>>[];
    var start = 0;
    for (final b in breaks) {
      ranges.add([start, b]);
      start = b;
    }
    ranges.add([start, total]);

    final tempDir = await getTemporaryDirectory();
    final uuid = const Uuid();

    for (final range in ranges) {
      final target = PdfDocument();
      for (var pageIndex = range.first; pageIndex < range.last; pageIndex++) {
        target.appendDocument(source, pageIndex, pageIndex);
      }
      final fileName = 'Split-${uuid.v4()}.pdf';
      final output = File(path.join(tempDir.path, fileName));
      await output.writeAsBytes(target.saveSync(), flush: true);
      target.dispose();
      outputs.add(output);
    }
    source.dispose();
    return outputs;
  }

  static Future<PdfDocument> textFromImage(Uint8List imageBytes) async {
    final tempDir = await getTemporaryDirectory();
    final imageFile = File(path.join(tempDir.path, 'ocr-${DateTime.now().millisecondsSinceEpoch}.png'));
    await imageFile.writeAsBytes(imageBytes, flush: true);

    final recognizer = TextRecognizer();
    final recognized = await recognizer.processImage(InputImage.fromFile(imageFile));
    await recognizer.close();

    final pdf = PdfDocument();
    final page = pdf.pages.add();
    page.graphics.drawString(
      recognized.text,
      PdfStandardFont(PdfFontFamily.helvetica, 14),
      brush: PdfSolidBrush(PdfColor(0, 0, 0)),
      bounds: const Rect.fromLTWH(0, 0, 500, 700),
    );
    return pdf;
  }

  static Future<Uint8List> addWatermark(Uint8List bytes, {required String watermark}) async {
    final document = PdfDocument(inputBytes: bytes);
    for (var i = 0; i < document.pages.count; i++) {
      final page = document.pages[i];
      page.graphics.save();
      page.graphics.setTransparency(0.1);
      page.graphics.rotateTransform(-20);
      page.graphics.drawString(
        watermark,
        PdfStandardFont(PdfFontFamily.helvetica, 48, style: PdfFontStyle.bold),
        brush: PdfSolidBrush(PdfColor(92, 108, 255)),
        bounds: Rect.fromLTWH(-200, page.size.height / 2, page.size.width * 1.5, 100),
      );
      page.graphics.restore();
    }
    final output = Uint8List.fromList(document.saveSync());
    document.dispose();
    return output;
  }

  static Future<Uint8List> addPageNumbers(Uint8List bytes) async {
    final document = PdfDocument(inputBytes: bytes);
    for (var i = 0; i < document.pages.count; i++) {
      final page = document.pages[i];
      final template = PdfPageTemplateElement(const Rect.fromLTWH(0, 0, 500, 40));
      template.graphics.drawRectangle(
        brush: PdfSolidBrush(PdfColor(27, 33, 64)),
        bounds: const Rect.fromLTWH(340, 5, 160, 30),
      );
      template.graphics.drawString(
        'Página ${i + 1} / ${document.pages.count}',
        PdfStandardFont(PdfFontFamily.helvetica, 12),
        brush: PdfSolidBrush(PdfColor(255, 255, 255)),
        bounds: const Rect.fromLTWH(350, 10, 150, 20),
      );
      page.graphics.drawPdfTemplate(template, Offset(page.size.width - 200, page.size.height - 50));
    }
    final output = Uint8List.fromList(document.saveSync());
    document.dispose();
    return output;
  }
}
