import 'package:icalendar_parser/icalendar_parser.dart';

enum ContentType { wifi, contact, tel, sms, url, geo, email, event, text }

class ContentInfo {
  ContentInfo(this.type, {this.data = const {}, this.raw = ''});
  final ContentType type;
  final Map<String, String> data;
  final String raw;
}

class ContentParser {
  static ContentInfo parse(String code) {
    final lower = code.toLowerCase();
    if (lower.startsWith('wifi:')) {
      final ssid = RegExp(r's:([^;]*)', caseSensitive: false).firstMatch(code)?.group(1) ?? '';
      final pass = RegExp(r'p:([^;]*)', caseSensitive: false).firstMatch(code)?.group(1) ?? '';
      final type = RegExp(r't:([^;]*)', caseSensitive: false).firstMatch(code)?.group(1) ?? '';
      return ContentInfo(ContentType.wifi, data: {
        'ssid': ssid,
        'password': pass,
        'type': type,
      }, raw: code);
    }
    if (lower.startsWith('mecard:') || lower.contains('begin:vcard')) {
      return ContentInfo(ContentType.contact, raw: code);
    }
    if (lower.startsWith('tel:')) {
      return ContentInfo(ContentType.tel, data: {'tel': code.substring(4)});
    }
    if (lower.startsWith('smsto:')) {
      final parts = code.substring(6).split(':');
      return ContentInfo(ContentType.sms, data: {
        'number': parts.isNotEmpty ? parts[0] : '',
        'body': parts.length > 1 ? parts.sublist(1).join(':') : '',
      });
    }
    if (lower.startsWith('mailto:')) {
      return ContentInfo(ContentType.email, data: {'email': code.substring(7)});
    }
    if (lower.startsWith('geo:')) {
      final coords = code.substring(4);
      final parts = coords.split(',');
      final lat = parts.isNotEmpty ? parts[0] : '';
      final lon = parts.length > 1 ? parts[1] : '';
      return ContentInfo(ContentType.geo, data: {
        'lat': lat,
        'lon': lon,
        'geo': coords,
      });
    }
    if (lower.contains('begin:vcalendar') || lower.contains('begin:VEVENT'.toLowerCase())) {
      try {
        final cal = ICalendar.fromString(code);
        final events = cal.data.where((c) => c['type'] == 'VEVENT');
        if (events.isNotEmpty) {
          final data = events.first['data'] as Map<String, dynamic>;
          final summary = data['SUMMARY'] as String? ?? '';
          final desc = data['DESCRIPTION'] as String? ?? '';
          final location = data['LOCATION'] as String? ?? '';
          final start = data['DTSTART'] as String? ?? '';
          final end = data['DTEND'] as String? ?? '';
          return ContentInfo(ContentType.event, data: {
            'summary': summary,
            'description': desc,
            'location': location,
            'start': start,
            'end': end,
          }, raw: code);
        }
      } catch (_) {
        // ignore and fall back to raw
      }
      return ContentInfo(ContentType.event, raw: code);
    }
    final uri = Uri.tryParse(code);
    if (uri != null && uri.hasScheme) {
      return ContentInfo(ContentType.url, data: {'url': code});
    }
    return ContentInfo(ContentType.text, raw: code);
  }
}
