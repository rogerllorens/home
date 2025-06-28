import 'package:flutter/material.dart';
import "package:go_router/go_router.dart";
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/mood_model.dart';
import '../widgets/mood_tracker_widget.dart';
import '../widgets/mood_graph.dart';
import '../widgets/quick_card.dart';
import '../widgets/feed_widget.dart';
import '../widgets/resource_card.dart';
import '../models/resource_model.dart';
import '../providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _reloadData(WidgetRef ref) async {
    await ref.read(moodProvider.notifier).init();
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: const Text('MindConnect'),
      actions: [
        IconButton(
          icon: const Icon(Icons.person),
          onPressed: () => context.go('/profile'),
        )
      ],
    );
  }

  Widget _buildQuickAccess(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          QuickCard(icon: Icons.chat, label: 'Chat', onTap: () => context.go('/chat')),
          QuickCard(icon: Icons.bedtime, label: 'Sleep', onTap: () => context.go('/sleep_stories')),
          QuickCard(icon: Icons.flag, label: 'Retos', onTap: () => context.go('/challenges')),
          QuickCard(icon: Icons.school, label: 'Programas', onTap: () => context.go('/programs')),
          QuickCard(icon: Icons.card_giftcard, label: 'Recompensas', onTap: () => context.go('/rewards')),
          QuickCard(icon: Icons.library_books, label: 'Recursos', onTap: () => context.go('/library')),
        ],
      ),
    );
  }

  Widget? _buildRecommendation(BuildContext context, int mood) {
    if (mood <= 2) {
      return ResourceCard(
        title: 'Ejercicio de respiraci\u00f3n',
        description: 'Toma un minuto para calmarte con una respiraci\u00f3n guiada',
        onTap: () {},
      );
    } else if (mood == 3) {
      return ResourceCard(
        title: 'Consejo de mindfulness',
        description: 'Prueba este tip para centrarte hoy',
        onTap: () {},
      );
    } else if (mood >= 4) {
      return ResourceCard(
        title: 'Sigue as\u00ed!',
        description: 'Excelente estado de \u00e1nimo, mantenlo con este art\u00edculo',
        onTap: () {},
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries = ref.watch(moodProvider);
    final moodNotifier = ref.read(moodProvider.notifier);

    return Scaffold(
      appBar: _buildAppBar(context),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/chat'),
        child: const Icon(Icons.chat),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          switch (i) {
            case 1:
              context.go('/communities');
              break;
            case 2:
              context.go('/programs');
              break;
            case 3:
              context.go('/profile');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.group), label: 'Comunidades'),
          BottomNavigationBarItem(icon: Icon(Icons.flag), label: 'Programas'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _reloadData(ref),
        child: SingleChildScrollView(
          child: Column(
            children: [
              const MoodTrackerWidget(),
              MoodGraph(entries: moodNotifier.getLastDays(7)),
              const SizedBox(height: 16),
              _buildQuickAccess(context),
              const FeedWidget(),
              ResourceCard(
                resource: Resource(
                  id: 'lib',
                  title: 'Explora recursos',
                  description: 'Art\u00edculos y videos para ti',
                  mediaUrl:
                      'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl-2.jpg',
                  type: ResourceType.article,
                ),
                onTap: () => context.go('/library'),
              ),
              if (entries.isNotEmpty)
                _buildRecommendation(context, entries.last.mood) ?? const SizedBox.shrink(),
            ],
          ),
        ),
      ),
    );
  }
}
