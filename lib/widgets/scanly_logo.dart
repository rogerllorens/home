import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum LogoVariant { splash, scan, standard, static }

class CodeMaster ProLogo extends StatefulWidget {
  final LogoVariant variant;
  const CodeMaster ProLogo({super.key, this.variant = LogoVariant.standard});

  @override
  State<CodeMaster ProLogo> createState() => _CodeMaster ProLogoState();
}

class _CodeMaster ProLogoState extends State<CodeMaster ProLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _barController;
  late final AnimationController _fadeController;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _barController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fade = CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut);
    if (widget.variant == LogoVariant.splash ||
        widget.variant == LogoVariant.standard ||
        widget.variant == LogoVariant.scan) {
      _barController.repeat(reverse: true);
    }
    _fadeController.forward();
  }

  @override
  void dispose() {
    _barController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  double get _fontSize {
    switch (widget.variant) {
      case LogoVariant.splash:
        return 48;
      case LogoVariant.scan:
        return 20;
      case LogoVariant.static:
        return 32;
      case LogoVariant.standard:
      default:
        return 32;
    }
  }

  double get _opacity {
    switch (widget.variant) {
      case LogoVariant.scan:
        return 0.3;
      case LogoVariant.static:
        return 0.8;
      default:
        return 1.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final color =
        brightness == Brightness.dark ? const Color(0xFF66B2FF) : const Color(0xFF0055AA);
    return Opacity(
      opacity: _opacity,
      child: FadeTransition(
        opacity: _fade,
        child: AnimatedBuilder(
          animation: _barController,
          builder: (context, child) {
            final pos = _barController.value;
            return ShaderMask(
              shaderCallback: (Rect rect) {
                return LinearGradient(
                  begin: Alignment(-1 + 2 * pos, 0),
                  end: Alignment(1 + 2 * pos, 0),
                  colors: [
                    color.withOpacity(0.3),
                    color,
                    color.withOpacity(0.3),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ).createShader(rect);
              },
              blendMode: BlendMode.srcIn,
              child: child!,
            );
          },
          child: Semantics(
            label: 'CodeMaster Pro',
            header: widget.variant == LogoVariant.splash,
            child: Text(
              'CodeMaster Pro',
              style: GoogleFonts.roboto(
                fontWeight: FontWeight.bold,
                fontSize: _fontSize,
                color: color,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
