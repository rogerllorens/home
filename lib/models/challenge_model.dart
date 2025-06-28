import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

class Challenge {
  final String id;
  final String title;
  final String description;
  final DateTime startDate;
  final DateTime endDate;
  final int target; // e.g. number of days or km

  Challenge({
    required this.id,
    required this.title,
    required this.description,
    required this.startDate,
    required this.endDate,
    required this.target,
  });
}

@HiveType(typeId: 1)
class ChallengeProgress extends HiveObject {
  @HiveField(0)
  String challengeId;
  @HiveField(1)
  int completed;
  ChallengeProgress({required this.challengeId, this.completed = 0});
}

class ChallengeModel with ChangeNotifier {
  static const _boxName = 'challengeProgress';
  late Box<ChallengeProgress> _box;
  final List<Challenge> _challenges = [
    Challenge(
      id: 'walk',
      title: 'Caminar 5k',
      description: 'Camina 5 kilometros esta semana',
      startDate: DateTime.now(),
      endDate: DateTime.now().add(const Duration(days: 7)),
      target: 5,
    ),
    Challenge(
      id: 'journal7',
      title: 'Journaling 7 dias',
      description: 'Escribe tus pensamientos cada dia',
      startDate: DateTime.now(),
      endDate: DateTime.now().add(const Duration(days: 7)),
      target: 7,
    ),
  ];

  final Map<String, ChallengeProgress> _progress = {};

  Future<void> init() async {
    _box = await Hive.openBox<ChallengeProgress>(_boxName);
    for (var prog in _box.values) {
      _progress[prog.challengeId] = prog;
    }
  }

  List<Challenge> get challenges => List.unmodifiable(_challenges);

  List<ChallengeProgress> get progressList =>
      List.unmodifiable(_progress.values);

  List<ChallengeProgress> leaderboard(String id) {
    return _progress.values
        .where((p) => p.challengeId == id)
        .toList()
      ..sort((a, b) => b.completed.compareTo(a.completed));
  }

  ChallengeProgress progressOf(String id) =>
      _progress[id] ?? ChallengeProgress(challengeId: id);

  bool isJoined(String id) => _progress.containsKey(id);

  void joinChallenge(String id) {
    if (_progress.containsKey(id)) return;
    final prog = ChallengeProgress(challengeId: id);
    _progress[id] = prog;
    _box.put(id, prog);
    notifyListeners();
  }

  void register(String id) {
    final prog = _progress[id];
    if (prog == null) return;
    prog.completed += 1;
    _box.put(id, prog);
    notifyListeners();
  }

  Map<String, dynamic> exportJson() {
    return {
      'challenges': _progress.values
          .map((e) => {
                'id': e.challengeId,
                'completed': e.completed,
              })
          .toList(),
    };
  }
}
