import 'package:flutter/material.dart';
import 'package:flutter_onboarding_slider/flutter_onboarding_slider.dart';
import 'package:go_router/go_router.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  Widget _buildPage(String img, String title, String desc) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(img, height: 300, semanticLabel: title),
          const SizedBox(height: 24),
          Text(title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(desc, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: OnBoardingSlider(
        headerBackgroundColor: Colors.white,
        finishButtonText: 'Comenzar',
        finishButtonStyle: const FinishButtonStyle(backgroundColor: Colors.blueAccent),
        skipTextButton: const Text('Saltar'),
        trailing: const SizedBox(),
        background: [
          Image.asset('assets/onboarding1.png', semanticLabel: 'Paso 1'),
          Image.asset('assets/onboarding2.png', semanticLabel: 'Paso 2'),
          Image.asset('assets/onboarding3.png', semanticLabel: 'Paso 3'),
        ],
        totalPage: 3,
        speed: 1.5,
        pageBodies: [
          _buildPage('assets/onboarding1.png', 'Bienvenido a MindConnect',
              'Registra tu estado de ánimo y lleva un seguimiento diario.'),
          _buildPage('assets/onboarding2.png', 'Recibe apoyo con IA',
              'Charla con nuestro asistente para mejorar tu bienestar.'),
          _buildPage('assets/onboarding3.png', 'Accede a recursos útiles',
              'Explora actividades, retos y sesiones guiadas.'),
        ],
        onFinish: () => context.go('/login'),
      ),
    );
  }
}
