import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

enum ContentType { video, audio, quiz, article }

extension ContentTypeIcon on ContentType {
  IconData get icon {
    switch (this) {
      case ContentType.video:
        return Icons.videocam;
      case ContentType.audio:
        return Icons.audiotrack;
      case ContentType.quiz:
        return Icons.quiz;
      case ContentType.article:
        return Icons.article;
    }
  }
}

class CoachingModule {
  final String id;
  final String title;
  final String description;
  final ContentType type;
  final String mediaUrl;
  final bool requiresQuiz;
  CoachingModule({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.mediaUrl,
    this.requiresQuiz = false,
  });
}

class LeaderProgram {
  final String id;
  final String title;
  final String description;
  final List<CoachingModule> modules;
  LeaderProgram({
    required this.id,
    required this.title,
    required this.description,
    required this.modules,
  });
}

@HiveType(typeId: 4)
class LeaderModuleProgress extends HiveObject {
  @HiveField(0)
  String moduleId;
  @HiveField(1)
  bool completed;
  @HiveField(2)
  DateTime? completedAt;
  LeaderModuleProgress({required this.moduleId, this.completed = false, this.completedAt});
}

class LeaderProgramModel with ChangeNotifier {
  static const _boxName = 'leaderProgress';
  late Box<LeaderModuleProgress> _box;
  final List<LeaderProgram> _programs = [
    LeaderProgram(
      id: 'lead1',
      title: 'Liderazgo Basico',
      description: 'Mejora habilidades de gestion y comunicacion.',
      modules: [
        CoachingModule(
          id: 'intro',
          title: 'Introduccion',
          description: 'Conceptos basicos de liderazgo.',
          type: ContentType.video,
          mediaUrl: '',
        ),
        CoachingModule(
          id: 'quiz1',
          title: 'Evaluacion Inicial',
          description: 'Cuestionario rapido.',
          type: ContentType.quiz,
          mediaUrl: '',
          requiresQuiz: true,
        ),
      ],
    ),
  ];

  final Map<String, LeaderModuleProgress> _progress = {};

  Future<void> init() async {
    _box = await Hive.openBox<LeaderModuleProgress>(_boxName);
    for (var p in _box.values) {
      _progress[p.moduleId] = p;
    }
  }

  List<LeaderProgram> get programs => List.unmodifiable(_programs);

  LeaderModuleProgress progressOf(String moduleId) {
    return _progress[moduleId] ?? LeaderModuleProgress(moduleId: moduleId);
  }

  void completeModule(String moduleId) {
    final prog = LeaderModuleProgress(moduleId: moduleId, completed: true, completedAt: DateTime.now());
    _progress[moduleId] = prog;
    _box.put(moduleId, prog);
    notifyListeners();
  }
}
