import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    final reduce = MediaQueryData.fromView(WidgetsBinding.instance.platformDispatcher.views.first).disableAnimations;
    _controller = AnimationController(
      vsync: this,
      duration: reduce ? Duration.zero : const Duration(seconds: 3),
    );
    _opacity = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward();
    Future.delayed(const Duration(seconds: 3), () async {
      final prefs = await SharedPreferences.getInstance();
      final logged = prefs.getString('current_user');
      final consent = prefs.getBool('consent_mood') ?? false;
      if (!mounted) return;
      if (logged != null) {
        context.go(consent ? '/home' : '/consent');
      } else {
        context.go('/onboarding');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFe3f2fd),
      body: Center(
        child: FadeTransition(
          opacity: _opacity,
          child: Image.asset('assets/logo.png', width: 200, semanticLabel: 'MindConnect logo'),
        ),
      ),
    );
  }
}
