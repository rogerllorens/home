import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'design_system.dart';
import 'pages/scan_page.dart';
import 'pages/generate_page.dart';
import 'pages/gallery_page.dart';
import 'pages/history_page.dart';
import 'pages/settings_page.dart';
import 'pages/splash_page.dart';
import 'pages/onboarding_page.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'connectivity_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'config.dart';

final themeNotifier = ValueNotifier(ThemeMode.system);
final localeNotifier = ValueNotifier<Locale?>(null);
final batchNotifier = ValueNotifier<bool>(false);
final showSplashNotifier = ValueNotifier<bool>(true);
final splashDurationNotifier = ValueNotifier<double>(1.5);
final confirmOpenNotifier = ValueNotifier<bool>(false);
final safeBrowsingNotifier = ValueNotifier<bool>(true);
final offlineNotifier = ValueNotifier<bool>(false);
final revalidateOnConnectNotifier = ValueNotifier<bool>(true);
final revalidateOnOpenNotifier = ValueNotifier<bool>(true);
final invertOcrNotifier = ValueNotifier<bool>(false);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await dotenv.load(fileName: '.env');
  final keyString = dotenv.env['HIVE_KEY'];
  HiveAesCipher? cipher;
  if (keyString != null && keyString.isNotEmpty) {
    cipher = HiveAesCipher(base64Decode(keyString));
  }
  await Hive.openBox('history', encryptionCipher: cipher);
  await Hive.openBox('generated', encryptionCipher: cipher);
  await Hive.openBox('settings', encryptionCipher: cipher);
  await Hive.openBox('stats', encryptionCipher: cipher);
  await Hive.openBox('sb_cache', encryptionCipher: cipher);
  await dotenv.load(fileName: '.env');
  if (AppConfig.enableAnalytics) {
    await Firebase.initializeApp();
    FirebaseAnalytics.instance.logAppOpen();
  }
  ConnectivityService().start();
  final settings = Hive.box('settings');
  themeNotifier.value = ThemeMode.values[settings.get('theme', defaultValue: 0)];
  showSplashNotifier.value = settings.get('showSplash', defaultValue: true);
  splashDurationNotifier.value = settings.get('splashDuration', defaultValue: 1.5);
  confirmOpenNotifier.value = settings.get('confirmOpen', defaultValue: false);
  safeBrowsingNotifier.value = settings.get('safeBrowsing', defaultValue: true);
  revalidateOnConnectNotifier.value =
      settings.get('revalidateConnect', defaultValue: true);
  revalidateOnOpenNotifier.value =
      settings.get('revalidateOpen', defaultValue: true);
  invertOcrNotifier.value = settings.get('invertOcr', defaultValue: false);
  final onboarded = settings.get('onboarded', defaultValue: false);
  final localeCode = settings.get('locale');
  if (localeCode != null) localeNotifier.value = Locale(localeCode);
  FlutterError.onError = (details) {
    Zone.current.handleUncaughtError(details.exception, details.stack!);
  };
  ErrorWidget.builder = (details) => Material(
        color: Colors.red,
        child: Center(
            child: Text('Error: ${details.exception}',
                style: const TextStyle(color: Colors.white))),
      );
  runZonedGuarded(
    () => runApp(CodeMasterProApp(onboarded: onboarded)),
    (error, stack) => debugPrint('Uncaught error: $error'),
  );
}

class CodeMasterProApp extends StatelessWidget {
  final bool onboarded;
  const CodeMasterProApp({super.key, required this.onboarded});

  @override
  Widget build(BuildContext context) {
    final baseLight = ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surfaceLight,
        background: AppColors.backgroundLight,
      ),
      useMaterial3: true,
    );
    final baseDark = ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.secondary,
        secondary: AppColors.secondary,
        surface: AppColors.surfaceDark,
        background: AppColors.backgroundDark,
      ),
      useMaterial3: true,
    );
    final textLight = GoogleFonts.robotoTextTheme(baseLight.textTheme).copyWith(
      displaySmall:
          GoogleFonts.roboto(fontWeight: FontWeight.w700, fontSize: 36),
      headlineMedium:
          GoogleFonts.roboto(fontWeight: FontWeight.w700, fontSize: 24),
      titleLarge: GoogleFonts.roboto(fontWeight: FontWeight.w600, fontSize: 20),
      titleMedium: GoogleFonts.roboto(fontWeight: FontWeight.w500, fontSize: 16),
      titleSmall: GoogleFonts.roboto(fontWeight: FontWeight.w500, fontSize: 14),
      bodyMedium: GoogleFonts.roboto(fontWeight: FontWeight.w400, fontSize: 14),
      bodySmall: GoogleFonts.roboto(fontWeight: FontWeight.w400, fontSize: 12),
      labelLarge: GoogleFonts.roboto(fontWeight: FontWeight.w600, fontSize: 14),
    );
    final textDark = GoogleFonts.robotoTextTheme(baseDark.textTheme).copyWith(
      displaySmall:
          GoogleFonts.roboto(fontWeight: FontWeight.w700, fontSize: 36),
      headlineMedium:
          GoogleFonts.roboto(fontWeight: FontWeight.w700, fontSize: 24),
      titleLarge: GoogleFonts.roboto(fontWeight: FontWeight.w600, fontSize: 20),
      titleMedium: GoogleFonts.roboto(fontWeight: FontWeight.w500, fontSize: 16),
      titleSmall: GoogleFonts.roboto(fontWeight: FontWeight.w500, fontSize: 14),
      bodyMedium: GoogleFonts.roboto(fontWeight: FontWeight.w400, fontSize: 14),
      bodySmall: GoogleFonts.roboto(fontWeight: FontWeight.w400, fontSize: 12),
      labelLarge: GoogleFonts.roboto(fontWeight: FontWeight.w600, fontSize: 14),
    );
    final light = baseLight.copyWith(textTheme: textLight);
    final dark = baseDark.copyWith(textTheme: textDark);

    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (context, mode, _) {
        return MaterialApp(
          title: AppLocalizations.of(context)!.appTitle,
          theme: light,
          darkTheme: dark,
          themeMode: mode,
          locale: localeNotifier.value,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: onboarded ? const SplashPage() : const OnboardingPage(),
        );
      },
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;
  final _pages = const [
    ScanPage(key: ValueKey('scan')),
    GeneratePage(key: ValueKey('gen')),
    GalleryPage(key: ValueKey('gal')),
    HistoryPage(key: ValueKey('hist')),
    SettingsPage(key: ValueKey('set')),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        transitionBuilder: (child, animation) {
          final slide = Tween<Offset>(begin: const Offset(0.1, 0), end: Offset.zero).animate(animation);
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(position: slide, child: child),
          );
        },
        child: _pages[_index],
      ),
      bottomNavigationBar: ValueListenableBuilder(
        valueListenable: Hive.box('history').listenable(),
        builder: (context, dynamic value, _) {
          final count = Hive.box('history').length;
          return ValueListenableBuilder<bool>(
            valueListenable: batchNotifier,
            builder: (context, batch, __) {
              return BottomNavigationBar(
                currentIndex: _index,
                onTap: (i) => setState(() => _index = i),
                type: BottomNavigationBarType.fixed,
                showSelectedLabels: true,
                showUnselectedLabels: true,
                selectedItemColor: Theme.of(context).colorScheme.primary,
                unselectedItemColor: Colors.grey,
                items: [
                  BottomNavigationBarItem(
                    icon: AnimatedScale(
                      scale: _index == 0 ? 1.2 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: batch
                          ? Badge(
                              label: const Text('∞'),
                              child: SvgPicture.asset('assets/icons/scan.svg',
                                  width: 24, height: 24, semanticsLabel: 'scan'),
                            )
                          : SvgPicture.asset('assets/icons/scan.svg',
                              width: 24, height: 24, semanticsLabel: 'scan'),
                    ),
                    label: AppLocalizations.of(context)!.navScan,
                  ),
                  BottomNavigationBarItem(
                    icon: AnimatedScale(
                      scale: _index == 1 ? 1.2 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: SvgPicture.asset('assets/icons/generate.svg',
                          width: 24, height: 24, semanticsLabel: 'generate'),
                    ),
                    label: AppLocalizations.of(context)!.navGenerate,
                  ),
                  BottomNavigationBarItem(
                    icon: AnimatedScale(
                      scale: _index == 2 ? 1.2 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: SvgPicture.asset('assets/icons/gallery.svg',
                          width: 24, height: 24, semanticsLabel: 'gallery'),
                    ),
                    label: AppLocalizations.of(context)!.navGallery,
                  ),
                  BottomNavigationBarItem(
                    icon: AnimatedScale(
                      scale: _index == 3 ? 1.2 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: count > 0
                          ? Badge(
                              label: Text(count > 99 ? '99+' : '$count'),
                              child: SvgPicture.asset('assets/icons/history.svg',
                                  width: 24, height: 24, semanticsLabel: 'history'),
                            )
                          : SvgPicture.asset('assets/icons/history.svg',
                              width: 24, height: 24, semanticsLabel: 'history'),
                    ),
                    label: AppLocalizations.of(context)!.navHistory,
                  ),
                  BottomNavigationBarItem(
                    icon: AnimatedScale(
                      scale: _index == 4 ? 1.2 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: SvgPicture.asset('assets/icons/settings.svg',
                          width: 24, height: 24, semanticsLabel: 'settings'),
                    ),
                    label: AppLocalizations.of(context)!.navSettings,
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}
