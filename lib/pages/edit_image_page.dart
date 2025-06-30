import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:crop_your_image/crop_your_image.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class EditImagePage extends StatefulWidget {
  final File file;
  const EditImagePage({super.key, required this.file});

  @override
  State<EditImagePage> createState() => _EditImagePageState();
}

class _EditImagePageState extends State<EditImagePage> {
  final _controller = CropController();
  int _rotation = 0;
  double _brightness = 0;
  double _contrast = 1;

  void _rotate() {
    setState(() {
      _rotation = (_rotation + 90) % 360;
    });
    _controller.rotation = _rotation.toDouble();
  }

  Future<void> _apply() async {
    final cropped = await _controller.crop();
    var decoded = img.decodeImage(cropped)!;
    if (_brightness != 0 || _contrast != 1) {
      decoded = img.adjustColor(decoded,
          brightness: _brightness, contrast: _contrast);
    }
    if (_rotation != 0) {
      decoded = img.copyRotate(decoded, _rotation);
    }
    final dir = await getTemporaryDirectory();
    final out = File(p.join(dir.path, 'edit_${p.basename(widget.file.path)}'));
    await out.writeAsBytes(img.encodeJpg(decoded));
    if (!mounted) return;
    Navigator.pop(context, out);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Editar imagen')),
      body: Column(
        children: [
          Expanded(
            child: Crop(
              image: widget.file.readAsBytesSync(),
              controller: _controller,
              onCropped: (_) {},
              withCircleUi: false,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              IconButton(onPressed: _rotate, icon: const Icon(Icons.rotate_right)),
              Column(
                children: [
                  const Text('Brillo'),
                  Slider(
                    value: _brightness,
                    min: -1,
                    max: 1,
                    onChanged: (v) => setState(() => _brightness = v),
                  ),
                ],
              ),
              Column(
                children: [
                  const Text('Contraste'),
                  Slider(
                    value: _contrast,
                    min: 0,
                    max: 2,
                    onChanged: (v) => setState(() => _contrast = v),
                  ),
                ],
              ),
              ElevatedButton(onPressed: _apply, child: const Text('Escanear')),
            ],
          )
        ],
      ),
    );
  }
}
