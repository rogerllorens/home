import 'package:flutter/material.dart';

class AnnotationToolbar extends StatelessWidget {
  const AnnotationToolbar({
    super.key,
    required this.onHighlight,
    required this.onUnderline,
    required this.onFreehand,
    required this.onSign,
  });

  final VoidCallback onHighlight;
  final VoidCallback onUnderline;
  final VoidCallback onFreehand;
  final VoidCallback onSign;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _ActionButton(icon: Icons.highlight, label: 'Resaltar', onTap: onHighlight),
          _ActionButton(icon: Icons.format_underline, label: 'Subrayar', onTap: onUnderline),
          _ActionButton(icon: Icons.gesture, label: 'Dibujar', onTap: onFreehand),
          _ActionButton(icon: Icons.edit_note_outlined, label: 'Firmar', onTap: onSign),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: onTap,
          icon: Icon(icon),
        ),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}
