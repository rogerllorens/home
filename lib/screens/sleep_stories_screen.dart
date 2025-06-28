import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/sleep_story_model.dart';
import 'sleep_player_screen.dart';

class SleepStoriesScreen extends StatelessWidget {
  const SleepStoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final stories = context.watch<SleepStoryModel>().stories;
    return Scaffold(
      appBar: AppBar(title: const Text('Sleep Stories')),
      body: ListView.builder(
        itemCount: stories.length,
        itemBuilder: (_, i) {
          final s = stories[i];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              leading: Image.network(s.imageUrl, width: 56, fit: BoxFit.cover),
              title: Text(s.title),
              subtitle: Text('Narrado por ${s.narrator}'),
              trailing: const Icon(Icons.play_arrow),
              onTap: () =>
                  Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => SleepPlayerScreen(id: s.id))),
            ),
          );
        },
      ),
    );
  }
}
