import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../features/document/viewer/document_viewer_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/scanner/document_scanner_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../widgets/app_splash_screen.dart';
import '../services/document_service.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final docService = ref.watch(documentServiceProvider);

  return GoRouter(
    initialLocation: docService.isFirstLaunch ? '/onboarding' : '/home',
    refreshListenable: docService,
    routes: [
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
        routes: [
          GoRoute(
            path: 'viewer/:id',
            name: 'viewer',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return DocumentViewerScreen(documentId: id);
            },
          ),
          GoRoute(
            path: 'scanner',
            name: 'scanner',
            builder: (context, state) => const DocumentScannerScreen(),
          ),
          GoRoute(
            path: 'settings',
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});

final splashRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const AppSplashScreen(),
    ),
  ],
);
