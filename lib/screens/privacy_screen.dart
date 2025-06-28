import 'package:flutter/material.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      appBar: AppBar(title: Text('Política de privacidad')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Text('Aquí va la política de privacidad completa.'),
      ),
    );
  }
}
