import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'models/mood_model.dart';
import 'models/user_model.dart';
import 'models/reward_model.dart';
import 'models/challenge_model.dart';
import 'models/program_model.dart';
import 'models/resource_model.dart';
import 'models/webinar_model.dart';
import 'models/leader_program_model.dart';
import 'models/sleep_story_model.dart';
import 'models/questionnaire_model.dart';
import 'models/communities_model.dart';
import 'theme_notifier.dart';

final moodProvider = StateNotifierProvider<MoodModel, List<MoodEntry>>(
  (ref) => MoodModel(),
);

final userProvider = ChangeNotifierProvider<UserModel>((ref) => UserModel());
final rewardProvider = ChangeNotifierProvider<RewardModel>((ref) => RewardModel());
final challengeProvider = ChangeNotifierProvider<ChallengeModel>((ref) => ChallengeModel());
final programProvider = ChangeNotifierProvider<ProgramModel>((ref) => ProgramModel());
final resourceProvider = ChangeNotifierProvider<ResourceModel>((ref) => ResourceModel());
final webinarProvider = ChangeNotifierProvider<WebinarModel>((ref) => WebinarModel());
final leaderProgramProvider = ChangeNotifierProvider<LeaderProgramModel>((ref) => LeaderProgramModel());
final sleepStoryProvider = ChangeNotifierProvider<SleepStoryModel>((ref) => SleepStoryModel());
final questionnaireProvider = ChangeNotifierProvider<QuestionnaireModel>((ref) => QuestionnaireModel());
final communitiesProvider = ChangeNotifierProvider<CommunitiesModel>((ref) => CommunitiesModel());
final themeProvider = ChangeNotifierProvider<ThemeNotifier>((ref) => ThemeNotifier());
