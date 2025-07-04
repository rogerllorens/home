import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get safeBrowsingApiKey =>
      dotenv.env['SAFE_BROWSING_API_KEY'] ?? '';

  static String get googleTranslateKey =>
      dotenv.env['GOOGLE_CLOUD_TRANSLATE_KEY'] ?? '';

  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'https://api.tuapp.com';

  static bool get enableSafeBrowsing =>
      (dotenv.env['ENABLE_SAFE_BROWSING'] ?? 'true').toLowerCase() == 'true';

  static String get apiVoidKey => dotenv.env['APIVOID_API_KEY'] ?? '';

  static String get isMaliciousKey => dotenv.env['ISMALICIOUS_API_KEY'] ?? '';

  static bool get enableAnalytics =>
      (dotenv.env['ENABLE_ANALYTICS'] ?? 'false').toLowerCase() == 'true';

  static String get defaultLanguage =>
      dotenv.env['DEFAULT_LANGUAGE'] ?? 'es';
}
