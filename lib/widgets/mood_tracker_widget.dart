import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/mood_model.dart';
import '../models/reward_model.dart';

const moodEmojis = ['😃', '😊', '😐', '😔', '😢'];

class MoodTrackerWidget extends StatefulWidget {
  const MoodTrackerWidget({super.key});

  @override
  State<MoodTrackerWidget> createState() => _MoodTrackerWidgetState();
}

class _MoodTrackerWidgetState extends State<MoodTrackerWidget> {
  int selectedMood = -1;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(moodEmojis.length, (i) {
            return Semantics(
              button: true,
              label: 'Estado ${i + 1}',
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selectedMood == i ? Colors.blue.shade50 : Colors.transparent,
                ),
                child: IconButton(
                  onPressed: () {
                    setState(() => selectedMood = i);
                    context.read<MoodModel>().addMood(i + 1);
                    context.read<RewardModel>().earnPoints(1, reason: 'mood');
                  },
                  icon: Text(
                    moodEmojis[i],
                    style: TextStyle(
                      fontSize: 24,
                      color: selectedMood == i ? Colors.blue : Colors.grey,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
