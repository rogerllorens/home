import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:mindconnect/widgets/mood_tracker_widget.dart';

void main() {
  testWidgets('Mood tracker renders', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: MoodTrackerWidget()));
    expect(find.text('😃'), findsOneWidget);
  });
}
