import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/reward_model.dart';
import '../services/analytics_service.dart';

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    AnalyticsService.logEvent('open_rewards');
    final rewards = <Reward>[
      Reward(id: 'r1', title: 'Gift Card $5', description: 'Canjala en tiendas participantes', cost: 50, imageUrl: 'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl.jpg'),
      Reward(id: 'r2', title: 'Camiseta MindConnect', description: 'Merchandising exclusivo', cost: 100, imageUrl: 'https://flutter.github.io/assets-for-api-docs/assets/widgets/owl-2.jpg'),
    ];
    final userPoints = context.watch<RewardModel>().points;
    return Scaffold(
      appBar: AppBar(title: const Text('Recompensas')),
      body: GridView.builder(
        padding: const EdgeInsets.all(8),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 0.8,
        ),
        itemCount: rewards.length,
        itemBuilder: (ctx, i) {
          final r = rewards[i];
          final canRedeem = userPoints >= r.cost;
          return Card(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.network(r.imageUrl, height: 80, fit: BoxFit.cover),
                const SizedBox(height: 8),
                Text(r.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('${r.cost} pts'),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: canRedeem ? () {
                    final ok = context.read<RewardModel>().redeem(r);
                    if (ok) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(content: Text('Canje exitoso')),
                      );
                    }
                  } : null,
                  child: Text(canRedeem ? 'Canjear' : 'Faltan ${r.cost - userPoints}'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
