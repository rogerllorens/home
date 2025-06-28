import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers.dart';
import '../models/user_model.dart';
import '../models/mood_model.dart';
import '../models/reward_model.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    final moodCount = ref.watch(moodProvider).length;
    final points = ref.watch(rewardProvider).points;
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: CircleAvatar(
              radius: 40,
              backgroundImage: user.avatarUrl != null
                  ? FileImage(File(user.avatarUrl!))
                  : null,
              child: user.avatarUrl == null
                  ? const Icon(Icons.person, size: 48)
                  : null,
            ),
          ),
          TextButton(
            onPressed: () => context.go('/profile/edit'),
            child: const Text('Editar foto'),
          ),
          const SizedBox(height: 8),
          Center(child: Text(user.name, style: const TextStyle(fontSize: 18))),
          if (user.email.isNotEmpty)
            Center(
                child: Text(user.email,
                    style: const TextStyle(color: Colors.grey))),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.mood),
            title: const Text('Registros de ánimo'),
            trailing: Text('$moodCount'),
          ),
          ListTile(
            leading: const Icon(Icons.card_giftcard),
            title: const Text('Puntos'),
            trailing: Text('$points'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.go('/profile/edit'),
            child: const Text('Editar perfil'),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => ref.read(userProvider).logout(),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
  }
}
