import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers.dart';
import '../models/communities_model.dart';

class CommunitiesScreen extends ConsumerWidget {
  const CommunitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(communitiesProvider).posts;
    return Scaffold(
      appBar: AppBar(title: const Text('Comunidades')),
      body: ListView.builder(
        itemCount: posts.length,
        itemBuilder: (context, i) {
          final p = posts[i];
          return ListTile(
            title: Text(p.title),
            subtitle: Text(p.description),
            trailing: Text(
              '${p.time.hour}:${p.time.minute.toString().padLeft(2, '0')}',
              style: const TextStyle(fontSize: 12),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create_post'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
