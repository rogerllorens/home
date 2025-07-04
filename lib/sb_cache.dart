import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'config.dart';

class SafeBrowsingCache {
  static const _ttl = Duration(days: 7);
  static const _etTtl = Duration(days: 1);
  static const _etUrl =
      'https://rules.emergingthreats.net/fwrules/emerging-CompromisedDomains.txt';
  static String get _key => AppConfig.safeBrowsingApiKey;
  static String get _apiVoidKey => AppConfig.apiVoidKey;
  static String get _isMaliciousKey => AppConfig.isMaliciousKey;
  static http.Client client = http.Client();
  static Box get _box => Hive.box('sb_cache');
  static Set<String>? _local;
  static Set<String>? _et;
  static DateTime? _etFetched;

  static Future<void> _loadLocal() async {
    if (_local != null) return;
    final txt = await rootBundle.loadString('assets/malicious_urls.txt');
    _local = txt.split('\n').where((e) => e.trim().isNotEmpty).toSet();
  }

  static Future<void> _loadEmergingThreats() async {
    final tsString = _box.get('_et_ts') as String?;
    if (_et != null &&
        tsString != null &&
        DateTime.now().difference(DateTime.parse(tsString)) < _etTtl) {
      return;
    }
    try {
      final res = await client.get(Uri.parse(_etUrl));
      if (res.statusCode == 200) {
        _et = res.body
            .split('\n')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty && !e.startsWith('#'))
            .toSet();
        _box.put('_et_list', _et!.toList());
        _box.put('_et_ts', DateTime.now().toIso8601String());
        return;
      }
    } catch (_) {}
    final stored = _box.get('_et_list');
    if (stored is List) {
      _et = stored.cast<String>().toSet();
    }
  }

  static Future<bool?> getCached(String url) async {
    final entry = _box.get(url);
    if (entry is Map) {
      final ts = DateTime.tryParse(entry['ts'] ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      if (DateTime.now().difference(ts) < _ttl) {
        return entry['safe'] == true;
      }
    }
    return null;
  }

  static Future<bool> checkUrl(String url, {bool offline = false}) async {
    await _loadLocal();
    await _loadEmergingThreats();
    final host = Uri.parse(url).host;
    if (_local!.contains(url) || _local!.contains(host)) {
      return false;
    }
    if (_et != null && (_et!.contains(url) || _et!.contains(host))) {
      return false;
    }
    if (!offline) {
      final cached = await getCached(url);
      if (cached != null) return cached;
    }
    if (offline) {
      return true; // unknown, treat as safe
    }
    if (_key.isEmpty) return true;
    final uri = Uri.parse(
        'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=$_key');
    final body = jsonEncode({
      'client': {'clientId': 'scanly', 'clientVersion': '1.0'},
      'threatInfo': {
        'threatTypes': ['MALWARE', 'SOCIAL_ENGINEERING'],
        'platformTypes': ['ANY_PLATFORM'],
        'threatEntryTypes': ['URL'],
        'threatEntries': [ {'url': url} ]
      }
    });
    try {
      final res = await client.post(uri,
          headers: {'Content-Type': 'application/json'}, body: body);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final safe = data['matches'] == null;
        _box.put(url, {'safe': safe, 'ts': DateTime.now().toIso8601String()});
        return safe;
      }
    } catch (_) {}

    if (_apiVoidKey.isNotEmpty) {
      try {
        final res = await client.get(Uri.parse(
            'https://endpoint.apivoid.com/urlrep/v1/pay-as-you-go/?key=$_apiVoidKey&url=$url'));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final safe = (data['data']?['report']?['blacklists']?['engines_count'] ?? 0) == 0;
          _box.put(url, {'safe': safe, 'ts': DateTime.now().toIso8601String()});
          return safe;
        }
      } catch (_) {}
    }

    if (_isMaliciousKey.isNotEmpty) {
      try {
        final res = await client.get(Uri.parse(
            'https://ismalicious.com/check/$url?key=$_isMaliciousKey'));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final safe = !(data['malicious'] == true);
          _box.put(url, {'safe': safe, 'ts': DateTime.now().toIso8601String()});
          return safe;
        }
      } catch (_) {}
    }

    return true; // Could not verify
  }
}
