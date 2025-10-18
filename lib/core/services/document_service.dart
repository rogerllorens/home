import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' show Rect;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:uuid/uuid.dart';

import '../../features/document/models/document_file.dart';
import 'pdf_editor_service.dart';
import 'pdf_optimizer_service.dart';
import 'pdf_reader_service.dart';

final documentServiceProvider = ChangeNotifierProvider<DocumentService>((ref) => DocumentService(ref));

class DocumentService extends ChangeNotifier {
  DocumentService(Ref _) {
    unawaited(_init());
  }
  final _uuid = const Uuid();
  final List<DocumentFile> _documents = [];
  bool _isLoading = false;
  bool _firstLaunch = true;

  bool get isLoading => _isLoading;
  bool get isFirstLaunch => _firstLaunch;
  List<DocumentFile> get documents => List.unmodifiable(_documents);

  Future<void> _init() async {
    await _loadCache();
    await scanLibrary();
  }

  Future<void> _loadCache() async {
    final prefs = await SharedPreferencesAsync.instance;
    _firstLaunch = !(await prefs.getBool('onboarding_completed') ?? false);
  }

  Future<void> completeOnboarding() async {
    final prefs = await SharedPreferencesAsync.instance;
    await prefs.setBool('onboarding_completed', true);
    _firstLaunch = false;
    notifyListeners();
  }

  Future<void> scanLibrary() async {
    _isLoading = true;
    notifyListeners();

    try {
      final docsDir = await getApplicationDocumentsDirectory();
      final files = await docsDir.list(recursive: true).toList();
      final mapped = await Future.wait(files.whereType<File>().map(_mapFileToDocument));
      _documents
        ..clear()
        ..addAll(mapped);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<DocumentFile> _mapFileToDocument(File file) async {
    final stats = await file.stat();
    final ext = path.extension(file.path).toLowerCase();
    final type = _detectType(ext);
    return DocumentFile(
      id: _uuid.v4(),
      name: path.basename(file.path),
      path: file.path,
      type: type,
      modifiedAt: stats.modified,
      size: stats.size,
      thumbnail: await PdfReaderService.generateThumbnail(file, type),
      spaces: {DocumentSpace.recent},
    );
  }

  DocumentType _detectType(String ext) {
    switch (ext) {
      case '.pdf':
        return DocumentType.pdf;
      case '.doc':
      case '.docx':
        return DocumentType.word;
      case '.xls':
      case '.xlsx':
        return DocumentType.excel;
      case '.ppt':
      case '.pptx':
        return DocumentType.powerpoint;
      case '.txt':
        return DocumentType.text;
      default:
        return DocumentType.image;
    }
  }

  Future<void> importFiles(List<File> files) async {
    final mapped = await Future.wait(files.map(_mapFileToDocument));
    _documents.insertAll(0, mapped);
    notifyListeners();
  }

  Future<void> shareDocument(DocumentFile doc) async {
    await Share.shareXFiles([XFile(doc.path)], text: 'Compartido desde A+ Read');
  }

  Future<void> deleteDocument(DocumentFile doc) async {
    final file = File(doc.path);
    if (await file.exists()) {
      await file.delete();
    }
    _documents.removeWhere((item) => item.id == doc.id);
    notifyListeners();
  }

  Future<void> toggleFavorite(DocumentFile doc) async {
    final index = _documents.indexWhere((item) => item.id == doc.id);
    if (index == -1) return;
    final updated = doc.copyWith(
      isFavorite: !doc.isFavorite,
      spaces: {
        ...doc.spaces,
        if (!doc.isFavorite) DocumentSpace.favorite,
      },
    );
    _documents[index] = updated;
    notifyListeners();
  }

  Future<DocumentFile?> getDocumentById(String id) async {
    return _documents.firstWhereOrNull((doc) => doc.id == id);
  }

  Future<DocumentFile> createPdfFromImages(List<Uint8List> images, {String? name}) async {
    final document = PdfDocument();
    for (final image in images) {
      final page = document.pages.add();
      final bitmap = PdfBitmap(image);
      page.graphics.drawImage(bitmap, Rect.fromLTWH(0, 0, page.getClientSize().width, page.getClientSize().height));
    }
    final bytes = Uint8List.fromList(document.saveSync());
    document.dispose();
    final output = await _savePdfBytes(bytes, name: name ?? 'Scan-${DateTime.now().millisecondsSinceEpoch}.pdf');
    final doc = await _mapFileToDocument(output);
    _documents.insert(0, doc);
    notifyListeners();
    return doc;
  }

  Future<DocumentFile> performOcrOnImage(Uint8List imageBytes, {String? name}) async {
    final pdf = await PdfEditorService.textFromImage(imageBytes);
    final bytes = Uint8List.fromList(pdf.saveSync());
    pdf.dispose();
    final output = await _savePdfBytes(bytes, name: name ?? 'OCR-${DateTime.now().millisecondsSinceEpoch}.pdf');
    final doc = await _mapFileToDocument(output);
    _documents.insert(0, doc);
    notifyListeners();
    return doc;
  }

  Future<DocumentFile> compressPdf(DocumentFile doc) async {
    final file = File(doc.path);
    final optimized = await PdfOptimizerService.compress(await file.readAsBytes());
    await file.writeAsBytes(optimized, flush: true);
    final updated = await _mapFileToDocument(file);
    final index = _documents.indexWhere((d) => d.id == doc.id);
    _documents[index] = updated;
    notifyListeners();
    return updated;
  }

  Future<DocumentFile> mergePdfs(List<DocumentFile> docs, {String? name}) async {
    final merger = PdfEditorService();
    for (final doc in docs) {
      await merger.addPdf(File(doc.path));
    }
    final merged = await merger.export();
    final bytes = Uint8List.fromList(merged.saveSync());
    merged.dispose();
    final output = await _savePdfBytes(bytes, name: name ?? 'Merge-${DateTime.now().millisecondsSinceEpoch}.pdf');
    final document = await _mapFileToDocument(output);
    _documents.insert(0, document);
    notifyListeners();
    return document;
  }

  Future<List<DocumentFile>> splitPdf(DocumentFile doc, {required List<int> pageBreaks}) async {
    final outputs = await PdfEditorService.splitPdf(File(doc.path), pageBreaks: pageBreaks);
    final documents = <DocumentFile>[];
    for (final output in outputs) {
      final mapped = await _mapFileToDocument(output);
      documents.add(mapped);
    }
    _documents
      ..removeWhere((item) => item.id == doc.id)
      ..insertAll(0, documents);
    notifyListeners();
    return documents;
  }

  Future<void> addWatermark(DocumentFile doc, {required String watermark}) async {
    final file = File(doc.path);
    final updatedBytes = await PdfEditorService.addWatermark(await file.readAsBytes(), watermark: watermark);
    await file.writeAsBytes(updatedBytes, flush: true);
    final updated = await _mapFileToDocument(file);
    final index = _documents.indexWhere((d) => d.id == doc.id);
    _documents[index] = updated;
    notifyListeners();
  }

  Future<void> addPageNumbers(DocumentFile doc) async {
    final file = File(doc.path);
    final updatedBytes = await PdfEditorService.addPageNumbers(await file.readAsBytes());
    await file.writeAsBytes(updatedBytes, flush: true);
    final updated = await _mapFileToDocument(file);
    final index = _documents.indexWhere((d) => d.id == doc.id);
    _documents[index] = updated;
    notifyListeners();
  }

  Future<File> _savePdfBytes(Uint8List bytes, {required String name}) async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(path.join(dir.path, name));
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }

  Future<DocumentFile> createFromPdfBytes(Uint8List bytes, {required String name}) async {
    final file = await _savePdfBytes(bytes, name: name);
    final doc = await _mapFileToDocument(file);
    _documents.insert(0, doc);
    notifyListeners();
    return doc;
  }
}

class SharedPreferencesAsync {
  SharedPreferencesAsync._(this._prefs);

  final Map<String, Object?> _prefs;

  static SharedPreferencesAsync? _instance;

  static Future<SharedPreferencesAsync> get instance async {
    if (_instance != null) return _instance!;
    final file = await _prefsFile;
    if (!await file.exists()) {
      await file.create(recursive: true);
    }
    final content = await file.readAsString();
    final data = content.isEmpty ? <String, Object?>{} : Map<String, Object?>.from(await compute(_decodePrefs, content));
    _instance = SharedPreferencesAsync._(data);
    return _instance!;
  }

  static Future<File> get _prefsFile async {
    final dir = await getApplicationSupportDirectory();
    return File(path.join(dir.path, 'aplus_read_prefs.json'));
  }

  Future<bool?> getBool(String key) async => _prefs[key] as bool?;

  Future<void> setBool(String key, bool value) async {
    _prefs[key] = value;
    await _persist();
  }

  Future<void> _persist() async {
    final file = await _prefsFile;
    await file.writeAsString(await compute(_encodePrefs, _prefs));
  }
}

String _encodePrefs(Map<String, Object?> prefs) => jsonEncode(prefs);

Map<String, Object?> _decodePrefs(String raw) => jsonDecode(raw) as Map<String, Object?>;
