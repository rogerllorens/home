import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;
  late Map<String, dynamic> _strings;

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static const localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    DefaultWidgetsLocalizations.delegate,
    DefaultMaterialLocalizations.delegate,
    DefaultCupertinoLocalizations.delegate,
  ];

  static AppLocalizations of(BuildContext context) => Localizations.of<AppLocalizations>(context, AppLocalizations)!;

  Future<void> load() async {
    final raw = await rootBundle.loadString('assets/translations/${locale.languageCode}.json');
    _strings = json.decode(raw) as Map<String, dynamic>;
  }

  String string(String key, {String? fallback}) {
    final value = _strings[key];
    if (value == null) {
      return fallback ?? key;
    }
    if (value is String) {
      return value;
    }
    return value.toString();
  }

  List<Map<String, dynamic>> getOnboardingSlides() {
    final list = _strings['onboarding'];
    if (list is List) {
      return list.cast<Map<String, dynamic>>();
    }
    return const [];
  }

  String formatDate(DateTime date) => DateFormat.yMMMd(locale.toLanguageTag()).format(date);
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'es'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    final localization = AppLocalizations(locale);
    await localization.load();
    return localization;
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) => false;
}
