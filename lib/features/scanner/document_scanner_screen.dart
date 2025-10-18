import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/services/document_service.dart';

class DocumentScannerScreen extends HookConsumerWidget {
  const DocumentScannerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final picker = useMemoized(ImagePicker.new);
    final images = useState<List<Uint8List>>([]);
    final isProcessing = useState(false);

    Future<void> capture(ImageSource source) async {
      if (source == ImageSource.camera) {
        final photo = await picker.pickImage(source: ImageSource.camera, imageQuality: 95);
        if (photo != null) {
          images.value = [...images.value, await photo.readAsBytes()];
        }
      } else {
        final picked = await picker.pickMultiImage(imageQuality: 95);
        if (picked.isNotEmpty) {
          final bytes = await Future.wait(picked.map((file) => file.readAsBytes()));
          images.value = [...images.value, ...bytes];
        }
      }
    }

    Future<void> convertToPdf() async {
      if (images.value.isEmpty) return;
      isProcessing.value = true;
      final doc = await ref.read(documentServiceProvider).createPdfFromImages(images.value);
      isProcessing.value = false;
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('PDF creado: ${doc.name}')));
      }
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Escáner inteligente')),
      body: Column(
        children: [
          Expanded(
            child: images.value.isEmpty
                ? const Center(
                    child: Text('Captura o selecciona imágenes para convertirlas en PDF.'),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: images.value.length,
                    itemBuilder: (context, index) {
                      final image = images.value[index];
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.memory(image, fit: BoxFit.cover),
                      );
                    },
                  ),
          ),
          if (isProcessing.value) const LinearProgressIndicator(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => capture(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Galería'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => capture(ImageSource.camera),
                    icon: const Icon(Icons.photo_camera_outlined),
                    label: const Text('Cámara'),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: isProcessing.value ? null : convertToPdf,
                icon: const Icon(Icons.picture_as_pdf_outlined),
                label: const Text('Crear PDF'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
