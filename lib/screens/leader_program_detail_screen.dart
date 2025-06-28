import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/leader_program_model.dart';

class LeaderProgramDetailScreen extends StatelessWidget {
  final String programId;
  const LeaderProgramDetailScreen({super.key, required this.programId});

  @override
  Widget build(BuildContext context) {
    final model = context.watch<LeaderProgramModel>();
    final program = model.programs.firstWhere((p) => p.id == programId);
    return Scaffold(
      appBar: AppBar(title: Text(program.title)),
      body: ListView(
        children: program.modules.map((m) {
          final prog = model.progressOf(m.id);
          return ListTile(
            leading: Icon(m.type.icon),
            title: Text(m.title),
            subtitle: Text(prog.completed ? 'Completado' : 'Pendiente'),
            trailing: Icon(
              prog.completed ? Icons.check_circle : Icons.arrow_forward,
              color: prog.completed ? Colors.green : null,
            ),
            onTap: () => context.go('/leader_program/$programId/module/${m.id}'),
          );
        }).toList(),
      ),
    );
  }
}
