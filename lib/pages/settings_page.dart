import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:permission_handler/permission_handler.dart';

import '../main.dart';
import '../widgets/scanly_logo.dart';
import '../stats.dart';
import "language_page.dart";
import 'about_page.dart';
import 'faq_page.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool ocr = false;
  late final Box settings;

  @override
  void initState() {
    super.initState();
    settings = Hive.box('settings');
  }

  Widget _permissionTile(Permission permission, String title) {
    return FutureBuilder(
      future: permission.status,
      builder: (context, snapshot) {
        final status = snapshot.data;
        IconData icon = Icons.help;
        Color color = Colors.grey;
        if (status != null) {
          if (status.isGranted) {
            icon = Icons.check_circle;
            color = Colors.green;
          } else if (status.isPermanentlyDenied) {
            icon = Icons.cancel;
            color = Colors.red;
          } else {
            icon = Icons.error;
            color = Theme.of(context).colorScheme.secondary;
          }
        }
        return ListTile(
          leading: Icon(icon, color: color),
          title: Text(title),
          subtitle: Text(status?.toString() ?? ''),
          onTap: () => openAppSettings(),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const CodeMaster ProLogo(variant: LogoVariant.static),
      ),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.palette),
            title: const Text('Tema'),
            subtitle: const Text('Claro / Oscuro / Sistema'),
            onTap: () async {
              final mode = await showDialog<ThemeMode>(
                context: context,
                builder: (ctx) => SimpleDialog(
                  title: const Text('Tema'),
                  children: [
                    SimpleDialogOption(
                      onPressed: () => Navigator.pop(ctx, ThemeMode.system),
                      child: const Text('Sistema'),
                    ),
                    SimpleDialogOption(
                      onPressed: () => Navigator.pop(ctx, ThemeMode.light),
                      child: const Text('Claro'),
                    ),
                    SimpleDialogOption(
                      onPressed: () => Navigator.pop(ctx, ThemeMode.dark),
                      child: const Text('Oscuro'),
                    ),
                  ],
                ),
              );
              if (mode != null) themeNotifier.value = mode;
              Hive.box('settings').put('theme', mode.index);
            },
          ),
            ListTile(
              leading: const Icon(Icons.language),
              title: const Text("Idioma"),
              subtitle: Text(localeNotifier.value?.languageCode ?? "system"),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const LanguagePage()));
              },
            ),
          SwitchListTile(
            title: const Text('Mostrar splash al iniciar'),
            value: showSplashNotifier.value,
            onChanged: (v) {
              showSplashNotifier.value = v;
              Hive.box('settings').put('showSplash', v);
            },
          ),
          ListTile(
            title: const Text('Duración splash (segundos)'),
            subtitle: ValueListenableBuilder<double>(
              valueListenable: splashDurationNotifier,
              builder: (context, value, _) {
                return Slider(
                  min: 0.5,
                  max: 5.0,
                  divisions: 9,
                  label: value.toStringAsFixed(1),
                  value: value,
                  onChanged: (v) {
                    splashDurationNotifier.value = v;
                    Hive.box('settings').put('splashDuration', v);
                  },
                );
              },
            ),
          ),
          ExpansionTile(
            leading: const Icon(Icons.lock),
            title: const Text('Seguridad'),
            children: [
              ValueListenableBuilder<bool>(
                valueListenable: safeBrowsingNotifier,
                builder: (context, value, _) => SwitchListTile(
                  title: const Text('Verificar URLs con Safe Browsing'),
                  value: value,
                  onChanged: (v) {
                    safeBrowsingNotifier.value = v;
                    Hive.box('settings').put('safeBrowsing', v);
                  },
                ),
              ),
              ValueListenableBuilder<bool>(
                valueListenable: confirmOpenNotifier,
                builder: (context, value, _) => SwitchListTile(
                  title: const Text('Confirmar antes de abrir enlaces'),
                  value: value,
                  onChanged: (v) {
                    confirmOpenNotifier.value = v;
                    Hive.box('settings').put('confirmOpen', v);
                  },
                ),
              ),
              ValueListenableBuilder<bool>(
                valueListenable: revalidateOnConnectNotifier,
                builder: (context, value, _) => SwitchListTile(
                  title: const Text('Revalidar al conectarse'),
                  value: value,
                  onChanged: (v) {
                    revalidateOnConnectNotifier.value = v;
                    Hive.box('settings').put('revalidateConnect', v);
                  },
                ),
              ),
              ValueListenableBuilder<bool>(
                valueListenable: revalidateOnOpenNotifier,
                builder: (context, value, _) => SwitchListTile(
                  title: const Text('Revalidar al abrir historial'),
                  value: value,
                  onChanged: (v) {
                    revalidateOnOpenNotifier.value = v;
                    Hive.box('settings').put('revalidateOpen', v);
                  },
              ),
            ),
          ],
        ),
        ExpansionTile(
          leading: const Icon(Icons.text_fields),
          title: const Text('OCR'),
          children: [
            ValueListenableBuilder<bool>(
              valueListenable: invertOcrNotifier,
              builder: (context, value, _) => SwitchListTile(
                title: const Text('Forzar modo oscuro al procesar'),
                value: value,
                onChanged: (v) {
                  invertOcrNotifier.value = v;
                  Hive.box('settings').put('invertOcr', v);
                },
              ),
            ),
          ],
        ),
        ExpansionTile(
            leading: const Icon(Icons.support_agent),
            title: const Text('Soporte y ayuda'),
            children: [
              ListTile(
                title: const Text('Preguntas frecuentes'),
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const FAQPage()));
                },
              ),
              ListTile(
                title: const Text('Resetear permisos'),
                onTap: () async {
                  await Permission.camera.request();
                  await Permission.photos.request();
                  setState(() {});
                },
              ),
              ListTile(
                title: const Text('Enviar logs de errores'),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Logs enviados')));
                },
              ),
              ListTile(
                title: const Text('Enviar feedback'),
                onTap: () async {
                  final uri = Uri.parse('mailto:scanlyqr@gmail.com');
                  if (await canLaunchUrl(uri)) await launchUrl(uri);
                },
              ),
              const ListTile(
                title: Text('CodeMaster Pro almacena los resultados de Navegacion segura y el historial solo en tu dispositivo.'),
              ),
            ],
          ),
          ExpansionTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('Acerca de'),
            children: [
              const ListTile(
                title: Text('Versión'),
                subtitle: Text('1.0.0'),
              ),
              ListTile(
                title: const Text('Política de privacidad'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyPolicyPage()));
                },
              ),
              ListTile(
                title: const Text('Créditos y licencias'),
                onTap: () => showLicensePage(context: context, applicationName: 'CodeMaster Pro'),
              ),
            ],
          ),
          ListTile(
            leading: const Icon(Icons.upload_file),
            title: const Text('Exportar historial'),
            onTap: () async {
              final box = Hive.box('history');
              final buffer = StringBuffer('codigo,fecha,conteo\n');
              for (final v in box.values) {
                if (v is Map) {
                  buffer.writeln('${v['code']},${v['date']},${v['count']}');
                }
              }
              await Clipboard.setData(ClipboardData(text: buffer.toString()));
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Historial copiado al portapapeles')));
            },
          ),
          ListTile(
            leading: const Icon(Icons.delete_forever),
            title: const Text('Borrar historial y estadísticas'),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Borrar'),
                  content: const Text('¿Eliminar todo el historial y las estadísticas?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
                    TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Borrar')),
                  ],
                ),
              );
              if (confirm == true) {
                await Hive.box('history').clear();
                StatsHelper.clear();
                if (mounted) setState(() {});
              }
            },
          ),
          _permissionTile(Permission.camera, 'Permiso cámara'),
          _permissionTile(Permission.photos, 'Permiso fotos'),
        ],
      ),
    );
  }
}
