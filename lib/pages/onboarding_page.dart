import 'package:flutter/material.dart';
import 'package:introduction_screen/introduction_screen.dart';
import '../main.dart';
import 'splash_page.dart';
import 'package:hive/hive.dart';

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});

  List<PageViewModel> _pages(BuildContext context) {
    return [
      PageViewModel(
        title: 'Escanea códigos',
        body: 'Detecta QR y códigos de barras desde la cámara o imágenes.',
        image: const Icon(Icons.center_focus_strong_outlined, size: 120),
      ),
      PageViewModel(
        title: 'OCR y traducción',
        body: 'Extrae texto de fotos y tradúcelo sin conexión.',
        image: const Icon(Icons.text_fields, size: 120),
      ),
      PageViewModel(
        title: 'Genera tus propios QR',
        body: 'Crea códigos personalizados y compártelos fácilmente.',
        image: const Icon(Icons.qr_code, size: 120),
      ),
      PageViewModel(
        title: 'Seguridad ante todo',
        body: 'Verificamos enlaces con Safe Browsing antes de abrirlos.',
        image: const Icon(Icons.shield_outlined, size: 120),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return IntroductionScreen(
      pages: _pages(context),
      showSkipButton: true,
      skip: const Text('Saltar'),
      next: const Icon(Icons.arrow_forward),
      done: const Text('Empezar'),
      onDone: () {
        Hive.box('settings').put('onboarded', true);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const SplashPage()),
        );
      },
      onSkip: () {
        Hive.box('settings').put('onboarded', true);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const SplashPage()),
        );
      },
    );
  }
}
