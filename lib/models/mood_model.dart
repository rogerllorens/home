import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/widgets.dart' as pw;
import 'dart:io';
import '../services/analytics_service.dart';

part 'mood_model.g.dart';

@HiveType(typeId: 0)
class MoodEntry extends HiveObject {
  @HiveField(0)
  final int mood;
  @HiveField(1)
  final DateTime time;

  MoodEntry({required this.mood, DateTime? time}) : time = time ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'mood': mood,
        'time': time.toIso8601String(),
      };

  factory MoodEntry.fromJson(Map<String, dynamic> json) => MoodEntry(
        mood: json['mood'] as int,
        time: DateTime.parse(json['time'] as String),
      );
}

class MoodModel extends StateNotifier<List<MoodEntry>> {
  static const boxName = 'moodBox';
  MoodModel() : super([]);

  Future<void> init() async {
    await Hive.openBox<MoodEntry>(boxName);
    state = Hive.box<MoodEntry>(boxName).values.toList();
  }

  Future<void> addMood(int mood) async {
    final entry = MoodEntry(mood: mood);
    await Hive.box<MoodEntry>(boxName).add(entry);
    state = [...state, entry];
    AnalyticsService.logEvent('add_mood', {'mood': mood});
  }

  List<MoodEntry> get moodLog => List.unmodifiable(state);

  List<MoodEntry> getLastDays(int days) {
    final cutoff = DateTime.now().subtract(Duration(days: days));
    return state.where((e) => e.time.isAfter(cutoff)).toList();
  }

  String exportCsv() {
    final buffer = StringBuffer('mood,time\n');
    for (var e in state) {
      buffer.writeln('${e.mood},${e.time.toIso8601String()}');
    }
    return buffer.toString();
  }

  Map<String, dynamic> exportJson() {
    return {
      'moods': state.map((e) => e.toJson()).toList(),
    };
  }

  Future<File> exportPdfFile() async {
    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('Histórico de ánimo', style: pw.TextStyle(fontSize: 18)),
            pw.SizedBox(height: 12),
            ...state.map((e) => pw.Text(
                '${e.time.toIso8601String()}: ${e.mood}',
                style: const pw.TextStyle(fontSize: 12))),
          ],
        ),
      ),
    );
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/mood_log.pdf');
    await file.writeAsBytes(await doc.save());
    return file;
  }
}
