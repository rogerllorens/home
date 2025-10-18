import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

import '../../../core/services/document_service.dart';
import '../models/document_file.dart';
import '../widgets/annotation_toolbar.dart';

class DocumentViewerScreen extends HookConsumerWidget {
  const DocumentViewerScreen({super.key, required this.documentId});

  final String documentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pdfController = useMemoized(SfPdfViewerController.new);
    final service = ref.watch(documentServiceProvider);
    final futureDoc = useMemoized(() => service.getDocumentById(documentId), [service, documentId]);
    final snapshot = useFuture(futureDoc);

    final document = snapshot.data;
    if (snapshot.connectionState != ConnectionState.done) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (document == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Documento no encontrado.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(document.name),
        actions: [
          IconButton(
            onPressed: () => ref.read(documentServiceProvider).toggleFavorite(document),
            icon: Icon(document.isFavorite ? Icons.star : Icons.star_border),
          ),
          IconButton(
            onPressed: () async => _shareDocument(document, ref),
            icon: const Icon(Icons.share_outlined),
          ),
          PopupMenuButton<String>(
            onSelected: (value) => _handleMenuSelection(context, value, document, ref),
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'compress', child: Text('Comprimir PDF')),
              PopupMenuItem(value: 'merge', child: Text('Fusionar con...')),
              PopupMenuItem(value: 'split', child: Text('Dividir PDF')),
              PopupMenuItem(value: 'watermark', child: Text('Añadir marca de agua')),
              PopupMenuItem(value: 'page_numbers', child: Text('Numerar páginas')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SfPdfViewer.file(
              File(document.path),
              controller: pdfController,
              canShowScrollStatus: true,
              canShowPaginationDialog: true,
              enableTextSelection: true,
              enableHyperlinkNavigation: true,
            ),
          ),
          AnnotationToolbar(
            onHighlight: () {
              pdfController.setZoomLevel(pdfController.zoomLevel + 0.2);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Acercando para resaltar. Usa la selección para aplicar color.')));
            },
            onUnderline: () => pdfController.jumpToPage(1),
            onFreehand: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El modo de dibujo llegará en la próxima versión.')));
            },
            onSign: () => _showSignatureDialog(context, document, ref),
          ),
        ],
      ),
    );
  }

  Future<void> _shareDocument(DocumentFile doc, WidgetRef ref) async {
    await ref.read(documentServiceProvider).shareDocument(doc);
  }

  Future<void> _handleMenuSelection(BuildContext context, String value, DocumentFile doc, WidgetRef ref) async {
    switch (value) {
      case 'compress':
        await ref.read(documentServiceProvider).compressPdf(doc);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PDF comprimido')));
        }
        break;
      case 'merge':
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Selecciona otros documentos desde la pantalla principal.')),
          );
        }
        break;
      case 'split':
        final source = PdfDocument(inputBytes: await File(doc.path).readAsBytes());
        final totalPages = source.pages.count;
        source.dispose();
        if (totalPages > 1) {
          final middle = (totalPages / 2).ceil();
          await ref.read(documentServiceProvider).splitPdf(doc, pageBreaks: [middle]);
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El PDF necesita al menos 2 páginas.')));
          }
        }
        break;
      case 'watermark':
        await ref.read(documentServiceProvider).addWatermark(doc, watermark: 'A+ Read');
        break;
      case 'page_numbers':
        await ref.read(documentServiceProvider).addPageNumbers(doc);
        break;
    }
  }

  Future<void> _showSignatureDialog(BuildContext context, DocumentFile doc, WidgetRef ref) async {
    final signature = await showDialog<Uint8List>(
      context: context,
      builder: (context) => const _SignatureDialog(),
    );
    if (signature != null) {
      final pdf = await PdfSignatureComposer.applySignature(File(doc.path), signature);
      await ref.read(documentServiceProvider).createFromPdfBytes(pdf, name: 'Signed-${doc.name}');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Documento firmado')));
      }
    }
  }
}

class _SignatureDialog extends StatefulWidget {
  const _SignatureDialog();

  @override
  State<_SignatureDialog> createState() => _SignatureDialogState();
}

class _SignatureDialogState extends State<_SignatureDialog> {
  final points = <ui.Offset>[];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Firma digital'),
      content: SizedBox(
        width: 320,
        height: 180,
        child: GestureDetector(
          onPanUpdate: (details) => setState(() => points.add(details.localPosition)),
          onPanEnd: (_) => points.add(ui.Offset.zero),
          child: CustomPaint(
            painter: _SignaturePainter(points),
            child: Container(color: Colors.grey.shade200),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () async {
            final signature = await _renderSignature();
            if (context.mounted) Navigator.pop(context, signature);
          },
          child: const Text('Guardar'),
        ),
      ],
    );
  }

  Future<Uint8List> _renderSignature() async {
    final recorder = ui.PictureRecorder();
    final canvas = ui.Canvas(recorder);
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    ui.Offset? previous;
    for (final point in points) {
      if (point == ui.Offset.zero) {
        previous = null;
        continue;
      }
      if (previous == null) {
        previous = point;
        continue;
      }
      canvas.drawLine(previous, point, paint);
      previous = point;
    }
    final picture = recorder.endRecording();
    final image = await picture.toImage(600, 300);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData!.buffer.asUint8List();
  }
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.points);

  final List<ui.Offset> points;

  @override
  void paint(ui.Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < points.length - 1; i++) {
      if (points[i] != ui.Offset.zero && points[i + 1] != ui.Offset.zero) {
        canvas.drawLine(points[i], points[i + 1], paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}

class PdfSignatureComposer {
  static Future<Uint8List> applySignature(File file, Uint8List signature) async {
    final document = PdfDocument(inputBytes: await file.readAsBytes());
    final page = document.pages[document.pages.count - 1];
    final image = PdfBitmap(signature);
    page.graphics.drawImage(image, ui.Rect.fromLTWH(40, page.size.height - 160, 180, 120));
    final output = Uint8List.fromList(document.saveSync());
    document.dispose();
    return output;
  }
}
