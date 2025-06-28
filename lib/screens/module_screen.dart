import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/program_model.dart';
import '../widgets/media_widgets.dart';

class ModuleScreen extends StatefulWidget {
  final String programId;
  final String moduleId;
  const ModuleScreen({super.key, required this.programId, required this.moduleId});

  @override
  State<ModuleScreen> createState() => _ModuleScreenState();
}

class _ModuleScreenState extends State<ModuleScreen> {
  final _controller = TextEditingController();
  bool _saved = false;

  void _save(ModuleContentType type, ProgramModel model) {
    if (type == ModuleContentType.journal) {
      final text = _controller.text.trim();
      if (text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Escribe algo antes de guardar')),
        );
        return;
      }
      model.addEntry(ModuleEntry(widget.moduleId, text));
    }
    model.markCompleted(widget.programId, widget.moduleId);
    setState(() => _saved = true);
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Guardado \u2714')));
  }

  @override
  Widget build(BuildContext context) {
    final model = context.watch<ProgramModel>();
    final program = model.programs.firstWhere((p) => p.id == widget.programId);
    final module = program.modules.firstWhere((m) => m.id == widget.moduleId);

    Widget body;
    switch (module.type) {
      case ModuleContentType.audio:
        body = AudioPlayerWidget(url: module.mediaUrl ?? '');
        break;
      case ModuleContentType.video:
        body = VideoPlayerWidget(url: module.mediaUrl ?? '');
        break;
      case ModuleContentType.quiz:
        body = _QuizWidget(moduleId: module.id, prompts: module.prompts ?? []);
        break;
      case ModuleContentType.journal:
        body = Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (module.prompts != null) ...[
                const Text('Prompt:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(module.prompts!.join('\n\n'),
                    style: const TextStyle(fontStyle: FontStyle.italic)),
                const SizedBox(height: 16),
              ],
              Expanded(
                child: TextField(
                  controller: _controller,
                  expands: true,
                  maxLines: null,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Escribe aqui...'
                  ),
                ),
              ),
            ],
          ),
        );
        break;
    }

    return Scaffold(
      appBar: AppBar(title: Text(module.title)),
      body: Column(
        children: [
          Expanded(child: body),
          if (module.type != ModuleContentType.quiz)
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: _saved ? null : () => _save(module.type, model),
                icon: Icon(_saved ? Icons.check : Icons.save),
                label: Text(_saved ? 'Guardado' : 'Completar'),
              ),
            ),
        ],
      ),
    );
  }
}

class _QuizWidget extends StatefulWidget {
  final String moduleId;
  final List<String> prompts;
  const _QuizWidget({required this.moduleId, required this.prompts});

  @override
  State<_QuizWidget> createState() => _QuizWidgetState();
}

class _QuizWidgetState extends State<_QuizWidget> {
  int index = 0;
  final Map<String, int> answers = {};

  void _next() {
    if (answers[widget.prompts[index]] != null) {
      if (index < widget.prompts.length - 1) {
        setState(() => index++);
      } else {
        // mark complete when finished
        final model = context.read<ProgramModel>();
        model.markCompleted('', widget.moduleId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.prompts[index];
    return Column(
      children: [
        LinearProgressIndicator(value: (index + 1) / widget.prompts.length),
        const SizedBox(height: 16),
        Text(q),
        const SizedBox(height: 16),
        ...List.generate(4, (i) {
          return RadioListTile<int>(
            value: i,
            groupValue: answers[q],
            title: Text('$i'),
            onChanged: (v) => setState(() => answers[q] = v!),
          );
        }),
        ElevatedButton(onPressed: _next, child: Text(index < widget.prompts.length - 1 ? 'Siguiente' : 'Terminar')),
      ],
    );
  }
}
