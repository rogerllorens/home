import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/theme/app_theme.dart';

class SettingsScreen extends HookConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(appThemeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Preferencias')), 
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Personaliza tu experiencia', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 24),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Column(
              children: [
                ListTile(
                  title: const Text('Tema del sistema'),
                  leading: const Icon(Icons.color_lens_outlined),
                  trailing: SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(value: ThemeMode.system, label: Text('Auto'), icon: Icon(Icons.brightness_4_outlined)),
                      ButtonSegment(value: ThemeMode.light, label: Text('Claro'), icon: Icon(Icons.wb_sunny_outlined)),
                      ButtonSegment(value: ThemeMode.dark, label: Text('Oscuro'), icon: Icon(Icons.bedtime_outlined)),
                    ],
                    selected: {theme.themeMode},
                    onSelectionChanged: (value) => ref.read(appThemeProvider).updateThemeMode(value.first),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.notifications_active_outlined),
                  title: const Text('Recordatorios inteligentes'),
                  subtitle: const Text('Recibe alertas para documentos pendientes de firmar.'),
                  trailing: Switch(value: true, onChanged: (_) {}),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock_outline),
                  title: const Text('Bloqueo con biometría'),
                  subtitle: const Text('Protege el acceso con tu huella o rostro.'),
                  trailing: Switch(value: false, onChanged: (_) {}),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ListTile(
                  leading: Icon(Icons.auto_awesome_outlined),
                  title: Text('Asistente IA'),
                  subtitle: Text('Resume, traduce y genera ideas con nuestro copiloto.'),
                ),
                ListTile(
                  leading: Icon(Icons.security_outlined),
                  title: Text('Privacidad de datos'),
                  subtitle: Text('Tus documentos se procesan localmente siempre que es posible.'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.feedback_outlined),
            label: const Text('Enviar comentarios'),
          ),
        ],
      ),
    );
  }
}
