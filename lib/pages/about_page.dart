import 'package:flutter/material.dart';
import 'privacy_policy_page.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Acerca de')),
      body: ListView(
        children: [
          const ListTile(
            title: Text('Versión'),
            subtitle: Text('1.0.0'),
          ),
          ListTile(
            title: const Text('Política de privacidad'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PrivacyPolicyPage()),
              );
            },
          ),
          ListTile(
            title: const Text('Enviar feedback'),
            onTap: () async {
              final uri = Uri.parse('mailto:scanlyqr@gmail.com');
              if (await canLaunchUrl(uri)) await launchUrl(uri);
            },
          ),
          ListTile(
            title: const Text('Enviar logs de error'),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Logs enviados')));
            },
          ),
          ListTile(
            title: const Text('Créditos y licencias'),
            onTap: () => showLicensePage(
              context: context,
              applicationName: 'CodeMaster Pro',
            ),
          ),
          ListTile(
            title: const Text('Dependencias'),
            onTap: () async {
              final yaml = await DefaultAssetBundle.of(context)
                  .loadString('pubspec.yaml');
              final lines = yaml
                  .split('\n')
                  .where((l) => l.startsWith('  ') && l.contains(': ^'))
                  .map((l) => l.trim())
                  .join('\n');
              await showDialog(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Dependencias'),
                  content: SingleChildScrollView(child: Text(lines)),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
