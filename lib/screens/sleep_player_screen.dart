import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/sleep_story_model.dart';
import '../widgets/media_widgets.dart';

class SleepPlayerScreen extends StatelessWidget {
  final String id;
  const SleepPlayerScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    final story = context.read<SleepStoryModel>().getById(id);
    if (story == null) {
      return const Scaffold(body: Center(child: Text('Historia no encontrada')));
    }
    return Scaffold(
      appBar: AppBar(title: Text(story.title)),
      body: Column(
        children: [
          Image.network(story.imageUrl,
              width: double.infinity,
              height: 200,
              fit: BoxFit.cover,
              semanticLabel: story.title),
          const SizedBox(height: 16),
          Text('Narrado por ${story.narrator}'),
          const SizedBox(height: 16),
          Expanded(child: Center(child: AudioPlayerWidget(url: story.audioUrl))),
        ],
      ),
    );
  }
}
