import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/scanly_logo.dart';
import '../shared_camera.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;
  late final Future<void> _cameraInitFuture;

  @override
  void initState() {
    super.initState();
    _cameraInitFuture = SharedCamera.instance.init();
    if (!showSplashNotifier.value) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomePage()),
        );
      });
      return;
    }
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic);
    _slide = Tween(begin: const Offset(0, 0.1), end: Offset.zero)
        .animate(_fade);
    _controller.forward();
    final dur = Duration(milliseconds:
        (splashDurationNotifier.value * 1000).round());
    Future.delayed(dur, () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomePage()),
        );
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
    final color = Theme.of(context).colorScheme.primary;
    return Scaffold(
      body: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            FadeTransition(
              opacity: _fade,
              child: SlideTransition(
                position: _slide,
                child: const CodeMaster ProLogo(variant: LogoVariant.splash),
              ),
            ),
            AnimatedBuilder(
              animation: _fade,
              builder: (context, child) {
                return Positioned(
                  left: 0,
                  right: 0,
                  top: 40 * _fade.value,
                  child: Opacity(
                    opacity: _fade.value,
                    child: Container(height: 2, color: color.withOpacity(0.6)),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
