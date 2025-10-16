import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:barcode_widget/barcode_widget.dart' as bw;
import 'package:clipboard/clipboard.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:mobile_scanner/mobile_scanner.dart' as ms;
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
  ));
  final appState = AppState();
  await appState.initialize();
  runApp(AppStateScope(appState: appState, child: const NexusQrApp()));
}

class AppState extends ChangeNotifier {
  static const _historyKey = 'history';
  static const _themeKey = 'theme';
  late SharedPreferences _preferences;

  ThemeMode _themeMode = ThemeMode.system;
  final List<HistoryEntry> _history = <HistoryEntry>[];

  ThemeMode get themeMode => _themeMode;
  List<HistoryEntry> get history => List.unmodifiable(_history);

  Future<void> initialize() async {
    _preferences = await SharedPreferences.getInstance();
    final storedTheme = _preferences.getInt(_themeKey);
    if (storedTheme != null && storedTheme >= 0 && storedTheme < ThemeMode.values.length) {
      _themeMode = ThemeMode.values[storedTheme];
    }
    final storedHistory = _preferences.getStringList(_historyKey) ?? <String>[];
    _history
      ..clear()
      ..addAll(
        storedHistory
            .map((item) => HistoryEntry.fromJson(jsonDecode(item) as Map<String, dynamic>))
            .whereType<HistoryEntry>(),
      );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (mode == _themeMode) return;
    _themeMode = mode;
    await _preferences.setInt(_themeKey, mode.index);
    notifyListeners();
  }

  Future<void> addToHistory(HistoryEntry entry) async {
    _history.removeWhere((element) => element.value == entry.value && element.type == entry.type);
    _history.insert(0, entry);
    if (_history.length > 50) {
      _history.removeRange(50, _history.length);
    }
    await _preferences.setStringList(
      _historyKey,
      _history.map((e) => jsonEncode(e.toJson())).toList(),
    );
    notifyListeners();
  }

  Future<void> removeFromHistory(HistoryEntry entry) async {
    _history.removeWhere((element) => element.id == entry.id);
    await _preferences.setStringList(
      _historyKey,
      _history.map((e) => jsonEncode(e.toJson())).toList(),
    );
    notifyListeners();
  }

  Future<void> clearHistory() async {
    _history.clear();
    await _preferences.remove(_historyKey);
    notifyListeners();
  }
}

class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({super.key, required super.child, required AppState appState}) : super(notifier: appState);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'AppStateScope not found in context');
    return scope!.notifier!;
  }
}

class NexusQrApp extends StatelessWidget {
  const NexusQrApp({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Nexus QR',
          localizationsDelegates: const [
            AppLocalizationsDelegate(),
            _FallbackMaterialLocalizations.delegate,
            _FallbackWidgetsLocalizations.delegate,
            _FallbackCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('en'),
            Locale('es'),
            Locale('fr'),
            Locale('pt'),
            Locale('de'),
          ],
          themeMode: appState.themeMode,
          theme: _buildLightTheme(),
          darkTheme: _buildDarkTheme(),
          home: const SplashScreen(),
        );
      },
    );
  }

  ThemeData _buildLightTheme() {
    final base = ThemeData(
      brightness: Brightness.light,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2266FF)),
    );
    return base.copyWith(
      scaffoldBackgroundColor: const Color(0xFFF7F9FC),
      appBarTheme: base.appBarTheme.copyWith(centerTitle: true, elevation: 0),
      snackBarTheme: base.snackBarTheme.copyWith(behavior: SnackBarBehavior.floating),
      cardTheme: base.cardTheme.copyWith(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );
  }

  ThemeData _buildDarkTheme() {
    final base = ThemeData(
      brightness: Brightness.dark,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF5B8BFF), brightness: Brightness.dark),
    );
    return base.copyWith(
      scaffoldBackgroundColor: const Color(0xFF0F172A),
      snackBarTheme: base.snackBarTheme.copyWith(behavior: SnackBarBehavior.floating),
      cardTheme: base.cardTheme.copyWith(
        elevation: 1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );
  }
}
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 1600), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 600),
          pageBuilder: (_, __, ___) => const MainShell(),
          transitionsBuilder: (_, animation, __, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOutCubic),
              child: child,
            );
          },
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colorScheme.primaryContainer, colorScheme.surface],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.85, end: 1),
              duration: const Duration(milliseconds: 1200),
              curve: Curves.easeOutBack,
              builder: (context, value, child) => Transform.scale(scale: value, child: child),
              child: Container(
                height: 200,
                width: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      colorScheme.primary.withOpacity(0.15),
                      colorScheme.primary.withOpacity(0.05),
                    ],
                  ),
                ),
                alignment: Alignment.center,
                child: Icon(Icons.qr_code_2_rounded, size: 140, color: colorScheme.primary),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Nexus QR',
              style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                AppLocalizations.of(context).t('splash_tagline'),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static final List<_Destination> _destinations = [
    _Destination(icon: Icons.auto_awesome, labelKey: 'generator', builder: (_) => const GeneratorPage()),
    _Destination(icon: Icons.document_scanner, labelKey: 'scanner', builder: (_) => const ScannerPage()),
    _Destination(icon: Icons.history, labelKey: 'history', builder: (_) => const HistoryPage()),
    _Destination(icon: Icons.settings_suggest, labelKey: 'settings', builder: (_) => const SettingsPage()),
  ];

  @override
  Widget build(BuildContext context) {
    final localization = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(localization.t(_destinations[_currentIndex].labelKey)),
        actions: [
          IconButton(
            tooltip: localization.t('share_app'),
            icon: const Icon(Icons.ios_share),
            onPressed: () => Share.share(localization.t('share_app_message')),
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: _destinations[_currentIndex].builder(context),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        height: 68,
        destinations: [
          for (final destination in _destinations)
            NavigationDestination(
              icon: Icon(destination.icon),
              selectedIcon: Icon(destination.icon, color: colorScheme.primary),
              label: localization.t(destination.labelKey),
            ),
        ],
        onDestinationSelected: (value) => setState(() => _currentIndex = value),
      ),
    );
  }
}

class _Destination {
  const _Destination({required this.icon, required this.labelKey, required this.builder});

  final IconData icon;
  final String labelKey;
  final WidgetBuilder builder;
}

enum QRContentType { text, url, wifi, email, phone, sms }

enum CodeRenderType { qr, barcode }
class GeneratorPage extends StatefulWidget {
  const GeneratorPage({super.key});

  @override
  State<GeneratorPage> createState() => _GeneratorPageState();
}

class _GeneratorPageState extends State<GeneratorPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _ssidController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _smsController = TextEditingController();

  QRContentType _contentType = QRContentType.text;
  CodeRenderType _renderType = CodeRenderType.qr;
  String? _renderedValue;
  Color _primaryColor = const Color(0xFF2266FF);
  final GlobalKey _previewKey = GlobalKey();
  bool _isSaving = false;

  @override
  void dispose() {
    _textController.dispose();
    _urlController.dispose();
    _ssidController.dispose();
    _passwordController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _smsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localization = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildIntroCard(localization, colorScheme),
            const SizedBox(height: 18),
            _buildTypeSelector(localization),
            const SizedBox(height: 16),
            Form(key: _formKey, child: _buildDynamicFields(localization)),
            const SizedBox(height: 16),
            _buildRenderTypeSelector(localization),
            const SizedBox(height: 16),
            _buildColorPicker(localization),
            const SizedBox(height: 24),
            FilledButton.icon(
              icon: const Icon(Icons.bolt),
              label: Text(localization.t('generate_code')),
              onPressed: _onGenerate,
            ),
            const SizedBox(height: 24),
            if (_renderedValue != null) _buildPreviewCard(localization, colorScheme),
          ],
        ),
      ),
    );
  }

  Widget _buildIntroCard(AppLocalizations localization, ColorScheme colorScheme) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [colorScheme.primary, colorScheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.qr_code_2, color: Colors.white, size: 36),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localization.t('generator_title'),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    localization.t('generator_subtitle'),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeSelector(AppLocalizations localization) {
    final options = <QRContentType, String>{
      QRContentType.text: localization.t('type_text'),
      QRContentType.url: localization.t('type_url'),
      QRContentType.wifi: localization.t('type_wifi'),
      QRContentType.email: localization.t('type_email'),
      QRContentType.phone: localization.t('type_phone'),
      QRContentType.sms: localization.t('type_sms'),
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localization.t('content_type'), style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final entry in options.entries)
              ChoiceChip(
                label: Text(entry.value),
                selected: _contentType == entry.key,
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _contentType = entry.key);
                  }
                },
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildDynamicFields(AppLocalizations localization) {
    switch (_contentType) {
      case QRContentType.text:
        return TextFormField(
          controller: _textController,
          maxLines: 4,
          decoration: InputDecoration(
            labelText: localization.t('enter_text'),
            border: const OutlineInputBorder(),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return localization.t('validation_required');
            }
            return null;
          },
        );
      case QRContentType.url:
        return TextFormField(
          controller: _urlController,
          decoration: InputDecoration(
            labelText: localization.t('enter_url'),
            border: const OutlineInputBorder(),
            hintText: 'https://example.com',
          ),
          keyboardType: TextInputType.url,
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return localization.t('validation_required');
            }
            final uri = Uri.tryParse(value.trim());
            if (uri == null || !(uri.hasScheme && (uri.isScheme('https') || uri.isScheme('http')))) {
              return localization.t('validation_url');
            }
            return null;
          },
        );
      case QRContentType.wifi:
        return Column(
          children: [
            TextFormField(
              controller: _ssidController,
              decoration: InputDecoration(
                labelText: localization.t('wifi_name'),
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return localization.t('validation_required');
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: localization.t('wifi_password'),
                border: const OutlineInputBorder(),
              ),
            ),
          ],
        );
      case QRContentType.email:
        return Column(
          children: [
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: localization.t('email_address'),
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return localization.t('validation_required');
                }
                if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(value)) {
                  return localization.t('validation_email');
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _textController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: localization.t('email_message'),
                border: const OutlineInputBorder(),
              ),
            ),
          ],
        );
      case QRContentType.phone:
        return TextFormField(
          controller: _phoneController,
          decoration: InputDecoration(
            labelText: localization.t('phone_number'),
            border: const OutlineInputBorder(),
          ),
          keyboardType: TextInputType.phone,
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return localization.t('validation_required');
            }
            if (!RegExp(r'^[+0-9]{6,}$').hasMatch(value)) {
              return localization.t('validation_phone');
            }
            return null;
          },
        );
      case QRContentType.sms:
        return Column(
          children: [
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(
                labelText: localization.t('phone_number'),
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return localization.t('validation_required');
                }
                if (!RegExp(r'^[+0-9]{6,}$').hasMatch(value)) {
                  return localization.t('validation_phone');
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _smsController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: localization.t('sms_message'),
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return localization.t('validation_required');
                }
                return null;
              },
            ),
          ],
        );
    }
  }
  Widget _buildRenderTypeSelector(AppLocalizations localization) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localization.t('output_type'), style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          children: [
            ChoiceChip(
              label: Text(localization.t('output_qr')),
              selected: _renderType == CodeRenderType.qr,
              onSelected: (selected) {
                if (selected) {
                  setState(() => _renderType = CodeRenderType.qr);
                }
              },
            ),
            ChoiceChip(
              label: Text(localization.t('output_barcode')),
              selected: _renderType == CodeRenderType.barcode,
              onSelected: (selected) {
                if (selected) {
                  setState(() => _renderType = CodeRenderType.barcode);
                }
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildColorPicker(AppLocalizations localization) {
    const swatches = [
      Color(0xFF2266FF),
      Color(0xFFFF6B6B),
      Color(0xFF34D399),
      Color(0xFFFFB020),
      Color(0xFFA855F7),
      Color(0xFF0EA5E9),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localization.t('accent_color'), style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          children: [
            for (final color in swatches)
              GestureDetector(
                onTap: () => setState(() => _primaryColor = color),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _primaryColor == color ? Colors.white : Colors.transparent,
                      width: 2,
                    ),
                    boxShadow: [
                      if (_primaryColor == color)
                        BoxShadow(color: color.withOpacity(0.4), blurRadius: 12, spreadRadius: 1),
                    ],
                  ),
                  child: _primaryColor == color
                      ? const Icon(Icons.check, color: Colors.white)
                      : const SizedBox.shrink(),
                ),
              ),
            IconButton(
              onPressed: () => setState(() => _primaryColor = _randomColor()),
              icon: const Icon(Icons.shuffle),
              tooltip: localization.t('random_color'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPreviewCard(AppLocalizations localization, ColorScheme colorScheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(localization.t('preview_title'), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            RepaintBoundary(
              key: _previewKey,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: _renderType == CodeRenderType.qr
                    ? SizedBox(
                        height: 220,
                        width: 220,
                        child: CustomPaint(
                          painter: QrPainter(
                            data: _renderedValue!,
                            version: QrVersions.auto,
                            color: _primaryColor,
                            emptyColor: Colors.white,
                            errorCorrectionLevel: QrErrorCorrectLevel.M,
                          ),
                        ),
                      )
                    : Center(
                        child: bw.BarcodeWidget(
                          barcode: bw.Barcode.code128(),
                          data: _renderedValue!,
                          color: _primaryColor,
                          width: double.infinity,
                          height: 120,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              _renderedValue!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                FilledButton.icon(
                  icon: const Icon(Icons.save_alt),
                  onPressed: _isSaving ? null : _saveImage,
                  label: Text(_isSaving ? localization.t('saving') : localization.t('save_image')),
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.copy_all),
                  onPressed: () => _copy(localization),
                  label: Text(localization.t('copy')),
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.share),
                  onPressed: () => _share(localization),
                  label: Text(localization.t('share')),
                ),
                if (_contentType == QRContentType.url)
                  TextButton.icon(
                    icon: const Icon(Icons.open_in_new),
                    onPressed: () => _launchUrl(_renderedValue!),
                    label: Text(localization.t('open')),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onGenerate() async {
    if (!_formKey.currentState!.validate()) return;
    final value = _encodeValue();
    setState(() => _renderedValue = value);
    final entry = HistoryEntry(
      id: UniqueKey().toString(),
      value: value,
      type: _contentType,
      format: _renderType,
      createdAt: DateTime.now(),
    );
    await AppStateScope.of(context).addToHistory(entry);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('generated_success'))),
    );
  }

  String _encodeValue() {
    switch (_contentType) {
      case QRContentType.text:
        return _textController.text.trim();
      case QRContentType.url:
        return _urlController.text.trim();
      case QRContentType.wifi:
        final ssid = _ssidController.text.trim();
        final password = _passwordController.text.trim();
        final auth = password.isEmpty ? 'nopass' : 'WPA';
        return 'WIFI:T:$auth;S:$ssid;P:$password;;';
      case QRContentType.email:
        final email = _emailController.text.trim();
        final body = _textController.text.trim();
        final uri = Uri(
          scheme: 'mailto',
          path: email,
          queryParameters: body.isNotEmpty ? {'body': body} : null,
        );
        return uri.toString();
      case QRContentType.phone:
        return 'tel:${_phoneController.text.trim()}';
      case QRContentType.sms:
        final number = _phoneController.text.trim();
        final body = _smsController.text.trim();
        final uri = Uri(
          scheme: 'sms',
          path: number,
          queryParameters: body.isNotEmpty ? {'body': body} : null,
        );
        return uri.toString();
    }
  }
  Future<void> _copy(AppLocalizations localization) async {
    if (_renderedValue == null) return;
    await FlutterClipboard.copy(_renderedValue!);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(localization.t('copied'))),
    );
  }

  Future<void> _share(AppLocalizations localization) async {
    if (_renderedValue == null) return;
    try {
      if (kIsWeb) {
        await Share.share(_renderedValue!);
      } else {
        final boundary = _previewKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
        if (boundary != null) {
          final image = await boundary.toImage(pixelRatio: 3);
          final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
          final bytes = byteData?.buffer.asUint8List();
          if (bytes != null) {
            final xFile = XFile.fromData(
              bytes,
              mimeType: 'image/png',
              name: 'nexus_qr_${DateTime.now().millisecondsSinceEpoch}.png',
            );
            await Share.shareXFiles([xFile], text: _renderedValue);
          } else {
            await Share.share(_renderedValue!);
          }
        } else {
          await Share.share(_renderedValue!);
        }
      }
    } catch (_) {
      await Share.share(_renderedValue!);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(localization.t('shared'))),
    );
  }

  Future<void> _saveImage() async {
    if (_renderedValue == null) return;
    setState(() => _isSaving = true);
    try {
      if (!await _ensureStoragePermission()) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context).t('permission_denied'))),
          );
        }
        return;
      }
      final boundary = _previewKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 4);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData?.buffer.asUint8List();
      if (pngBytes == null) return;
      final result = await ImageGallerySaver.saveImage(
        Uint8List.fromList(pngBytes),
        name: 'nexus_qr_${DateTime.now().millisecondsSinceEpoch}',
      );
      if (!mounted) return;
      final localization = AppLocalizations.of(context);
      if ((result['isSuccess'] as bool?) ?? false) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localization.t('saved'))),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localization.t('save_failed'))),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context).t('save_failed'))),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<bool> _ensureStoragePermission() async {
    if (kIsWeb) return true;
    final platform = Theme.of(context).platform;
    if (platform == TargetPlatform.android) {
      final storage = await Permission.storage.request();
      if (storage.isGranted) return true;
      final photos = await Permission.photos.request();
      return photos.isGranted;
    }
    if (platform == TargetPlatform.iOS || platform == TargetPlatform.macOS) {
      final photos = await Permission.photos.request();
      return photos.isGranted;
    }
    return true;
  }

  Future<void> _launchUrl(String value) async {
    final uri = Uri.parse(value);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).t('cannot_open'))),
      );
    }
  }

  Color _randomColor() {
    final random = Random();
    return Color.fromARGB(
      255,
      random.nextInt(156) + 100,
      random.nextInt(156) + 100,
      random.nextInt(156) + 100,
    );
  }
}

class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key});

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> with WidgetsBindingObserver {
  final ms.MobileScannerController _controller =
      ms.MobileScannerController(formats: ms.BarcodeFormat.values);
  ms.BarcodeCapture? _barcodeCapture;
  bool _isProcessing = false;
  bool _torchEnabled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _controller.stop();
    } else if (state == AppLifecycleState.resumed) {
      _controller.start();
    }
  }

  Future<void> _toggleTorch() async {
    try {
      await _controller.toggleTorch();
      if (mounted) {
        setState(() => _torchEnabled = !_torchEnabled);
      }
    } on Exception {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).t('torch_unavailable'))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final localization = AppLocalizations.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ms.MobileScanner(
                  controller: _controller,
                  onDetect: (capture) => _onDetect(capture, localization),
                ),
                Positioned.fill(
                  child: IgnorePointer(
                    child: CustomPaint(
                      painter: _ScannerOverlayPainter(colorScheme.primary),
                    ),
                  ),
                ),
                Positioned(
                  top: 24,
                  right: 24,
                  child: Column(
                    children: [
                      _ScannerIconButton(
                        icon: _torchEnabled ? Icons.flash_on : Icons.flash_off,
                        label: localization.t('torch'),
                        onTap: _toggleTorch,
                      ),
                      const SizedBox(height: 12),
                      _ScannerIconButton(
                        icon: Icons.cameraswitch,
                        label: localization.t('switch_camera'),
                        onTap: () => _controller.switchCamera(),
                      ),
                    ],
                  ),
                ),
                if (_barcodeCapture != null)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: _ScanResultCard(
                      capture: _barcodeCapture!,
                      onClose: () => setState(() => _barcodeCapture = null),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Text(
              localization.t('scanner_tip'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _onDetect(ms.BarcodeCapture capture, AppLocalizations localization) async {
    if (_isProcessing || capture.barcodes.isEmpty) return;
    _isProcessing = true;
    final barcode = capture.barcodes.first;
    if (barcode.rawValue == null) {
      _isProcessing = false;
      return;
    }
    final value = barcode.rawValue!;
    setState(() => _barcodeCapture = capture);
    await AppStateScope.of(context).addToHistory(
      HistoryEntry(
        id: UniqueKey().toString(),
        value: value,
        type: _inferType(value),
        format: barcode.format == ms.BarcodeFormat.qrCode ? CodeRenderType.qr : CodeRenderType.barcode,
        createdAt: DateTime.now(),
      ),
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(localization.t('scanned_success'))),
      );
    }
    await Future<void>.delayed(const Duration(seconds: 2));
    _isProcessing = false;
  }

  QRContentType _inferType(String value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return QRContentType.url;
    }
    if (value.startsWith('tel:')) {
      return QRContentType.phone;
    }
    if (value.startsWith('sms:')) {
      return QRContentType.sms;
    }
    if (value.startsWith('mailto:')) {
      return QRContentType.email;
    }
    if (value.startsWith('WIFI:')) {
      return QRContentType.wifi;
    }
    return QRContentType.text;
  }
}

class _ScanResultCard extends StatelessWidget {
  const _ScanResultCard({required this.capture, required this.onClose});

  final ms.BarcodeCapture capture;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final barcode = capture.barcodes.first;
    final value = barcode.rawValue ?? '';
    final localization = AppLocalizations.of(context);
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    localization.t('scan_result'),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                IconButton(onPressed: onClose, icon: const Icon(Icons.close_rounded)),
              ],
            ),
            const SizedBox(height: 8),
            SelectableText(value, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  icon: const Icon(Icons.copy),
                  label: Text(localization.t('copy')),
                  onPressed: () async {
                    await FlutterClipboard.copy(value);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(localization.t('copied'))),
                    );
                  },
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.share),
                  label: Text(localization.t('share')),
                  onPressed: () async => Share.share(value),
                ),
                if (value.startsWith('http://') || value.startsWith('https://'))
                  OutlinedButton.icon(
                    icon: const Icon(Icons.open_in_new),
                    label: Text(localization.t('open')),
                    onPressed: () async {
                      final uri = Uri.parse(value);
                      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(localization.t('cannot_open'))),
                        );
                      }
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ScannerIconButton extends StatelessWidget {
  const _ScannerIconButton({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 4),
            Text(label, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  _ScannerOverlayPainter(this.primaryColor);

  final Color primaryColor;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.55)
      ..style = PaintingStyle.fill;
    final overlayPath = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    const scanSize = 250.0;
    final rect = Rect.fromCenter(center: size.center(Offset.zero), width: scanSize, height: scanSize);
    final scanPath = Path()..addRRect(RRect.fromRectAndRadius(rect, const Radius.circular(28)));
    final difference = Path.combine(PathOperation.difference, overlayPath, scanPath);
    canvas.drawPath(difference, paint);

    final borderPaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(28)), borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final localization = AppLocalizations.of(context);
    final history = appState.history
        .where((entry) => entry.value.toLowerCase().contains(_query.toLowerCase()))
        .toList(growable: false);
    return SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: localization.t('search_history'),
                border: const OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _query = value),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: history.isEmpty
                ? _EmptyHistory(localization: localization)
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    itemBuilder: (context, index) {
                      final entry = history[index];
                      return Dismissible(
                        key: ValueKey(entry.id),
                        background: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.errorContainer,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          alignment: Alignment.centerRight,
                          child: Icon(Icons.delete, color: Theme.of(context).colorScheme.onErrorContainer),
                        ),
                        direction: DismissDirection.endToStart,
                        onDismissed: (_) async {
                          await appState.removeFromHistory(entry);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(localization.t('history_removed'))),
                            );
                          }
                        },
                        child: _HistoryTile(entry: entry, localization: localization),
                      );
                    },
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemCount: history.length,
                  ),
          ),
        ],
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  const _EmptyHistory({required this.localization});

  final AppLocalizations localization;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              height: 160,
              width: 160,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(32),
              ),
              alignment: Alignment.center,
              child: Icon(
                Icons.inventory_2_outlined,
                size: 80,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              localization.t('history_empty_title'),
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              localization.t('history_empty_subtitle'),
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.entry, required this.localization});

  final HistoryEntry entry;
  final AppLocalizations localization;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _HistoryIcon(type: entry.type, format: entry.format, colorScheme: colorScheme),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.title(localization),
                        style: Theme.of(context).textTheme.titleSmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        entry.friendlyTimestamp(localization),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () => _showActions(context),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              entry.value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showActions(BuildContext context) async {
    final localization = AppLocalizations.of(context);
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.copy),
                title: Text(localization.t('copy')),
                onTap: () async {
                  await FlutterClipboard.copy(entry.value);
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(localization.t('copied'))),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.share),
                title: Text(localization.t('share')),
                onTap: () async {
                  await Share.share(entry.value);
                  Navigator.of(context).pop();
                },
              ),
              if (entry.value.startsWith('http://') || entry.value.startsWith('https://'))
                ListTile(
                  leading: const Icon(Icons.open_in_browser),
                  title: Text(localization.t('open')),
                  onTap: () async {
                    final uri = Uri.parse(entry.value);
                    Navigator.of(context).pop();
                    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(localization.t('cannot_open'))),
                      );
                    }
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}

class _HistoryIcon extends StatelessWidget {
  const _HistoryIcon({required this.type, required this.format, required this.colorScheme});

  final QRContentType type;
  final CodeRenderType format;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    IconData icon;
    switch (type) {
      case QRContentType.url:
        icon = Icons.link;
        break;
      case QRContentType.wifi:
        icon = Icons.wifi;
        break;
      case QRContentType.email:
        icon = Icons.alternate_email;
        break;
      case QRContentType.phone:
        icon = Icons.phone;
        break;
      case QRContentType.sms:
        icon = Icons.sms;
        break;
      case QRContentType.text:
        icon = Icons.notes;
        break;
    }
    final gradient = LinearGradient(
      colors: [colorScheme.primary, colorScheme.secondary],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(format == CodeRenderType.qr ? icon : Icons.view_week, color: Colors.white),
    );
  }
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final localization = AppLocalizations.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
        children: [
          _SettingsSection(
            title: localization.t('appearance'),
            child: _ThemeSelector(appState: appState, localization: localization),
          ),
          const SizedBox(height: 20),
          _SettingsSection(
            title: localization.t('privacy'),
            child: _PrivacyControls(appState: appState, localization: localization),
          ),
          const SizedBox(height: 20),
          _SettingsSection(
            title: localization.t('about'),
            child: _AboutApp(localization: localization),
          ),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _ThemeSelector extends StatelessWidget {
  const _ThemeSelector({required this.appState, required this.localization});

  final AppState appState;
  final AppLocalizations localization;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        return Wrap(
          spacing: 12,
          children: [
            ChoiceChip(
              label: Text(localization.t('theme_system')),
              selected: appState.themeMode == ThemeMode.system,
              onSelected: (selected) {
                if (selected) {
                  appState.setThemeMode(ThemeMode.system);
                }
              },
            ),
            ChoiceChip(
              label: Text(localization.t('theme_light')),
              selected: appState.themeMode == ThemeMode.light,
              onSelected: (selected) {
                if (selected) {
                  appState.setThemeMode(ThemeMode.light);
                }
              },
            ),
            ChoiceChip(
              label: Text(localization.t('theme_dark')),
              selected: appState.themeMode == ThemeMode.dark,
              onSelected: (selected) {
                if (selected) {
                  appState.setThemeMode(ThemeMode.dark);
                }
              },
            ),
          ],
        );
      },
    );
  }
}

class _PrivacyControls extends StatelessWidget {
  const _PrivacyControls({required this.appState, required this.localization});

  final AppState appState;
  final AppLocalizations localization;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(localization.t('privacy_description'), style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          icon: const Icon(Icons.delete_sweep),
          label: Text(localization.t('clear_history')),
          onPressed: () async {
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (context) {
                return AlertDialog(
                  title: Text(localization.t('clear_history')),
                  content: Text(localization.t('clear_history_confirm')),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: Text(localization.t('cancel')),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      child: Text(localization.t('confirm')),
                    ),
                  ],
                );
              },
            );
            if (confirmed == true) {
              await appState.clearHistory();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(localization.t('history_cleared'))),
              );
            }
          },
        ),
      ],
    );
  }
}

class _AboutApp extends StatelessWidget {
  const _AboutApp({required this.localization});

  final AppLocalizations localization;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [colorScheme.primary, colorScheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.shield, color: Colors.white),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nexus QR', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(localization.t('version'), style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(localization.t('about_description'), style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class HistoryEntry {
  HistoryEntry({
    required this.id,
    required this.value,
    required this.type,
    required this.format,
    required this.createdAt,
  });

  final String id;
  final String value;
  final QRContentType type;
  final CodeRenderType format;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'value': value,
        'type': type.index,
        'format': format.index,
        'createdAt': createdAt.toIso8601String(),
      };

  static HistoryEntry? fromJson(Map<String, dynamic> json) {
    try {
      final typeIndex = json['type'] as int? ?? 0;
      final formatIndex = json['format'] as int? ?? 0;
      return HistoryEntry(
        id: json['id'] as String? ?? UniqueKey().toString(),
        value: json['value'] as String? ?? '',
        type: QRContentType.values[typeIndex.clamp(0, QRContentType.values.length - 1)],
        format: CodeRenderType.values[formatIndex.clamp(0, CodeRenderType.values.length - 1)],
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
    } catch (_) {
      return null;
    }
  }

  String title(AppLocalizations localization) {
    switch (type) {
      case QRContentType.text:
        return localization.t('history_type_text');
      case QRContentType.url:
        return localization.t('history_type_url');
      case QRContentType.wifi:
        return localization.t('history_type_wifi');
      case QRContentType.email:
        return localization.t('history_type_email');
      case QRContentType.phone:
        return localization.t('history_type_phone');
      case QRContentType.sms:
        return localization.t('history_type_sms');
    }
    return localization.t('history_type_text');
  }

  String friendlyTimestamp(AppLocalizations localization) {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    if (difference.inMinutes < 1) {
      return localization.t('time_just_now');
    }
    if (difference.inMinutes < 60) {
      return localization
          .t('time_minutes')
          .replaceFirst('{value}', difference.inMinutes.toString());
    }
    if (difference.inHours < 24) {
      return localization.t('time_hours').replaceFirst('{value}', difference.inHours.toString());
    }
    if (difference.inDays < 7) {
      return localization.t('time_days').replaceFirst('{value}', difference.inDays.toString());
    }
    return localization.t('time_date').replaceFirst(
          '{value}',
          '${createdAt.day}/${createdAt.month}/${createdAt.year}',
        );
  }
}

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static AppLocalizations of(BuildContext context) {
    final localization = Localizations.of<AppLocalizations>(context, AppLocalizations);
    assert(localization != null, 'AppLocalizations not found in context');
    return localization!;
  }

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'splash_tagline': 'Create, scan and secure your codes in seconds.',
      'generator': 'Create',
      'scanner': 'Scan',
      'history': 'History',
      'settings': 'Settings',
      'share_app': 'Share app',
      'share_app_message': 'Try Nexus QR to create and scan professional QR codes!',
      'generator_title': 'Generate professional codes',
      'generator_subtitle': 'Select the content type, personalise it and export safely.',
      'content_type': 'Content type',
      'type_text': 'Text',
      'type_url': 'Website',
      'type_wifi': 'Wi-Fi',
      'type_email': 'Email',
      'type_phone': 'Phone',
      'type_sms': 'SMS',
      'enter_text': 'Enter message',
      'enter_url': 'Enter secure URL',
      'wifi_name': 'Network name (SSID)',
      'wifi_password': 'Password (optional)',
      'email_address': 'Email address',
      'email_message': 'Message (optional)',
      'phone_number': 'Phone number',
      'sms_message': 'Message',
      'validation_required': 'This field is required.',
      'validation_url': 'Enter a valid secure URL (https://).',
      'validation_email': 'Enter a valid email address.',
      'validation_phone': 'Enter a valid phone number.',
      'output_type': 'Output format',
      'output_qr': 'QR Code',
      'output_barcode': 'Barcode',
      'accent_color': 'Accent colour',
      'random_color': 'Random',
      'generate_code': 'Generate code',
      'preview_title': 'Preview & export',
      'saving': 'Saving…',
      'save_image': 'Save image',
      'copy': 'Copy',
      'share': 'Share',
      'open': 'Open',
      'generated_success': 'Code generated and stored securely.',
      'copied': 'Copied to clipboard.',
      'shared': 'Share sheet opened.',
      'saved': 'Saved to gallery.',
      'save_failed': 'Unable to save the image.',
      'permission_denied': 'Permission denied.',
      'cannot_open': 'Cannot open link.',
      'scanner_tip': 'Align the code within the frame. Nexus QR automatically detects both QR and barcodes.',
      'torch': 'Torch',
      'torch_unavailable': 'Torch unavailable on this device',
      'switch_camera': 'Flip',
      'scan_result': 'Result',
      'scanned_success': 'Code stored in history.',
      'history_removed': 'Entry removed.',
      'search_history': 'Search in history…',
      'history_empty_title': 'Your hub is still empty',
      'history_empty_subtitle': 'Every scan or creation will appear here so you can share or reuse it instantly.',
      'history_type_text': 'Text snippet',
      'history_type_url': 'Website link',
      'history_type_wifi': 'Wi-Fi access',
      'history_type_email': 'Email shortcut',
      'history_type_phone': 'Phone number',
      'history_type_sms': 'SMS message',
      'appearance': 'Appearance',
      'privacy': 'Privacy',
      'about': 'About',
      'theme_system': 'System',
      'theme_light': 'Light',
      'theme_dark': 'Dark',
      'privacy_description': 'Your data stays on device. You can erase it at any time.',
      'clear_history': 'Clear history',
      'clear_history_confirm': 'Do you really want to delete all saved items? This action cannot be undone.',
      'cancel': 'Cancel',
      'confirm': 'Delete',
      'history_cleared': 'History cleared.',
      'version': 'Version 3.0.0',
      'about_description': 'Nexus QR offers enterprise-grade generation and scanning with on-device storage for your history.',
      'time_just_now': 'Just now',
      'time_minutes': '{value} minutes ago',
      'time_hours': '{value} hours ago',
      'time_days': '{value} days ago',
      'time_date': 'On {value}',
    },
    'es': {
      'splash_tagline': 'Crea, escanea y protege tus códigos en segundos.',
      'generator': 'Crear',
      'scanner': 'Escanear',
      'history': 'Historial',
      'settings': 'Ajustes',
      'share_app': 'Compartir app',
      'share_app_message': 'Prueba Nexus QR para crear y escanear códigos profesionales.',
      'generator_title': 'Genera códigos profesionales',
      'generator_subtitle': 'Selecciona el tipo de contenido, personalízalo y expórtalo con seguridad.',
      'content_type': 'Tipo de contenido',
      'type_text': 'Texto',
      'type_url': 'Sitio web',
      'type_wifi': 'Wi-Fi',
      'type_email': 'Correo',
      'type_phone': 'Teléfono',
      'type_sms': 'SMS',
      'enter_text': 'Introduce un mensaje',
      'enter_url': 'Introduce una URL segura',
      'wifi_name': 'Nombre de la red (SSID)',
      'wifi_password': 'Contraseña (opcional)',
      'email_address': 'Correo electrónico',
      'email_message': 'Mensaje (opcional)',
      'phone_number': 'Número de teléfono',
      'sms_message': 'Mensaje',
      'validation_required': 'Este campo es obligatorio.',
      'validation_url': 'Introduce una URL válida (https://).',
      'validation_email': 'Introduce un correo válido.',
      'validation_phone': 'Introduce un teléfono válido.',
      'output_type': 'Formato de salida',
      'output_qr': 'Código QR',
      'output_barcode': 'Código de barras',
      'accent_color': 'Color de acento',
      'random_color': 'Aleatorio',
      'generate_code': 'Generar código',
      'preview_title': 'Previsualizar y exportar',
      'saving': 'Guardando…',
      'save_image': 'Guardar imagen',
      'copy': 'Copiar',
      'share': 'Compartir',
      'open': 'Abrir',
      'generated_success': 'Código generado y almacenado.',
      'copied': 'Copiado al portapapeles.',
      'shared': 'Panel de compartir abierto.',
      'saved': 'Guardado en la galería.',
      'save_failed': 'No se pudo guardar la imagen.',
      'permission_denied': 'Permiso denegado.',
      'cannot_open': 'No se puede abrir el enlace.',
      'scanner_tip': 'Alinea el código dentro del marco. Nexus QR detecta QR y códigos de barras automáticamente.',
      'torch': 'Linterna',
      'torch_unavailable': 'La linterna no está disponible en este dispositivo',
      'switch_camera': 'Cambiar',
      'scan_result': 'Resultado',
      'scanned_success': 'Código guardado en el historial.',
      'history_removed': 'Elemento eliminado.',
      'search_history': 'Buscar en el historial…',
      'history_empty_title': 'Tu espacio aún está vacío',
      'history_empty_subtitle': 'Cada escaneo o creación aparecerá aquí para que lo reutilices al instante.',
      'history_type_text': 'Fragmento de texto',
      'history_type_url': 'Enlace web',
      'history_type_wifi': 'Acceso Wi-Fi',
      'history_type_email': 'Atajo de correo',
      'history_type_phone': 'Número de teléfono',
      'history_type_sms': 'Mensaje SMS',
      'appearance': 'Apariencia',
      'privacy': 'Privacidad',
      'about': 'Acerca de',
      'theme_system': 'Sistema',
      'theme_light': 'Claro',
      'theme_dark': 'Oscuro',
      'privacy_description': 'Tus datos permanecen en el dispositivo. Puedes borrarlos cuando quieras.',
      'clear_history': 'Borrar historial',
      'clear_history_confirm': '¿Seguro que quieres eliminar todos los elementos? Esta acción no se puede deshacer.',
      'cancel': 'Cancelar',
      'confirm': 'Eliminar',
      'history_cleared': 'Historial eliminado.',
      'version': 'Versión 3.0.0',
      'about_description': 'Nexus QR ofrece generación y escaneo de nivel profesional con almacenamiento local seguro.',
      'time_just_now': 'Justo ahora',
      'time_minutes': 'Hace {value} minutos',
      'time_hours': 'Hace {value} horas',
      'time_days': 'Hace {value} días',
      'time_date': 'El {value}',
    },
    'fr': {
      'splash_tagline': 'Créez, scannez et sécurisez vos codes en quelques secondes.',
      'generator': 'Créer',
      'scanner': 'Scanner',
      'history': 'Historique',
      'settings': 'Réglages',
      'share_app': 'Partager',
      'share_app_message': 'Découvrez Nexus QR pour générer et scanner des codes professionnels !',
      'generator_title': 'Générez des codes professionnels',
      'generator_subtitle': 'Choisissez le contenu, personnalisez-le et exportez-le en toute sécurité.',
      'content_type': 'Type de contenu',
      'type_text': 'Texte',
      'type_url': 'Site web',
      'type_wifi': 'Wi-Fi',
      'type_email': 'E-mail',
      'type_phone': 'Téléphone',
      'type_sms': 'SMS',
      'enter_text': 'Saisir un message',
      'enter_url': 'Saisir une URL sécurisée',
      'wifi_name': 'Nom du réseau (SSID)',
      'wifi_password': 'Mot de passe (optionnel)',
      'email_address': 'Adresse e-mail',
      'email_message': 'Message (optionnel)',
      'phone_number': 'Numéro de téléphone',
      'sms_message': 'Message',
      'validation_required': 'Ce champ est obligatoire.',
      'validation_url': 'Entrez une URL valide (https://).',
      'validation_email': 'Entrez une adresse e-mail valide.',
      'validation_phone': 'Entrez un numéro valide.',
      'output_type': 'Format de sortie',
      'output_qr': 'Code QR',
      'output_barcode': 'Code-barres',
      'accent_color': 'Couleur d’accent',
      'random_color': 'Aléatoire',
      'generate_code': 'Générer le code',
      'preview_title': 'Aperçu et export',
      'saving': 'Enregistrement…',
      'save_image': 'Enregistrer l’image',
      'copy': 'Copier',
      'share': 'Partager',
      'open': 'Ouvrir',
      'generated_success': 'Code généré et stocké.',
      'copied': 'Copié dans le presse-papiers.',
      'shared': 'Partage lancé.',
      'saved': 'Enregistré dans la galerie.',
      'save_failed': 'Impossible d’enregistrer l’image.',
      'permission_denied': 'Permission refusée.',
      'cannot_open': 'Impossible d’ouvrir le lien.',
      'scanner_tip': 'Alignez le code dans le cadre. Nexus QR détecte automatiquement QR et codes-barres.',
      'torch': 'Lampe',
      'torch_unavailable': 'Lampe indisponible sur cet appareil',
      'switch_camera': 'Inverser',
      'scan_result': 'Résultat',
      'scanned_success': 'Code ajouté à l’historique.',
      'history_removed': 'Élément supprimé.',
      'search_history': 'Rechercher dans l’historique…',
      'history_empty_title': 'Votre espace est encore vide',
      'history_empty_subtitle': 'Chaque scan ou création apparaîtra ici pour un partage instantané.',
      'history_type_text': 'Extrait de texte',
      'history_type_url': 'Lien web',
      'history_type_wifi': 'Accès Wi-Fi',
      'history_type_email': 'Raccourci e-mail',
      'history_type_phone': 'Numéro de téléphone',
      'history_type_sms': 'Message SMS',
      'appearance': 'Apparence',
      'privacy': 'Confidentialité',
      'about': 'À propos',
      'theme_system': 'Système',
      'theme_light': 'Clair',
      'theme_dark': 'Sombre',
      'privacy_description': 'Vos données restent sur l’appareil. Effacez-les quand vous voulez.',
      'clear_history': 'Effacer l’historique',
      'clear_history_confirm': 'Voulez-vous supprimer tous les éléments enregistrés ? Action irréversible.',
      'cancel': 'Annuler',
      'confirm': 'Supprimer',
      'history_cleared': 'Historique effacé.',
      'version': 'Version 3.0.0',
      'about_description': 'Nexus QR fournit une génération et un scan professionnels avec stockage local sécurisé.',
      'time_just_now': 'À l’instant',
      'time_minutes': 'Il y a {value} minutes',
      'time_hours': 'Il y a {value} heures',
      'time_days': 'Il y a {value} jours',
      'time_date': 'Le {value}',
    },
    'pt': {
      'splash_tagline': 'Crie, leia e proteja seus códigos em segundos.',
      'generator': 'Criar',
      'scanner': 'Ler',
      'history': 'Histórico',
      'settings': 'Configurações',
      'share_app': 'Compartilhar',
      'share_app_message': 'Experimente o Nexus QR para gerar e escanear códigos profissionais!',
      'generator_title': 'Gere códigos profissionais',
      'generator_subtitle': 'Escolha o conteúdo, personalize e exporte com segurança.',
      'content_type': 'Tipo de conteúdo',
      'type_text': 'Texto',
      'type_url': 'Site',
      'type_wifi': 'Wi-Fi',
      'type_email': 'E-mail',
      'type_phone': 'Telefone',
      'type_sms': 'SMS',
      'enter_text': 'Digite a mensagem',
      'enter_url': 'Digite uma URL segura',
      'wifi_name': 'Nome da rede (SSID)',
      'wifi_password': 'Senha (opcional)',
      'email_address': 'Endereço de e-mail',
      'email_message': 'Mensagem (opcional)',
      'phone_number': 'Número de telefone',
      'sms_message': 'Mensagem',
      'validation_required': 'Campo obrigatório.',
      'validation_url': 'Informe uma URL válida (https://).',
      'validation_email': 'Informe um e-mail válido.',
      'validation_phone': 'Informe um telefone válido.',
      'output_type': 'Formato de saída',
      'output_qr': 'Código QR',
      'output_barcode': 'Código de barras',
      'accent_color': 'Cor de destaque',
      'random_color': 'Aleatória',
      'generate_code': 'Gerar código',
      'preview_title': 'Pré-visualizar e exportar',
      'saving': 'Salvando…',
      'save_image': 'Salvar imagem',
      'copy': 'Copiar',
      'share': 'Compartilhar',
      'open': 'Abrir',
      'generated_success': 'Código gerado e salvo.',
      'copied': 'Copiado para a área de transferência.',
      'shared': 'Compartilhamento aberto.',
      'saved': 'Salvo na galeria.',
      'save_failed': 'Não foi possível salvar a imagem.',
      'permission_denied': 'Permissão negada.',
      'cannot_open': 'Não foi possível abrir o link.',
      'scanner_tip': 'Alinhe o código ao quadro. O Nexus QR detecta automaticamente QR e códigos de barras.',
      'torch': 'Lanterna',
      'torch_unavailable': 'Lanterna indisponível neste dispositivo',
      'switch_camera': 'Inverter',
      'scan_result': 'Resultado',
      'scanned_success': 'Código armazenado no histórico.',
      'history_removed': 'Item removido.',
      'search_history': 'Buscar no histórico…',
      'history_empty_title': 'Seu espaço ainda está vazio',
      'history_empty_subtitle': 'Cada leitura ou criação aparecerá aqui para uso imediato.',
      'history_type_text': 'Trecho de texto',
      'history_type_url': 'Link da web',
      'history_type_wifi': 'Acesso Wi-Fi',
      'history_type_email': 'Atalho de e-mail',
      'history_type_phone': 'Número de telefone',
      'history_type_sms': 'Mensagem SMS',
      'appearance': 'Aparência',
      'privacy': 'Privacidade',
      'about': 'Sobre',
      'theme_system': 'Sistema',
      'theme_light': 'Claro',
      'theme_dark': 'Escuro',
      'privacy_description': 'Seus dados ficam no dispositivo. Apague quando quiser.',
      'clear_history': 'Limpar histórico',
      'clear_history_confirm': 'Deseja apagar todos os itens salvos? Essa ação não pode ser desfeita.',
      'cancel': 'Cancelar',
      'confirm': 'Excluir',
      'history_cleared': 'Histórico limpo.',
      'version': 'Versão 3.0.0',
      'about_description': 'Nexus QR oferece geração e leitura profissionais com armazenamento local seguro.',
      'time_just_now': 'Agora mesmo',
      'time_minutes': 'Há {value} minutos',
      'time_hours': 'Há {value} horas',
      'time_days': 'Há {value} dias',
      'time_date': 'Em {value}',
    },
    'de': {
      'splash_tagline': 'Erstelle, scanne und sichere deine Codes in Sekunden.',
      'generator': 'Erstellen',
      'scanner': 'Scannen',
      'history': 'Verlauf',
      'settings': 'Einstellungen',
      'share_app': 'App teilen',
      'share_app_message': 'Teste Nexus QR, um professionelle QR-Codes zu erstellen und zu scannen!',
      'generator_title': 'Erstelle professionelle Codes',
      'generator_subtitle': 'Wähle den Inhalt, personalisiere ihn und exportiere sicher.',
      'content_type': 'Inhaltstyp',
      'type_text': 'Text',
      'type_url': 'Website',
      'type_wifi': 'WLAN',
      'type_email': 'E-Mail',
      'type_phone': 'Telefon',
      'type_sms': 'SMS',
      'enter_text': 'Nachricht eingeben',
      'enter_url': 'Sichere URL eingeben',
      'wifi_name': 'Netzwerkname (SSID)',
      'wifi_password': 'Passwort (optional)',
      'email_address': 'E-Mail-Adresse',
      'email_message': 'Nachricht (optional)',
      'phone_number': 'Telefonnummer',
      'sms_message': 'Nachricht',
      'validation_required': 'Dieses Feld ist erforderlich.',
      'validation_url': 'Gib eine gültige URL (https://) ein.',
      'validation_email': 'Gib eine gültige E-Mail-Adresse ein.',
      'validation_phone': 'Gib eine gültige Telefonnummer ein.',
      'output_type': 'Ausgabeformat',
      'output_qr': 'QR-Code',
      'output_barcode': 'Barcode',
      'accent_color': 'Akzentfarbe',
      'random_color': 'Zufällig',
      'generate_code': 'Code generieren',
      'preview_title': 'Vorschau & Export',
      'saving': 'Speichern…',
      'save_image': 'Bild speichern',
      'copy': 'Kopieren',
      'share': 'Teilen',
      'open': 'Öffnen',
      'generated_success': 'Code erstellt und gespeichert.',
      'copied': 'In die Zwischenablage kopiert.',
      'shared': 'Teilen geöffnet.',
      'saved': 'In der Galerie gespeichert.',
      'save_failed': 'Bild konnte nicht gespeichert werden.',
      'permission_denied': 'Zugriff verweigert.',
      'cannot_open': 'Link kann nicht geöffnet werden.',
      'scanner_tip': 'Richte den Code im Rahmen aus. Nexus QR erkennt QR- und Barcodes automatisch.',
      'torch': 'Lampe',
      'torch_unavailable': 'Taschenlampe auf diesem Gerät nicht verfügbar',
      'switch_camera': 'Wechseln',
      'scan_result': 'Ergebnis',
      'scanned_success': 'Code im Verlauf gespeichert.',
      'history_removed': 'Eintrag entfernt.',
      'search_history': 'Im Verlauf suchen…',
      'history_empty_title': 'Dein Bereich ist noch leer',
      'history_empty_subtitle': 'Jeder Scan oder jede Erstellung erscheint hier für den sofortigen Zugriff.',
      'history_type_text': 'Textausschnitt',
      'history_type_url': 'Weblink',
      'history_type_wifi': 'WLAN-Zugang',
      'history_type_email': 'E-Mail-Kürzel',
      'history_type_phone': 'Telefonnummer',
      'history_type_sms': 'SMS-Nachricht',
      'appearance': 'Darstellung',
      'privacy': 'Datenschutz',
      'about': 'Info',
      'theme_system': 'System',
      'theme_light': 'Hell',
      'theme_dark': 'Dunkel',
      'privacy_description': 'Deine Daten bleiben auf dem Gerät. Du kannst sie jederzeit löschen.',
      'clear_history': 'Verlauf löschen',
      'clear_history_confirm': 'Möchtest du alle Einträge löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
      'cancel': 'Abbrechen',
      'confirm': 'Löschen',
      'history_cleared': 'Verlauf gelöscht.',
      'version': 'Version 3.0.0',
      'about_description': 'Nexus QR bietet professionelle Erstellung und Erkennung mit sicherer lokaler Speicherung.',
      'time_just_now': 'Gerade eben',
      'time_minutes': 'Vor {value} Minuten',
      'time_hours': 'Vor {value} Stunden',
      'time_days': 'Vor {value} Tagen',
      'time_date': 'Am {value}',
    },
  };

  static Iterable<String> get supportedLanguages => _localizedValues.keys;

  String t(String key) {
    final values = _localizedValues[locale.languageCode] ?? _localizedValues['en']!;
    return values[key] ?? _localizedValues['en']![key] ?? key;
  }
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.supportedLanguages.contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}

class _FallbackMaterialLocalizations extends LocalizationsDelegate<MaterialLocalizations> {
  const _FallbackMaterialLocalizations();

  static const LocalizationsDelegate<MaterialLocalizations> delegate = _FallbackMaterialLocalizations();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<MaterialLocalizations> load(Locale locale) => DefaultMaterialLocalizations.delegate.load(locale);

  @override
  bool shouldReload(_FallbackMaterialLocalizations old) => false;
}

class _FallbackWidgetsLocalizations extends LocalizationsDelegate<WidgetsLocalizations> {
  const _FallbackWidgetsLocalizations();

  static const LocalizationsDelegate<WidgetsLocalizations> delegate = _FallbackWidgetsLocalizations();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<WidgetsLocalizations> load(Locale locale) => DefaultWidgetsLocalizations.delegate.load(locale);

  @override
  bool shouldReload(_FallbackWidgetsLocalizations old) => false;
}

class _FallbackCupertinoLocalizations extends LocalizationsDelegate<CupertinoLocalizations> {
  const _FallbackCupertinoLocalizations();

  static const LocalizationsDelegate<CupertinoLocalizations> delegate = _FallbackCupertinoLocalizations();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<CupertinoLocalizations> load(Locale locale) {
    return DefaultCupertinoLocalizations.load(locale);
  }

  @override
  bool shouldReload(_FallbackCupertinoLocalizations old) => false;
}
