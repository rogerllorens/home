import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mindconnect/main.dart';
import 'package:go_router/go_router.dart';
import 'package:mindconnect/screens/splash_screen.dart';
import 'package:mindconnect/screens/home_screen.dart';
import 'package:mindconnect/models/mood_model.dart';
import 'package:mindconnect/models/user_model.dart';
import 'package:mindconnect/providers.dart';

void main() {
  testWidgets('navigate to home screen', (tester) async {
    final mood = MoodModel();
    await mood.init();
    final user = UserModel();
    await user.load();
    await tester.pumpWidget(ProviderScope(overrides: [
      moodProvider.overrideWithValue(mood),
      userProvider.overrideWithValue(user)
    ], child: const MindConnectApp()));
    await tester.pumpAndSettle();
    expect(find.byType(SplashScreen), findsOneWidget);
    final router = tester.state<NavigatorState>(find.byType(Navigator)).context;
    GoRouter.of(router).go('/home');
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);
  });
}
