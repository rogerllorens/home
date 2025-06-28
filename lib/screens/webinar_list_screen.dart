import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/webinar_model.dart';
import '../models/user_model.dart';

class WebinarListScreen extends StatelessWidget {
  const WebinarListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final model = context.watch<WebinarModel>();
    final userId = context.watch<UserModel>().userId;
    final webinars = model.webinars;
    return Scaffold(
      appBar: AppBar(title: const Text('Webinars')),
      body: ListView.builder(
        itemCount: webinars.length,
        itemBuilder: (_, i) {
          final w = webinars[i];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text(w.title),
              subtitle: Text(DateFormat.yMMMd().add_Hm().format(w.scheduledAt)),
              trailing: ElevatedButton(
                child: Text(w.isLive
                    ? 'Unirse ahora'
                    : userId != null && model.isRegistered(w.id, userId)
                        ? 'Registrado'
                        : 'Inscribirse'),
                onPressed: w.isLive
                    ? () => context.go('/webinar/${w.id}')
                    : userId == null
                        ? () => context.go('/login')
                        : model.isRegistered(w.id, userId)
                            ? null
                            : () => model.register(w.id, userId),
              ),
            ),
          );
        },
      ),
    );
  }
}
