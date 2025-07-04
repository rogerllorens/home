import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'main.dart';
import 'package:hive/hive.dart';
import 'sb_cache.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  StreamSubscription? _sub;

  void start() {
    _sub ??= Connectivity().onConnectivityChanged.listen((_) async {
      final has = await InternetConnectionChecker().hasConnection;
      final wasOffline = offlineNotifier.value;
      offlineNotifier.value = !has;
      if (has && wasOffline && revalidateOnConnectNotifier.value) {
        _revalidateHistory();
      }
    });
    // initial check
    InternetConnectionChecker().hasConnection.then((has) {
      offlineNotifier.value = !has;
    });
  }

  void _revalidateHistory() async {
    final history = Hive.box('history');
    for (final entry in history.toMap().entries) {
      final value = entry.value;
      if (value is Map && value['code'] is String) {
        final url = value['code'] as String;
        final uri = Uri.tryParse(url);
        if (uri != null && uri.hasScheme) {
          final safe = await SafeBrowsingCache.checkUrl(url);
          final data = Map.of(value);
          data['safe'] = safe;
          data['pending'] = false;
          history.put(entry.key, data);
        }
      }
    }
  }

  void dispose() {
    _sub?.cancel();
    _sub = null;
  }
}
