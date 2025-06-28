import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _mood = false;
  bool _analytics = false;
  bool _marketing = false;
  final _prefs = SharedPreferences.getInstance();

  void _submit() async {
    if (_mood && _analytics) {
      final p = await _prefs;
      await p.setBool('consent_mood', _mood);
      await p.setBool('consent_analytics', _analytics);
      await p.setBool('consent_marketing', _marketing);
      if (mounted) context.go('/questionnaire');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Consentimiento de privacidad')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Antes de continuar, acepta el uso de tus datos:'),
          CheckboxListTile(
            title: const Text('Uso de datos de ánimo (requerido)'),
            value: _mood,
            onChanged: (v) => setState(() => _mood = v ?? false),
          ),
          CheckboxListTile(
            title: const Text('Análisis anónimo (requerido)'),
            value: _analytics,
            onChanged: (v) => setState(() => _analytics = v ?? false),
          ),
          CheckboxListTile(
            title: const Text('Marketing y comunicaciones (opcional)'),
            value: _marketing,
            onChanged: (v) => setState(() => _marketing = v ?? false),
          ),
          TextButton(
            onPressed: () => launchUrl(Uri.parse('https://example.com/privacy.pdf')),
            child: const Text('Ver política de privacidad'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: (_mood && _analytics) ? _submit : null,
            child: const Text('Continuar'),
          ),
        ],
      ),
    );
  }
}
