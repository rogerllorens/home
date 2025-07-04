import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:scanly/pages/scan_page.dart';
import 'package:scanly/pages/gallery_page.dart';
import 'package:scanly/pages/generate_page.dart';

void main() {
  testWidgets('pages build', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ScanPage()));
    expect(find.byType(ScanPage), findsOneWidget);
    await tester.pumpWidget(const MaterialApp(home: GalleryPage()));
    expect(find.byType(GalleryPage), findsOneWidget);
    await tester.pumpWidget(const MaterialApp(home: GeneratePage()));
    expect(find.byType(GeneratePage), findsOneWidget);
  });
}
