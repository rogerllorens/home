import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/questionnaire_model.dart';
import '../providers.dart';

class QuestionnaireScreen extends StatefulWidget {
  const QuestionnaireScreen({super.key});

  @override
  State<QuestionnaireScreen> createState() => _QuestionnaireScreenState();
}

class _QuestionnaireScreenState extends State<QuestionnaireScreen> {
  final _phq9 = List<String>.generate(9, (i) => 'PHQ-9 Pregunta ${i + 1}');
  final _gad7 = List<String>.generate(7, (i) => 'GAD-7 Pregunta ${i + 1}');
  int _index = 0;

  @override
  void initState() {
    super.initState();
    context.read(questionnaireProvider).init([..._phq9, ..._gad7]);
  }

  void _next(QuestionnaireModel model) {
    final q = _currentQuestion();
    if (model.entries[_index].answer >= 0) {
      if (_index < _phq9.length + _gad7.length - 1) {
        setState(() => _index++);
      } else {
        context.go('/home');
      }
    }
  }

  String _currentQuestion() {
    if (_index < _phq9.length) {
      return _phq9[_index];
    } else {
      return _gad7[_index - _phq9.length];
    }
  }

  @override
  Widget build(BuildContext context) {
    final model = context.watch<QuestionnaireModel>();
    final q = _currentQuestion();
    final total = _phq9.length + _gad7.length;
    return Scaffold(
      appBar: AppBar(title: const Text('Cuestionario inicial')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            LinearProgressIndicator(value: (_index + 1) / total),
            const SizedBox(height: 12),
            Text(q, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ...List.generate(4, (i) {
              final labels = ['Nada', 'Varios días', 'Más de la mitad', 'Casi todos'];
              return RadioListTile<int>(
                value: i,
                groupValue: model.entries[_index].answer == -1 ? null : model.entries[_index].answer,
                title: Text(labels[i]),
                onChanged: (v) => model.setAnswer(q, v!),
              );
            }),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _next(model),
              child: Text(_index < total - 1 ? 'Siguiente' : 'Finalizar'),
            ),
          ],
        ),
      ),
    );
  }
}
