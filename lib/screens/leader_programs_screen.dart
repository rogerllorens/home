import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/leader_program_model.dart';

class LeaderProgramsScreen extends StatelessWidget {
  const LeaderProgramsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final programs = context.watch<LeaderProgramModel>().programs;
    return Scaffold(
      appBar: AppBar(title: const Text('Coaching for Leaders')),
      body: ListView.builder(
        itemCount: programs.length,
        itemBuilder: (ctx, i) {
          final p = programs[i];
          return Card(
            child: ListTile(
              title: Text(p.title),
              subtitle: Text(p.description),
              trailing: const Icon(Icons.arrow_forward),
              onTap: () => context.go('/leader_program/${p.id}'),
            ),
          );
        },
      ),
    );
  }
}
