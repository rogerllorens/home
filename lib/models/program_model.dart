import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

enum ModuleContentType { audio, video, quiz, journal }

extension ModuleContentTypeIcon on ModuleContentType {
  IconData get icon {
    switch (this) {
      case ModuleContentType.audio:
        return Icons.audiotrack;
      case ModuleContentType.video:
        return Icons.videocam;
      case ModuleContentType.quiz:
        return Icons.question_answer;
      case ModuleContentType.journal:
        return Icons.edit;
    }
  }

  String get name {
    switch (this) {
      case ModuleContentType.audio:
        return 'Audio';
      case ModuleContentType.video:
        return 'Video';
      case ModuleContentType.quiz:
        return 'Quiz';
      case ModuleContentType.journal:
        return 'Journal';
    }
  }
}

class ProgramModule {
  final String id;
  final String title;
  final String description;
  final ModuleContentType type;
  final String? mediaUrl;
  final List<String>? prompts;

  ProgramModule({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    this.mediaUrl,
    this.prompts,
  });
}

class Program {
  final String id;
  final String title;
  final String description;
  final List<ProgramModule> modules;

  Program({
    required this.id,
    required this.title,
    required this.description,
    required this.modules,
  });
}

@HiveType(typeId: 3)
class ModuleProgress extends HiveObject {
  @HiveField(0)
  String programId;
  @HiveField(1)
  String moduleId;
  @HiveField(2)
  bool completed;
  @HiveField(3)
  DateTime? completedAt;

  ModuleProgress({
    required this.programId,
    required this.moduleId,
    this.completed = false,
    this.completedAt,
  });
}

class ModuleEntry {
  final String moduleId;
  final DateTime timestamp;
  final String content;
  ModuleEntry(this.moduleId, this.content) : timestamp = DateTime.now();
}

class ProgramModel with ChangeNotifier {
  final List<Program> _programs = [
    Program(
      id: 'mindfulness',
      title: 'Mindfulness Basico',
      description: 'Programa de 2 semanas para empezar a meditar',
      modules: [
        ProgramModule(
          id: 'intro',
          title: 'Introduccion',
          description: 'Que es el mindfulness',
          type: ModuleContentType.video,
        ),
        ProgramModule(
          id: 'breath',
          title: 'Respiracion guiada',
          description: 'Audio de respiracion',
          type: ModuleContentType.audio,
        ),
        ProgramModule(
          id: 'journal',
          title: 'Reflexion',
          description: 'Escribe como te sientes',
          type: ModuleContentType.journal,
          prompts: ['Como te sientes hoy?', 'Que te preocupa en este momento?'],
        ),
      ],
    ),
  ];
  static const _boxName = 'moduleProgress';
  late Box<ModuleProgress> _box;
  final Map<String, ModuleProgress> _progress = {};
  final Map<String, List<ModuleEntry>> _entries = {};

  Future<void> init() async {
    _box = await Hive.openBox<ModuleProgress>(_boxName);
    for (var m in _box.values) {
      _progress['${m.programId}|${m.moduleId}'] = m;
    }
  }

  List<ModuleProgress> get progressList => List.unmodifiable(_progress.values);

  List<Program> get programs => List.unmodifiable(_programs);

  ModuleProgress progressOf(String programId, String moduleId) {
    final key = '$programId|$moduleId';
    return _progress[key] ?? ModuleProgress(programId: programId, moduleId: moduleId);
  }

  List<ModuleEntry> entriesOf(String moduleId) {
    return List.unmodifiable(_entries[moduleId] ?? <ModuleEntry>[]);
  }

  void addEntry(ModuleEntry entry) {
    final list = _entries.putIfAbsent(entry.moduleId, () => []);
    list.add(entry);
    notifyListeners();
  }

  void markCompleted(String programId, String moduleId) {
    final key = '$programId|$moduleId';
    final prog = ModuleProgress(
      programId: programId,
      moduleId: moduleId,
      completed: true,
      completedAt: DateTime.now(),
    );
    _progress[key] = prog;
    _box.put(key, prog);
    notifyListeners();
  }

  Map<String, dynamic> exportJson() {
    return {
      'modules': _progress.values
          .map((p) => {
                'programId': p.programId,
                'moduleId': p.moduleId,
                'completed': p.completed,
                'completedAt': p.completedAt?.toIso8601String(),
              })
          .toList(),
      'entries': _entries.map((k, v) => MapEntry(k, v
          .map((e) => {
                'time': e.timestamp.toIso8601String(),
                'content': e.content,
              })
          .toList())),
    };
  }
}
