import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/challenge_model.dart';

class ChallengeDetailScreen extends StatelessWidget {
  final String id;
  const ChallengeDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    final model = context.watch<ChallengeModel>();
    final challenge = model.challenges.firstWhere((c) => c.id == id);
    final progress = model.progressOf(id);
    final percent = progress.completed / challenge.target;
    return Scaffold(
      appBar: AppBar(title: Text(challenge.title)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(challenge.description),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: LinearProgressIndicator(value: percent),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text('${progress.completed}/${challenge.target} completado'),
          ),
          ElevatedButton(
            onPressed: () => model.register(id),
            child: const Text('Registrar hoy'),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: model.leaderboard(id).length,
              itemBuilder: (_, i) {
                final prog = model.leaderboard(id)[i];
                return ListTile(
                  leading: CircleAvatar(child: Text('${i + 1}')),
                  title: const Text('Usuario'),
                  trailing:
                      Text('${prog.completed}/${challenge.target}'),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
