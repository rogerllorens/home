import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/leader_program_model.dart';

class LeaderModuleScreen extends StatefulWidget {
  final String programId;
  final String moduleId;
  const LeaderModuleScreen({super.key, required this.programId, required this.moduleId});

  @override
  State<LeaderModuleScreen> createState() => _LeaderModuleScreenState();
}

class _LeaderModuleScreenState extends State<LeaderModuleScreen> {
  bool _completed = false;

  @override
  Widget build(BuildContext context) {
    final model = context.watch<LeaderProgramModel>();
    final program = model.programs.firstWhere((p) => p.id == widget.programId);
    final module = program.modules.firstWhere((m) => m.id == widget.moduleId);
    final progress = model.progressOf(module.id);
    _completed = progress.completed;

    Widget body;
    switch (module.type) {
      case ContentType.video:
        body = const Center(child: Text('Video...'));
        break;
      case ContentType.audio:
        body = const Center(child: Text('Audio...'));
        break;
      case ContentType.quiz:
        body = const Center(child: Text('Quiz pendiente'));
        break;
      case ContentType.article:
        body = Center(child: Text('Articulo: ${module.description}'));
        break;
    }

    return Scaffold(
      appBar: AppBar(title: Text(module.title)),
      body: Column(
        children: [
          Expanded(child: body),
          Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton(
              onPressed: _completed
                  ? null
                  : () {
                      model.completeModule(module.id);
                      setState(() => _completed = true);
                    },
              child: Text(_completed ? 'Completado' : 'Completar modulo'),
            ),
          ),
        ],
      ),
    );
  }
}
