import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:google_ml_kit/google_ml_kit.dart';
import 'package:hive/hive.dart';
import 'package:image/image.dart' as img;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../ocr_utils.dart';
import '../services/ocr_service.dart';
import 'edit_image_page.dart';

import '../widgets/scanly_logo.dart';
import 'package:lottie/lottie.dart';
import '../stats.dart';

class GalleryPage extends StatefulWidget {
  const GalleryPage({super.key});

  @override
  State<GalleryPage> createState() => _GalleryPageState();
}

class _GalleryPageState extends State<GalleryPage> {
  File? image;
  List<AssetEntity> assets = [];
  List<String> codes = [];
  String recognizedText = '';
  String translation = '';
  String detectedLang = '';
  String targetLang = 'es';
  bool showOcrTip = false;
  bool processing = false;

  @override
  void initState() {
    super.initState();
    final settings = Hive.box('settings');
    showOcrTip = settings.get('showOcrTip', defaultValue: true);
    targetLang = settings.get('ocrLang', defaultValue: 'es');
    _loadAssets();
  }

  Future<void> _loadAssets() async {
    final res = await PhotoManager.requestPermissionExtend();
    if (!res.isAuth) {
      if (mounted) {
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Permiso requerido'),
            content: const Text('Necesitamos acceso a tus fotos para seleccionar imágenes.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancelar'),
              ),
              TextButton(
                onPressed: () {
                  PhotoManager.openSetting();
                  Navigator.pop(ctx);
                },
                child: const Text('Ajustes'),
              )
            ],
          ),
        );
      }
      return;
    }
    final albums = await PhotoManager.getAssetPathList(onlyAll: true, type: RequestType.image);
    final media = await albums.first.getAssetListPaged(page: 0, size: 100);
    setState(() {
      assets = media;
    });
  }

  void _saveOcrHistory() {
    if (recognizedText.isEmpty) return;
    final box = Hive.box('history');
    final now = DateTime.now().toIso8601String();
    box.add({
      'code': recognizedText,
      'firstDate': now,
      'lastDate': now,
      'count': 1,
      'safe': true,
      'type': 'text',
      if (translation.isNotEmpty) 'translation': translation,
      if (detectedLang.isNotEmpty) 'lang': detectedLang,
    });
  }

  Future<File> _cropToText(File file, RecognizedText text) async {
    if (text.blocks.isEmpty) return file;
    Rect? rect;
    for (final block in text.blocks) {
      rect = rect == null
          ? block.boundingBox
          : rect.expandToInclude(block.boundingBox);
    }
    if (rect == null) return file;
    final bytes = await file.readAsBytes();
    final image = img.decodeImage(bytes);
    if (image == null) return file;
    final crop = img.copyCrop(
      image,
      rect.left.round().clamp(0, image.width - 1),
      rect.top.round().clamp(0, image.height - 1),
      rect.width.round().clamp(1, image.width),
      rect.height.round().clamp(1, image.height),
    );
    final dir = await getTemporaryDirectory();
    final out = File(p.join(dir.path, 'ocr_${p.basename(file.path)}'));
    await out.writeAsBytes(img.encodeJpg(crop));
    return out;
  }

  Future<void> _translate() async {
    if (recognizedText.isEmpty || detectedLang.isEmpty) return;
    final service = OcrService();
    translation =
        await service.translate(recognizedText, detectedLang, targetLang);
    _saveOcrHistory();
    setState(() {});
  }

  Future<void> _processImage(File file) async {
    final bytes = await file.length();
    if (bytes > 5 * 1024 * 1024) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Imagen grande, se recortará automáticamente')));
    }
    // Preprocess the image for better OCR accuracy
    final pre = await OcrUtils.preprocess(file,
        invert: invertOcrNotifier.value);
    setState(() {
      processing = true;
      codes.clear();
      recognizedText = '';
      translation = '';
      detectedLang = '';
    });
    final input = InputImage.fromFile(pre);
    final barcodeScanner = GoogleMlKit.vision.barcodeScanner();
    final barcodes = await barcodeScanner.processImage(input);
    await barcodeScanner.close();
    codes = barcodes
        .map((b) => b.displayValue ?? '')
        .where((s) => s.isNotEmpty)
        .toList();
    if (codes.isNotEmpty) {
      for (final _ in codes) {
        StatsHelper.recordScan('gallery');
      }
    }
    final ocr = OcrService();
    final result = await ocr.detectText(pre, invert: invertOcrNotifier.value);
    if (result.isNotEmpty) {
      recognizedText = result['text']!;
      detectedLang = result['language']!;
      StatsHelper.recordScan('ocr');
      final textRecognizer = GoogleMlKit.vision.textRecognizer();
      final t = await textRecognizer.processImage(input);
      await textRecognizer.close();
      if (t.blocks.isNotEmpty) {
        final cropped = await _cropToText(pre, t);
        image = cropped;
      }
    }
    setState(() {
      processing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const CodeMaster ProLogo(variant: LogoVariant.static),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadAssets,
        child: const Icon(Icons.photo_library),
      ),
      body: image == null
          ? (assets.isEmpty
              ? const Center(child: Text('Selecciona una imagen'))
              : GridView.builder(
                  padding: const EdgeInsets.all(8),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 4,
                    crossAxisSpacing: 4,
                  ),
                  itemCount: assets.length,
              itemBuilder: (context, index) {
                final asset = assets[index];
                return FutureBuilder<Uint8List?>(
                  future: asset.thumbnailDataWithSize(const ThumbnailSize(200, 200)),
                  builder: (context, snap) {
                    if (!snap.hasData) return const SizedBox();
                    return GestureDetector(
                      onTap: () async {
                        final file = await asset.file;
                        if (file == null) return;
                        final edited = await Navigator.push<File?>(
                          context,
                          MaterialPageRoute(builder: (_) => EditImagePage(file: file)),
                        );
                        final used = edited ?? file;
                        setState(() {
                          image = used;
                        });
                        await _processImage(used);
                      },
                      child: Semantics(
                        label: 'Imagen en galería para OCR o QR',
                        child: Image.memory(snap.data!, fit: BoxFit.cover),
                      ),
                    );
                  },
                );
              },
              ))
          : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (showOcrTip)
                      MaterialBanner(
                        content: const Text(
                            'Edita la imagen, procesa y luego podrás traducir.'),
                        actions: [
                          TextButton(
                            onPressed: () {
                              setState(() => showOcrTip = false);
                              Hive.box('settings').put('showOcrTip', false);
                            },
                            child: const Text('OK'),
                          )
                        ],
                      ),
                    Image.file(image!, cacheWidth: 600),
                    const SizedBox(height: 16),
                    if (processing)
                      Column(
                        children: [
                          Lottie.asset('assets/animations/loading.json',
                              width: 120,
                              height: 120,
                              repeat: true,
                              package: null,
                              frameRate: FrameRate.max),
                          const SizedBox(height: 8),
                          const Text('Escaneando texto…'),
                        ],
                      ),
                    if (codes.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Códigos encontrados:'),
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: codes.length,
                            itemBuilder: (ctx, i) {
                              final c = codes[i];
                              return ListTile(
                                title: Text(c),
                                trailing: IconButton(
                                  icon: const Icon(Icons.copy),
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: c));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Copiado')),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    if (recognizedText.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 16),
                          Text('Texto detectado (\$detectedLang):'),
                          Text(recognizedText),
                          const SizedBox(height: 8),
                          DropdownButton<String>(
                            value: targetLang,
                            items: const [
                              DropdownMenuItem(value: 'es', child: Text('Español')),
                              DropdownMenuItem(value: 'en', child: Text('Inglés')),
                              DropdownMenuItem(value: 'fr', child: Text('Francés')),
                            ],
                            onChanged: (v) {
                              if (v == null) return;
                              setState(() => targetLang = v);
                              Hive.box('settings').put('ocrLang', v);
                            },
                          ),
                          ElevatedButton(
                            onPressed: _translate,
                            child: const Text('Traducir'),
                          ),
                          if (translation.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            const Text('Traducción:'),
                            Text(translation),
                          ],
                        ],
                      ),
                  ],
                ),
              ),
      ),
    );
  }
}
