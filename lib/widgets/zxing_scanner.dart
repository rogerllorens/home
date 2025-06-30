import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

class ZxingScanner extends StatefulWidget {
  final void Function(String) onDetect;
  const ZxingScanner({super.key, required this.onDetect});

  @override
  State<ZxingScanner> createState() => _ZxingScannerState();
}

class _ZxingScannerState extends State<ZxingScanner> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;

  @override
  void reassemble() {
    super.reassemble();
    controller?.pauseCamera();
    controller?.resumeCamera();
  }

  @override
  Widget build(BuildContext context) {
    return QRView(
      key: qrKey,
      onQRViewCreated: (ctrl) {
        controller = ctrl;
        controller!.scannedDataStream.listen((scanData) {
          final code = scanData.code;
          if (code != null) {
            widget.onDetect(code);
          }
        });
      },
    );
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}
