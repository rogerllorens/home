import 'package:flutter/material.dart';

class ScanOverlay extends StatelessWidget {
  final bool barcodeMode;
  final Animation<double> highlight;
  final Color color;
  const ScanOverlay({super.key, required this.barcodeMode, required this.highlight, required this.color});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = barcodeMode ? constraints.maxWidth * 0.8 : 250.0;
        final height = barcodeMode ? 120.0 : 250.0;
        final center = Offset(constraints.maxWidth / 2, constraints.maxHeight / 2);
        final rect = Rect.fromCenter(center: center, width: width, height: height);
        return AnimatedBuilder(
          animation: highlight,
          builder: (context, child) {
            return CustomPaint(
              size: Size(constraints.maxWidth, constraints.maxHeight),
              painter: _OverlayPainter(
                rect: rect,
                color: color,
                progress: highlight.value,
              ),
            );
          },
        );
      },
    );
  }
}

class _OverlayPainter extends CustomPainter {
  final Rect rect;
  final Color color;
  final double progress;
  _OverlayPainter({required this.rect, required this.color, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final overlayPaint = Paint()..color = Colors.black.withOpacity(0.5);
    final path = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(rect, const Radius.circular(12)));
    canvas.drawPath(path, overlayPaint);

    final borderPaint = Paint()
      ..color = color
      ..strokeWidth = 4 + 2 * progress
      ..style = PaintingStyle.stroke;
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(12)), borderPaint);
  }

  @override
  bool shouldRepaint(covariant _OverlayPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.rect != rect || oldDelegate.color != color;
  }
}
