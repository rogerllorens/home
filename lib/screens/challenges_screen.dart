import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/challenge_model.dart';

class ChallengesScreen extends StatelessWidget {
  const ChallengesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final model = context.watch<ChallengeModel>();
    final challenges = model.challenges;
    return Scaffold(
      appBar: AppBar(title: const Text('Retos')),
      body: ListView.builder(
        itemCount: challenges.length,
        itemBuilder: (ctx, i) {
          final c = challenges[i];
          final joined = model.isJoined(c.id);
          final progress = model.progressOf(c.id);
          final percent = progress.completed / c.target;
          return Card(
            margin: const EdgeInsets.all(8),
            child: Semantics(
              label:
                  'Reto ${c.title}: ${(percent * 100).toStringAsFixed(0)}% completado',
              child: ListTile(
                title: Text(c.title),
                subtitle: LinearProgressIndicator(value: percent),
              trailing: ElevatedButton(
                child: Text(joined ? 'Ver' : 'Unirse'),
                onPressed: () {
                  if (joined) {
                    context.go('/challenge/${c.id}');
                  } else {
                    model.joinChallenge(c.id);
                  }
                },
              ),
              ),
            ),
          );
        },
      ),
    );
  }
}
