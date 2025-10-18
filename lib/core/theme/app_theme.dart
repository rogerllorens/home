import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final appThemeProvider = ChangeNotifierProvider<AppThemeController>((ref) => AppThemeController(ref));

class AppThemeController extends ChangeNotifier {
  AppThemeController(this._ref) {
    _loadPreferences();
  }

  final Ref _ref;
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  final FlexSchemeColor lightScheme = const FlexSchemeColor(
    primary: Color(0xFF5C6CFF),
    primaryContainer: Color(0xFFDBE1FF),
    secondary: Color(0xFF9B5CFF),
    secondaryContainer: Color(0xFFEEDBFF),
    tertiary: Color(0xFF00BFA6),
    tertiaryContainer: Color(0xFFC9FFF1),
    appBarColor: Color(0xFF1D2140),
  );

  final FlexSchemeColor darkScheme = const FlexSchemeColor(
    primary: Color(0xFFB4BEFF),
    primaryContainer: Color(0xFF3742B5),
    secondary: Color(0xFFDAB7FF),
    secondaryContainer: Color(0xFF5E348E),
    tertiary: Color(0xFF4FE1C5),
    tertiaryContainer: Color(0xFF005F53),
    appBarColor: Color(0xFF0B0D1F),
  );

  FlexSubThemesData get subThemes => const FlexSubThemesData(
        interactionEffects: true,
        useTextTheme: true,
        blendOnLevel: 10,
        blendOnColors: false,
        cardElevation: 1,
        thickBorderWidth: 1.2,
        thinBorderWidth: 0.8,
        inputDecoratorRadius: 20,
        inputDecoratorSchemeColor: SchemeColor.tertiary,
        toggleButtonsRadius: 20,
      );

  TextTheme get textTheme => GoogleFonts.plusJakartaSansTextTheme();

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('theme_mode');
    if (saved != null) {
      _themeMode = ThemeMode.values.firstWhere((mode) => mode.name == saved, orElse: () => ThemeMode.system);
      notifyListeners();
    }
  }

  Future<void> updateThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('theme_mode', mode.name);
  }
}
