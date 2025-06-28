import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:settings_ui/settings_ui.dart';
import '../services/notification_service.dart';
import 'package:go_router/go_router.dart';
import '../theme_notifier.dart';
import '../providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _darkMode = false;
  bool _notifs = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    _darkMode = ref.read(themeProvider).mode == ThemeMode.dark;
    _notifs = prefs.getBool('notify') ?? true;
    setState(() {});
  }

  Future<void> _toggleDark(bool value) async {
    await ref.read(themeProvider).setDark(value);
    setState(() => _darkMode = value);
  }

  Future<void> _toggleNotifs(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notify', value);
    if (value) {
      await NotificationService().scheduleDaily(const Time(18, 0),
          title: 'Registra tu ánimo', body: '¿Cómo te sientes hoy?');
    } else {
      await NotificationService().cancel(0);
    }
    setState(() => _notifs = value);
  }

  void _logout(BuildContext context) {
    Navigator.popUntil(context, (route) => route.isFirst);
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ajustes')),
      body: SettingsList(
        sections: [
          SettingsSection(
            title: const Text('Cuenta'),
            tiles: [
              SettingsTile.navigation(
                leading: const Icon(Icons.person),
                title: const Text('Editar perfil'),
                onPressed: (_) => context.go('/profile/edit'),
              ),
              SettingsTile.navigation(
                leading: const Icon(Icons.logout),
                title: const Text('Cerrar sesión'),
                onPressed: (_) => _logout(context),
              ),
            ],
          ),
          SettingsSection(
            title: const Text('Preferencias'),
            tiles: [
              SettingsTile.switchTile(
                initialValue: _darkMode,
                leading: const Icon(Icons.dark_mode),
                title: const Text('Modo oscuro'),
                onToggle: _toggleDark,
              ),
              SettingsTile.switchTile(
                initialValue: _notifs,
                leading: const Icon(Icons.notifications),
                title: const Text('Notificaciones'),
                onToggle: _toggleNotifs,
              ),
              SettingsTile.navigation(
                leading: const Icon(Icons.history),
                title: const Text('Exportar datos'),
                onPressed: (_) => context.go('/settings/export'),
              ),
            ],
          ),
          SettingsSection(
            title: const Text('Privacidad'),
            tiles: [
              SettingsTile.navigation(
                leading: const Icon(Icons.lock),
                title: const Text('Política de privacidad'),
                onPressed: (_) => context.go('/privacy'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
