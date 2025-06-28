import 'package:flutter_test/flutter_test.dart';
import 'package:mindconnect/models/mood_model.dart';

void main() {
  test('addMood stores entry', () async {
    final model = MoodModel();
    await model.init();
    final initial = model.moodLog.length;
    await model.addMood(3);
    expect(model.moodLog.length, initial + 1);
    expect(model.moodLog.last.mood, 3);
  });

  test('exportJson returns mood list', () async {
    final model = MoodModel();
    await model.init();
    await model.addMood(2);
    final json = model.exportJson();
    expect(json['moods'], isA<List>());
    expect((json['moods'] as List).isNotEmpty, true);
  });
}
