import 'package:flutter/foundation.dart';
import '../services/analytics_service.dart';

class Reward {
  final String id;
  final String title;
  final String description;
  final int cost;
  final String imageUrl;

  Reward({
    required this.id,
    required this.title,
    required this.description,
    required this.cost,
    required this.imageUrl,
  });
}

class RewardModel with ChangeNotifier {
  int _points = 0;
  int get points => _points;

  final List<Reward> _claimed = [];
  List<Reward> get claimedRewards => List.unmodifiable(_claimed);

  int _totalEarned = 0;
  int _redeemCount = 0;
  DateTime? _firstEarn;
  int? _daysToFirstRedeem;

  void earnPoints(int amount, {String reason = ''}) {
    _points += amount;
    _totalEarned += amount;
    _firstEarn ??= DateTime.now();
    AnalyticsService.logEvent('earn_points', {
      'amount': amount,
      'reason': reason,
    });
    notifyListeners();
  }

  bool redeem(Reward reward) {
    if (_points < reward.cost) return false;
    _points -= reward.cost;
    _claimed.add(reward);
    _redeemCount += 1;
    if (_redeemCount == 1 && _firstEarn != null) {
      _daysToFirstRedeem = DateTime.now().difference(_firstEarn!).inDays;
    }
    AnalyticsService.logEvent('redeem_reward', {'id': reward.id});
    notifyListeners();
    return true;
  }

  Map<String, dynamic> metrics() => {
        'total_earned': _totalEarned,
        'redeem_count': _redeemCount,
        'days_to_first_redeem': _daysToFirstRedeem,
      };
}
