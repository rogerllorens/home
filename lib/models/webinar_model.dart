import 'package:flutter/foundation.dart';

class Webinar {
  final String id;
  final String title;
  final String description;
  final DateTime scheduledAt;
  final String streamUrl;
  final bool isLive;

  Webinar({
    required this.id,
    required this.title,
    required this.description,
    required this.scheduledAt,
    required this.streamUrl,
    this.isLive = false,
  });
}

class Registration {
  final String webinarId;
  final String userId;
  bool attended;

  Registration({required this.webinarId, required this.userId, this.attended = false});
}

class WebinarModel with ChangeNotifier {
  final List<Webinar> _webinars = [
    Webinar(
      id: 'w1',
      title: 'Mindfulness Corporativo',
      description: 'Sesión introductoria',
      scheduledAt: DateTime.now().add(const Duration(days: 1)),
      streamUrl: 'https://example.com/stream.mp4',
      isLive: false,
    ),
  ];

  final List<Registration> _registrations = [];

  List<Webinar> get webinars => List.unmodifiable(_webinars);

  Webinar? getById(String id) =>
      _webinars.firstWhere((e) => e.id == id, orElse: () => _webinars.first);

  bool isRegistered(String webinarId, String userId) {
    return _registrations
        .any((r) => r.webinarId == webinarId && r.userId == userId);
  }

  void register(String webinarId, String userId) {
    if (!isRegistered(webinarId, userId)) {
      _registrations
          .add(Registration(webinarId: webinarId, userId: userId));
      notifyListeners();
    }
  }
}
