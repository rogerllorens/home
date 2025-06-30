import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:scanly/pages/generate_page.dart';

void main() {
  test('contrast check returns true for black on white', () {
    final state = _GeneratePageState();
    state.._fgColor = const Color(0xFF000000).._bgColor = const Color(0xFFFFFFFF);
    expect(state._checkContrast(), isTrue);
  });
}
