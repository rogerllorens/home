import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/program_model.dart';

class ProgramDetailScreen extends StatelessWidget {
  final String id;
  const ProgramDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    final model = context.watch<ProgramModel>();
    final program = model.programs.firstWhere((p) => p.id == id);
    return Scaffold(
      appBar: AppBar(title: Text(program.title)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(program.description),
          ),
          Expanded(
            child: ListView(
              children: program.modules.map((m) {
                final prog = model.progressOf(program.id, m.id);
                return ListTile(
                  leading: Icon(m.type.icon),
                  title: Text(m.title),
                  subtitle: Text(m.type.name),
                  trailing: Checkbox(
                    value: prog.completed,
                    onChanged: (_) {},
                  ),
                  onTap: () => context.go('/program/${program.id}/module/${m.id}'),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
