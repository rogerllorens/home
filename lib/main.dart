import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'models/adapters.g.dart';

import 'services/notification_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'models/mood_model.dart';
import 'models/reward_model.dart';
import 'models/challenge_model.dart';
import 'models/user_model.dart';
import 'models/questionnaire_model.dart';
import 'theme_notifier.dart';
import 'providers.dart';
import 'screens/settings_screen.dart';
import 'screens/home_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/consent_screen.dart';
import 'screens/questionnaire_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/communities_screen.dart';
import 'screens/programs_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/rewards_screen.dart';
import 'screens/create_post_screen.dart';
import 'screens/challenges_screen.dart';
import 'screens/challenge_detail_screen.dart';
import 'screens/program_detail_screen.dart';
import 'screens/module_screen.dart';
import 'models/program_model.dart';
import 'screens/library_screen.dart';
import 'screens/resource_detail_screen.dart';
import 'models/resource_model.dart';
import 'models/webinar_model.dart';
import 'screens/webinar_list_screen.dart';
import 'screens/webinar_screen.dart';
import 'models/leader_program_model.dart';
import 'screens/leader_programs_screen.dart';
import 'screens/leader_program_detail_screen.dart';
import 'screens/sleep_stories_screen.dart';
import 'screens/sleep_player_screen.dart';
import 'models/sleep_story_model.dart';
import 'screens/leader_module_screen.dart';
import 'screens/export_screen.dart';
import 'screens/privacy_screen.dart';
import 'models/communities_model.dart';

CustomTransitionPage<void> _fade(Widget child) => CustomTransitionPage(
      key: ValueKey(child.hashCode),
      child: child,
      transitionsBuilder: (context, animation, secondary, child) {
        return FadeTransition(opacity: animation, child: child);
      },
    );

final _router = GoRouter(routes: [
  GoRoute(path: '/', pageBuilder: (_, __) => _fade(const SplashScreen())),
  GoRoute(path: '/settings', pageBuilder: (_, __) => _fade(const SettingsScreen())),
  GoRoute(path: '/settings/export', pageBuilder: (_, __) => _fade(const ExportScreen())),
  GoRoute(path: '/privacy', pageBuilder: (_, __) => _fade(const PrivacyScreen())),
  GoRoute(path: '/onboarding', pageBuilder: (_, __) => _fade(const OnboardingScreen())),
  GoRoute(path: '/login', pageBuilder: (_, __) => _fade(const LoginScreen())),
  GoRoute(path: '/register', pageBuilder: (_, __) => _fade(const RegisterScreen())),
  GoRoute(path: '/reset', pageBuilder: (_, __) => _fade(const ResetPasswordScreen())),
  GoRoute(path: '/consent', pageBuilder: (_, __) => _fade(const ConsentScreen())),
  GoRoute(path: '/questionnaire', pageBuilder: (_, __) => _fade(const QuestionnaireScreen())),
  GoRoute(path: '/home', pageBuilder: (_, __) => _fade(const HomeScreen())),
  GoRoute(path: '/chat', pageBuilder: (_, __) => _fade(const ChatScreen())),
  GoRoute(path: '/communities', pageBuilder: (_, __) => _fade(const CommunitiesScreen())),
  GoRoute(path: '/sleep_stories', pageBuilder: (_, __) => _fade(const SleepStoriesScreen())),
  GoRoute(
      path: '/sleep_story/:id',
      pageBuilder: (_, state) => _fade(SleepPlayerScreen(id: state.params['id']!))),
  GoRoute(path: '/programs', pageBuilder: (_, __) => _fade(const ProgramsScreen())),
  GoRoute(
      path: '/program/:pid',
      pageBuilder: (_, state) => _fade(ProgramDetailScreen(id: state.params['pid']!))),
  GoRoute(
      path: '/program/:pid/module/:mid',
      pageBuilder: (_, state) => _fade(ModuleScreen(programId: state.params['pid']!, moduleId: state.params['mid']!))),
  GoRoute(path: '/profile', pageBuilder: (_, __) => _fade(const ProfileScreen())),
  GoRoute(path: '/profile/edit', pageBuilder: (_, __) => _fade(const EditProfileScreen())),
  GoRoute(path: '/rewards', pageBuilder: (_, __) => _fade(const RewardsScreen())),
  GoRoute(path: '/create_post', pageBuilder: (_, __) => _fade(const CreatePostScreen())),
  GoRoute(path: '/challenges', pageBuilder: (_, __) => _fade(const ChallengesScreen())),
  GoRoute(
      path: '/challenge/:id',
      pageBuilder: (_, state) => _fade(ChallengeDetailScreen(id: state.params['id']!))),
  GoRoute(path: '/library', pageBuilder: (_, __) => _fade(const LibraryScreen())),
  GoRoute(
      path: '/library/:id',
      pageBuilder: (_, state) =>
          _fade(ResourceDetailScreen(id: state.params['id']!))),
  GoRoute(path: '/webinars', pageBuilder: (_, __) => _fade(const WebinarListScreen())),
  GoRoute(
      path: '/webinar/:id',
      pageBuilder: (ctx, state) {
        final w = ProviderScope.containerOf(ctx, listen: false)
            .read(webinarProvider)
            .getById(state.params['id']!);
        return _fade(WebinarScreen(webinar: w));
      }),
  GoRoute(path: '/leader_programs', pageBuilder: (_, __) => _fade(const LeaderProgramsScreen())),
  GoRoute(
      path: '/leader_program/:pid',
      pageBuilder: (_, state) => _fade(
          LeaderProgramDetailScreen(programId: state.params['pid']!))),
  GoRoute(
      path: '/leader_program/:pid/module/:mid',
      pageBuilder: (_, state) => _fade(LeaderModuleScreen(
            programId: state.params['pid']!,
            moduleId: state.params['mid']!,
          ))),
]);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AnalyticsService.logEvent('app_start');
  final notificationService = NotificationService();
  await notificationService.init();
  await notificationService.scheduleDaily(const Time(18, 0),
      title: 'Registra tu ánimo', body: '¿Cómo te sientes hoy?');
  await Hive.initFlutter();
  Hive.registerAdapter(MoodEntryAdapter());
  Hive.registerAdapter(ChallengeProgressAdapter());
  Hive.registerAdapter(ModuleProgressAdapter());
  Hive.registerAdapter(LeaderModuleProgressAdapter());
  Hive.registerAdapter(UserProfileAdapter());
  final moodModel = MoodModel();
  await moodModel.init();
  final userModel = UserModel();
  await userModel.load();
  final challengeModel = ChallengeModel();
  await challengeModel.init();
  final programModel = ProgramModel();
  await programModel.init();
  final leaderProgramModel = LeaderProgramModel();
  await leaderProgramModel.init();
  final themeNotifier = ThemeNotifier();
  await themeNotifier.load();
  runApp(
    ProviderScope(overrides: [
      moodProvider.overrideWithValue(moodModel),
      userProvider.overrideWithValue(userModel),
      rewardProvider.overrideWithValue(RewardModel()),
      challengeProvider.overrideWithValue(challengeModel),
      programProvider.overrideWithValue(programModel),
      resourceProvider.overrideWithValue(ResourceModel()),
      webinarProvider.overrideWithValue(WebinarModel()),
      leaderProgramProvider.overrideWithValue(leaderProgramModel),
      sleepStoryProvider.overrideWithValue(SleepStoryModel()),
      questionnaireProvider.overrideWithValue(QuestionnaireModel()),
      communitiesProvider.overrideWithValue(CommunitiesModel()),
      themeProvider.overrideWithValue(themeNotifier),
    ], child: const MindConnectApp()),
  );
}

class MindConnectApp extends ConsumerWidget {
  const MindConnectApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeProvider).mode;
    return MaterialApp.router(
      title: 'MindConnect',
      routerConfig: _router,
      theme: ThemeData.light(useMaterial3: true),
      darkTheme: ThemeData.dark(useMaterial3: true),
      themeMode: mode,
    );
  }
}
