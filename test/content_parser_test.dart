import 'package:flutter_test/flutter_test.dart';
import 'package:scanly/content_parser.dart';

void main() {
  test('ContentParser recognizes WiFi QR', () {
    const code = 'WIFI:S:MiRed;T:WPA;P:clave123;;';
    final parsed = ContentParser.parse(code);
    expect(parsed.type, ContentType.wifi);
    expect(parsed.data['ssid'], 'MiRed');
    expect(parsed.data['password'], 'clave123');
  });

  test('ContentParser recognizes URL', () {
    const code = 'https://example.com';
    final parsed = ContentParser.parse(code);
    expect(parsed.type, ContentType.url);
    expect(parsed.data['url'], code);
  });
}
