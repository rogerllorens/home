import 'package:flutter/foundation.dart';

enum ResourceType { article, podcast, video }

class Resource {
  final String id;
  final String title;
  final String description;
  final String mediaUrl;
  final ResourceType type;

  Resource({
    required this.id,
    required this.title,
    required this.description,
    required this.mediaUrl,
    required this.type,
  });
}

class ResourceModel with ChangeNotifier {
  final List<Resource> _resources = [
    Resource(
      id: 'art1',
      title: 'Respiraci\u00f3n consciente',
      description: 'Tecnicas b\u00e1sicas para relajarte',
      mediaUrl:
          'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl.jpg',
      type: ResourceType.article,
    ),
    Resource(
      id: 'pod1',
      title: 'Podcast Bienestar',
      description: 'Episodio introductorio',
      mediaUrl:
          'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl.jpg',
      type: ResourceType.podcast,
    ),
    Resource(
      id: 'vid1',
      title: 'Meditaci\u00f3n guiada',
      description: 'Video corto para iniciar el d\u00eda',
      mediaUrl:
          'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
      type: ResourceType.video,
    ),
  ];

  List<Resource> get resources => List.unmodifiable(_resources);

  Resource? getById(String id) =>
      _resources.firstWhere((e) => e.id == id, orElse: () => _resources.first);
}
