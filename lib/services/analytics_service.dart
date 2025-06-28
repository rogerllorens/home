import 'dart:convert';
import 'package:http/http.dart' as http;

class AnalyticsService {
  static const _endpoint = 'https://example.com/analytics';

  static Future<void> logEvent(String name, [Map<String, dynamic>? params]) async {
    try {
      await http.post(
        Uri.parse(_endpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'event': name, 'params': params}),
      );
    } catch (_) {
      // ignore network errors silently
    }
  }
}
