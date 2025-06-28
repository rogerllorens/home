import 'package:flutter/material.dart';

class FeedWidget extends StatelessWidget {
  const FeedWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final items = List.generate(5, (i) => 'Publicación ${i + 1}');
    return Column(
      children: [
        for (final item in items)
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              title: Text(item),
              subtitle: const Text('Contenido de ejemplo'),
            ),
          )
      ],
    );
  }
}
