import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/mood_model.dart';
import '../models/questionnaire_model.dart';
import '../models/challenge_model.dart';
import '../models/program_model.dart';
import '../services/analytics_service.dart';
import '../providers.dart';
import 'package:csv/csv.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:convert';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

class ExportScreen extends ConsumerWidget {
  const ExportScreen({super.key});

  Future<void> _exportCsv(WidgetRef ref) async {
    final moods = ref.read(moodProvider);
    final questionnaire = ref.read(questionnaireProvider).entries;
    final challenges = ref.read(challengeProvider).progressList;
    final modules = ref.read(programProvider).progressList;
    List<List<dynamic>> rows = [
      ['Fecha', 'Ánimo'],
      ...moods.map((e) => [e.time.toIso8601String(), e.mood]),
      [],
      ['Questionnaire', 'Question', 'Answer'],
      ...questionnaire.map((q) => ['questionnaire', q.questionId, q.answer]),
      [],
      ['Challenge', 'Id', 'Completed'],
      ...challenges.map((c) => ['challenge', c.challengeId, c.completed]),
      [],
      ['Program', 'ProgramId', 'ModuleId', 'CompletedAt'],
      ...modules.map((m) => [
            'program',
            m.programId,
            m.moduleId,
            m.completedAt?.toIso8601String() ?? ''
          ])
    ];
    final csv = const ListToCsvConverter().convert(rows);
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/mood_log.csv');
    await file.writeAsString(csv);
    await Share.shareXFiles([XFile(file.path)], subject: 'Mood log CSV');
    AnalyticsService.logEvent('export_csv');
  }

  Future<void> _exportJsonFile(WidgetRef ref) async {
    final mood = ref.read(moodProvider).exportJson();
    final challenges = ref.read(challengeProvider).exportJson();
    final programs = ref.read(programProvider).exportJson();
    final data = {
      'mood': mood['moods'],
      ...challenges,
      ...programs,
    };
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/mindconnect_export.json');
    await file.writeAsString(jsonEncode(data));
    await Share.shareXFiles([XFile(file.path)], subject: 'MindConnect JSON');
    AnalyticsService.logEvent('export_json');
  }

  Future<void> _exportPdf(WidgetRef ref) async {
    final moods = ref.read(moodProvider);
    final questionnaire = ref.read(questionnaireProvider).entries;
    final challenges = ref.read(challengeProvider).progressList;
    final modules = ref.read(programProvider).progressList;
    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        build: (ctx) => pw.Column(children: [
          pw.Text('Mood Log', style: pw.TextStyle(fontSize: 18)),
          pw.SizedBox(height: 8),
          ...moods.map((e) => pw.Text('${e.time.toIso8601String()}: ${e.mood}')),
          pw.SizedBox(height: 16),
          pw.Text('Questionnaire'),
          ...questionnaire.map((e) =>
              pw.Text('${e.questionId}: ${e.answer}', style: const pw.TextStyle(fontSize: 12))),
          pw.SizedBox(height: 16),
          pw.Text('Challenges'),
          ...challenges.map((c) =>
              pw.Text('${c.challengeId}: ${c.completed}', style: const pw.TextStyle(fontSize: 12))),
          pw.SizedBox(height: 16),
          pw.Text('Programs'),
          ...modules.map((m) => pw.Text(
              '${m.programId}-${m.moduleId}: ${m.completedAt?.toIso8601String() ?? ''}',
              style: const pw.TextStyle(fontSize: 12))),
        ]),
      ),
    );
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/mindconnect_export.pdf');
    await file.writeAsBytes(await doc.save());
    await Share.shareXFiles([XFile(file.path)], subject: 'MindConnect PDF');
    AnalyticsService.logEvent('export_pdf');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Exportar datos')),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ElevatedButton(
            onPressed: () => _exportCsv(ref),
            child: const Text('Exportar CSV'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _exportPdf(ref),
            child: const Text('Exportar PDF'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _exportJsonFile(ref),
            child: const Text('Exportar JSON'),
          ),
        ],
      ),
    );
  }
}
