import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mindconnect/theme_notifier.dart';
import 'package:mindconnect/main.dart';

void main() {
  testWidgets('toggle dark mode', (tester) async {
    final theme = ThemeNotifier();
    await theme.load();
    await tester.pumpWidget(ProviderScope(overrides: [themeProvider.overrideWithValue(theme)], child: const MindConnectApp()));
    expect(theme.mode, ThemeMode.light);
    await theme.setDark(true);
    await tester.pumpAndSettle();
    expect(theme.mode, ThemeMode.dark);
  });
}
