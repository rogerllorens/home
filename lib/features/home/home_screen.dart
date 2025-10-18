import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/services/document_service.dart';
import '../document/models/document_file.dart';
import 'widgets/document_grid.dart';
import 'widgets/quick_action_card.dart';
import 'widgets/ai_workspace_card.dart';

class HomeScreen extends HookConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.watch(documentServiceProvider);
    final localization = AppLocalizations.of(context);
    final refreshIndicatorKey = useMemoized(GlobalKey<RefreshIndicatorState>.new);

    Future<void> importDocuments() async {
      final result = await FilePicker.platform.pickFiles(allowMultiple: true);
      final paths = result?.paths.whereType<String>().toList() ?? [];
      if (paths.isNotEmpty) {
        await ref.read(documentServiceProvider).importFiles(paths.map(File.new).toList());
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              child: SvgPicture.asset('assets/branding/logo.svg'),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(localization.string('app_name'), style: Theme.of(context).textTheme.titleMedium),
                Text(
                  localization.string('tagline'),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => context.push('/home/settings'),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/home/scanner'),
        icon: const Icon(Icons.document_scanner_outlined),
        label: const Text('Escanear'),
      ),
      body: RefreshIndicator(
        key: refreshIndicatorKey,
        onRefresh: () => ref.read(documentServiceProvider).scanLibrary(),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        QuickActionCard(
                          icon: Icons.upload_file_outlined,
                          label: 'Importar',
                          onTap: importDocuments,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        QuickActionCard(
                          icon: Icons.draw_outlined,
                          label: 'Anotar',
                          onTap: () {
                            if (service.documents.isEmpty) return;
                            final doc = service.documents.first;
                            context.push('/home/viewer/${doc.id}');
                          },
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                        QuickActionCard(
                          icon: Icons.auto_awesome,
                          label: 'IA',
                          onTap: () => context.push('/home/settings', extra: 'ai'),
                          color: Theme.of(context).colorScheme.tertiary,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      localization.string('home_sections.recent'),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    if (service.isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                    else if (service.documents.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          color: Theme.of(context).colorScheme.surfaceVariant,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.cloud_upload_outlined, size: 72),
                            SizedBox(height: 12),
                            Text('Importa o escanea tu primer PDF para comenzar.'),
                          ],
                        ),
                      )
                    else
                      DocumentGrid(documents: service.documents.take(6).toList()),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Colecciones inteligentes',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _SmartSpaces(documents: service.documents),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              sliver: SliverToBoxAdapter(
                child: AiWorkspaceCard(onOpenAssistant: () => context.push('/home/settings', extra: 'ai')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SmartSpaces extends StatelessWidget {
  const _SmartSpaces({required this.documents});

  final List<DocumentFile> documents;

  @override
  Widget build(BuildContext context) {
    final favorites = documents.where((doc) => doc.isFavorite).toList();
    final protected = documents.where((doc) => doc.isProtected).toList();

    return Column(
      children: [
        _SmartSpaceTile(
          title: 'Favoritos',
          description: 'Tus archivos destacados siempre a un toque.',
          icon: Icons.star_outline,
          count: favorites.length,
        ),
        const SizedBox(height: 12),
        _SmartSpaceTile(
          title: 'Protegidos',
          description: 'Documentos cifrados con contraseña.',
          icon: Icons.lock_outline,
          count: protected.length,
        ),
        const SizedBox(height: 12),
        _SmartSpaceTile(
          title: 'Firmados',
          description: 'Contratos y formularios firmados recientemente.',
          icon: Icons.edit_document,
          count: documents.where((doc) => doc.spaces.contains(DocumentSpace.signed)).length,
        ),
      ],
    );
  }
}

class _SmartSpaceTile extends StatelessWidget {
  const _SmartSpaceTile({
    required this.title,
    required this.description,
    required this.icon,
    required this.count,
  });

  final String title;
  final String description;
  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: Theme.of(context).colorScheme.surfaceVariant,
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            child: Icon(icon, color: Theme.of(context).colorScheme.primary),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(description, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          Chip(label: Text('$count')),
        ],
      ),
    );
  }
}
