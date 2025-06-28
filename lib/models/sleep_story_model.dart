import 'package:flutter/foundation.dart';

class SleepStory {
  final String id;
  final String title;
  final String narrator;
  final String audioUrl;
  final String imageUrl;

  SleepStory({
    required this.id,
    required this.title,
    required this.narrator,
    required this.audioUrl,
    required this.imageUrl,
  });
}

class SleepStoryModel with ChangeNotifier {
  final List<SleepStory> _stories = [
    SleepStory(
      id: 'story1',
      title: 'Viaje a la calma',
      narrator: 'Narrador A',
      audioUrl: 'https://example.com/audio.mp3',
      imageUrl:
          'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl.jpg',
    ),
  ];

  List<SleepStory> get stories => List.unmodifiable(_stories);

  SleepStory? getById(String id) {
    try {
      return _stories.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }
}
