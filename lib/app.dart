import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'core/localization/app_localizations.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/app_startup.dart';

class AplusReadApp extends HookConsumerWidget {
  const AplusReadApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final startup = useMemoized(() => ref.read(appStartupProvider.future));
    final router = ref.watch(appRouterProvider);
    final theme = ref.watch(appThemeProvider);

    return FutureBuilder<void>(
      future: startup,
      builder: (context, snapshot) {
        final isReady = snapshot.connectionState == ConnectionState.done;

        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          title: 'A+ Read',
          themeMode: theme.themeMode,
          theme: FlexColorScheme.light(
            useMaterial3: true,
            colors: theme.lightScheme,
            surfaceMode: FlexSurfaceMode.highScaffoldLowSurface,
            subThemesData: theme.subThemes,
            textTheme: theme.textTheme,
          ).toTheme,
          darkTheme: FlexColorScheme.dark(
            useMaterial3: true,
            colors: theme.darkScheme,
            surfaceMode: FlexSurfaceMode.highScaffoldLowSurface,
            subThemesData: theme.subThemes,
            textTheme: theme.textTheme,
          ).toTheme,
          routerConfig: isReady ? router : splashRouter,
          locale: const Locale('es'),
          supportedLocales: const [Locale('es'), Locale('en')],
          localizationsDelegates: AppLocalizations.localizationsDelegates,
        );
      },
    );
  }
}
