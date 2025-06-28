import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/resource_model.dart';
import '../widgets/resource_card.dart';

class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final resources = context.watch<ResourceModel>().resources;
    return Scaffold(
      appBar: AppBar(title: const Text('Recursos')),
      body: Padding(
        padding: const EdgeInsets.all(8),
        child: MasonryGridView.count(
          crossAxisCount: 2,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          itemCount: resources.length,
          itemBuilder: (ctx, i) {
            final r = resources[i];
            return ResourceCard(
              resource: r,
              onTap: () => context.go('/library/${r.id}'),
            );
          },
        ),
      ),
    );
  }
}
