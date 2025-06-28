import 'package:flutter/foundation.dart';

class QuestionnaireEntry {
  final String questionId;
  int answer;
  QuestionnaireEntry({required this.questionId, this.answer = -1});
}

class QuestionnaireModel with ChangeNotifier {
  final List<QuestionnaireEntry> _entries = [];

  void init(List<String> questions) {
    _entries.clear();
    _entries.addAll(questions.map((q) => QuestionnaireEntry(questionId: q)));
  }

  void setAnswer(String id, int value) {
    final entry = _entries.firstWhere((e) => e.questionId == id);
    entry.answer = value;
    notifyListeners();
  }

  List<QuestionnaireEntry> get entries => List.unmodifiable(_entries);

  bool get completed => _entries.every((e) => e.answer >= 0);
}
