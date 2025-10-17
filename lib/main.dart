import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:barcode_widget/barcode_widget.dart' as bw;
import 'package:clipboard/clipboard.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter/services.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart' as ms;
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(
    <DeviceOrientation>[
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ],
  );
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );
  final appState = AppState();
  await appState.initialize();
  runApp(AppStateScope(appState: appState, child: const NexusQrApp()));
}

const Color kSeedColor = Color(0xFF006E5A);
const Color kSeedColorDark = Color(0xFF004B3E);
const Duration kShortAnim = Duration(milliseconds: 160);
const Duration kMediumAnim = Duration(milliseconds: 260);
const double kPreviewSize = 240;
const String kHistoryKey = 'nexus_history_v4';
const String kTemplatesKey = 'nexus_templates_v2';
const String kSettingsKey = 'nexus_settings_v1';
const String kOnboardingKey = 'nexus_onboarding_seen';
const String kSavedViewsKey = 'nexus_saved_views_v1';

bool isAllowedScheme(String scheme) {
  const allowed = <String>['http', 'https', 'mailto', 'tel', 'sms', 'geo'];
  return allowed.contains(scheme.toLowerCase());
}

extension IterableFirstWhereOrNull<T> on Iterable<T> {
  T? firstWhereOrNull(bool Function(T element) test) {
    for (final element in this) {
      if (test(element)) {
        return element;
      }
    }
    return null;
  }
}

class AppState extends ChangeNotifier {
  SharedPreferences? _prefs;
  ThemeMode _themeMode = ThemeMode.system;
  bool _highContrast = false;
  bool _autoSaveSensitive = false;
  bool _seenOnboarding = false;
  Color _seed = kSeedColor;
  String _defaultPalette = GeneratorPalette.midnight.id;
  double _defaultQuietZone = 4;
  int _defaultScale = 2;
  int _autoCleanDays = 30;
  String _defaultFileName = '{type}_{date}_{slug}';
  final List<HistoryEntry> _history = <HistoryEntry>[];
  final List<SavedTemplate> _templates = <SavedTemplate>[];
  final List<SavedHistoryView> _savedViews = <SavedHistoryView>[];

  ThemeMode get themeMode => _themeMode;
  bool get highContrast => _highContrast;
  bool get autoSaveSensitive => _autoSaveSensitive;
  bool get seenOnboarding => _seenOnboarding;
  Color get seed => _seed;
  String get defaultPalette => _defaultPalette;
  double get defaultQuietZone => _defaultQuietZone;
  int get defaultScale => _defaultScale;
  int get autoCleanDays => _autoCleanDays;
  String get defaultFileName => _defaultFileName;
  List<HistoryEntry> get history => List<HistoryEntry>.unmodifiable(_history);
  List<SavedTemplate> get templates => List<SavedTemplate>.unmodifiable(_templates);
  List<SavedHistoryView> get historyViews => List<SavedHistoryView>.unmodifiable(_savedViews);

  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    _themeMode = ThemeMode.values[_prefs?.getInt('theme_mode') ?? ThemeMode.system.index];
    _highContrast = _prefs?.getBool('high_contrast') ?? false;
    _autoSaveSensitive = _prefs?.getBool('auto_save_sensitive') ?? false;
    _seenOnboarding = _prefs?.getBool(kOnboardingKey) ?? false;
    _seed = Color(_prefs?.getInt('seed_color') ?? kSeedColor.value);
    _defaultPalette = _prefs?.getString('default_palette') ?? GeneratorPalette.midnight.id;
    _defaultQuietZone = (_prefs?.getDouble('quiet_zone') ?? 4).clamp(0, 32);
    _defaultScale = (_prefs?.getInt('default_scale') ?? 2).clamp(1, 4);
    _autoCleanDays = _prefs?.getInt('auto_clean_days') ?? 30;
    _defaultFileName = _prefs?.getString('file_name') ?? '{type}_{date}_{slug}';
    final rawHistory = _prefs?.getStringList(kHistoryKey) ?? <String>[];
    _history
      ..clear()
      ..addAll(rawHistory.map((e) => HistoryEntry.fromJson(jsonDecode(e) as Map<String, dynamic>)).whereType<HistoryEntry>());
    final rawTemplates = _prefs?.getStringList(kTemplatesKey) ?? <String>[];
    _templates
      ..clear()
      ..addAll(rawTemplates.map((e) => SavedTemplate.fromJson(jsonDecode(e) as Map<String, dynamic>)).whereType<SavedTemplate>());
    final rawViews = _prefs?.getStringList(kSavedViewsKey) ?? <String>[];
    _savedViews
      ..clear()
      ..addAll(rawViews.map((e) => SavedHistoryView.fromJson(jsonDecode(e) as Map<String, dynamic>)).whereType<SavedHistoryView>());
    _autoPurge();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    await _prefs?.setInt('theme_mode', mode.index);
    notifyListeners();
  }

  Future<void> setHighContrast(bool value) async {
    _highContrast = value;
    await _prefs?.setBool('high_contrast', value);
    notifyListeners();
  }

  Future<void> setSeed(Color value) async {
    _seed = value;
    await _prefs?.setInt('seed_color', value.value);
    notifyListeners();
  }

  Future<void> setAutoSaveSensitive(bool value) async {
    _autoSaveSensitive = value;
    await _prefs?.setBool('auto_save_sensitive', value);
    notifyListeners();
  }

  Future<void> setDefaultPalette(String id) async {
    _defaultPalette = id;
    await _prefs?.setString('default_palette', id);
    notifyListeners();
  }

  Future<void> setDefaultQuietZone(double value) async {
    _defaultQuietZone = value.clamp(0, 32);
    await _prefs?.setDouble('quiet_zone', _defaultQuietZone);
    notifyListeners();
  }

  Future<void> setDefaultScale(int value) async {
    _defaultScale = value.clamp(1, 4);
    await _prefs?.setInt('default_scale', _defaultScale);
    notifyListeners();
  }

  Future<void> setAutoCleanDays(int days) async {
    _autoCleanDays = days;
    await _prefs?.setInt('auto_clean_days', days);
    notifyListeners();
    _autoPurge();
  }

  Future<void> setDefaultFileName(String pattern) async {
    _defaultFileName = pattern;
    await _prefs?.setString('file_name', pattern);
    notifyListeners();
  }

  void markOnboardingSeen() {
    _seenOnboarding = true;
    _prefs?.setBool(kOnboardingKey, true);
    notifyListeners();
  }

  Future<void> addHistory(HistoryEntry entry, {bool force = false}) async {
    if (!force && !_autoSaveSensitive && entry.isSensitive) {
      return;
    }
    _history.removeWhere((element) => element.id == entry.id);
    _history.insert(0, entry);
    if (_history.length > 250) {
      _history.removeRange(250, _history.length);
    }
    await _persistHistory();
    notifyListeners();
  }

  Future<void> updateHistory(HistoryEntry entry) async {
    final index = _history.indexWhere((element) => element.id == entry.id);
    if (index == -1) return;
    _history[index] = entry;
    await _persistHistory();
    notifyListeners();
  }

  Future<List<HistoryEntry>> removeHistory(Iterable<String> ids) async {
    final removed = _history.where((element) => ids.contains(element.id)).toList();
    if (removed.isEmpty) {
      return removed;
    }
    _history.removeWhere((element) => ids.contains(element.id));
    await _persistHistory();
    notifyListeners();
    return removed;
  }

  Future<void> clearHistory() async {
    _history.clear();
    await _prefs?.remove(kHistoryKey);
    notifyListeners();
  }

  Future<void> addTemplate(SavedTemplate template) async {
    final index = _templates.indexWhere((element) => element.id == template.id);
    if (index >= 0) {
      _templates[index] = template;
    } else {
      _templates.add(template);
    }
    await _persistTemplates();
    notifyListeners();
  }

  Future<void> removeTemplate(String id) async {
    _templates.removeWhere((element) => element.id == id);
    await _persistTemplates();
    notifyListeners();
  }

  Future<void> reorderTemplates(int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex--;
    final item = _templates.removeAt(oldIndex);
    _templates.insert(newIndex, item);
    await _persistTemplates();
    notifyListeners();
  }

  Future<void> addHistoryView(SavedHistoryView view) async {
    final index = _savedViews.indexWhere((element) => element.id == view.id);
    if (index >= 0) {
      _savedViews[index] = view;
    } else {
      _savedViews.add(view);
    }
    await _persistViews();
    notifyListeners();
  }

  Future<void> removeHistoryView(String id) async {
    _savedViews.removeWhere((element) => element.id == id);
    await _persistViews();
    notifyListeners();
  }

  Future<void> reorderHistoryViews(int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex--;
    final item = _savedViews.removeAt(oldIndex);
    _savedViews.insert(newIndex, item);
    await _persistViews();
    notifyListeners();
  }

  Future<void> _persistHistory() async {
    await _prefs?.setStringList(
      kHistoryKey,
      _history.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }

  Future<void> _persistTemplates() async {
    await _prefs?.setStringList(
      kTemplatesKey,
      _templates.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }

  Future<void> _persistViews() async {
    await _prefs?.setStringList(
      kSavedViewsKey,
      _savedViews.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }

  void _autoPurge() {
    if (_autoCleanDays <= 0) return;
    final cutoff = DateTime.now().subtract(Duration(days: _autoCleanDays));
    final previousLength = _history.length;
    _history.removeWhere((element) => element.createdAt.isBefore(cutoff));
    if (_history.length != previousLength) {
      _persistHistory();
      notifyListeners();
    }
  }
}

class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({super.key, required super.child, required AppState appState}) : super(notifier: appState);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'AppStateScope not found');
    return scope!.notifier!;
  }
}

class NexusQrApp extends StatefulWidget {
  const NexusQrApp({super.key});

  @override
  State<NexusQrApp> createState() => _NexusQrAppState();
}

class _NexusQrAppState extends State<NexusQrApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    return AnimatedBuilder(
      animation: state,
      builder: (context, _) {
        final lightScheme = state.highContrast
            ? const ColorScheme.highContrastLight(primary: kSeedColor)
            : ColorScheme.fromSeed(seedColor: state.seed, brightness: Brightness.light);
        final darkScheme = state.highContrast
            ? const ColorScheme.highContrastDark(primary: kSeedColorDark)
            : ColorScheme.fromSeed(seedColor: kSeedColorDark, brightness: Brightness.dark);
        return MaterialApp(
          navigatorKey: _navigatorKey,
          debugShowCheckedModeBanner: false,
          title: 'Nexus QR',
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('en'),
            Locale('es'),
            Locale('fr'),
            Locale('pt'),
            Locale('de'),
          ],
          themeMode: state.themeMode,
          theme: _buildTheme(lightScheme, false),
          darkTheme: _buildTheme(darkScheme, true),
          home: HomeShell(navigatorKey: _navigatorKey),
        );
      },
    );
  }

  ThemeData _buildTheme(ColorScheme scheme, bool dark) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: scheme.brightness,
      fontFamily: 'Roboto',
    );
    return base.copyWith(
      scaffoldBackgroundColor: dark ? const Color(0xFF101417) : const Color(0xFFE7EDF2),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        titleTextStyle: base.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.2),
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        elevation: 6,
      ),
      cardTheme: CardTheme(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: dark ? 2 : 3,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shadowColor: scheme.shadow.withOpacity(0.16),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        contentTextStyle: base.textTheme.bodyMedium?.copyWith(color: scheme.onPrimaryContainer),
      ),
      tooltipTheme: const TooltipThemeData(waitDuration: Duration(milliseconds: 400)),
      listTileTheme: const ListTileThemeData(contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceVariant.withOpacity(dark ? 0.3 : 0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
          padding: MaterialStateProperty.all<EdgeInsets>(const EdgeInsets.symmetric(horizontal: 24, vertical: 16)),
          shape: MaterialStateProperty.all<RoundedRectangleBorder>(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
          elevation: MaterialStateProperty.resolveWith<double>((states) {
            if (states.contains(MaterialState.pressed)) return 1;
            if (states.contains(MaterialState.hovered)) return 3;
            return 2;
          }),
        ),
      ),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.navigatorKey});

  final GlobalKey<NavigatorState> navigatorKey;

  static _HomeShellState? of(BuildContext context) => context.findAncestorStateOfType<_HomeShellState>();

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  final PageController _pageController = PageController();
  final ValueNotifier<FabIntent> _fabIntent = ValueNotifier<FabIntent>(FabIntent.generate);
  final GlobalKey<_GeneratorPageState> _generatorKey = GlobalKey<_GeneratorPageState>();
  final GlobalKey<_HistoryPageState> _historyKey = GlobalKey<_HistoryPageState>();
  final GlobalKey<_ScannerPageState> _scannerKey = GlobalKey<_ScannerPageState>();
  int _index = 0;
  bool _showOnboarding = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = AppStateScope.of(context);
      if (!state.seenOnboarding) {
        setState(() => _showOnboarding = true);
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fabIntent.dispose();
    super.dispose();
  }

  void _onDestinationSelected(int index) {
    setState(() => _index = index);
    _pageController.animateToPage(index, duration: kMediumAnim, curve: Curves.easeInOut);
  }

  void switchTab(int index) => _onDestinationSelected(index);

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final bool wide = media.size.width >= 900;
    final destinations = <NavigationDestination>[
      const NavigationDestination(icon: Icon(Icons.qr_code_2_outlined), selectedIcon: Icon(Icons.qr_code_2), label: 'Crear'),
      const NavigationDestination(icon: Icon(Icons.center_focus_strong_outlined), selectedIcon: Icon(Icons.center_focus_strong), label: 'Escanear'),
      const NavigationDestination(icon: Icon(Icons.history_toggle_off), selectedIcon: Icon(Icons.history), label: 'Historial'),
      const NavigationDestination(icon: Icon(Icons.tune_outlined), selectedIcon: Icon(Icons.tune), label: 'Ajustes'),
    ];
    final pages = <Widget>[
      GeneratorPage(key: _generatorKey, onFabIntentChanged: _fabIntent),
      ScannerPage(key: _scannerKey, onFabIntentChanged: _fabIntent),
      HistoryPage(key: _historyKey, onFabIntentChanged: _fabIntent),
      SettingsPage(onFabIntentChanged: _fabIntent),
    ];
    final shortcuts = <ShortcutActivator, Intent>{
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyK): const OpenCommandPaletteIntent(),
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyK): const OpenCommandPaletteIntent(),
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyC): const CopyPayloadIntent(),
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyC): const CopyPayloadIntent(),
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyS): const DownloadPayloadIntent(),
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyS): const DownloadPayloadIntent(),
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyF): const SearchHistoryIntent(),
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyF): const SearchHistoryIntent(),
      LogicalKeySet(LogicalKeyboardKey.delete): const DeleteHistorySelectionIntent(),
      LogicalKeySet(LogicalKeyboardKey.space): const PauseScannerIntent(),
      LogicalKeySet(LogicalKeyboardKey.keyF): const ToggleTorchIntent(),
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.equal): const IncreaseScaleIntent(),
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.equal): const IncreaseScaleIntent(),
      LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.minus): const DecreaseScaleIntent(),
      LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.minus): const DecreaseScaleIntent(),
    };

    final actions = <Type, Action<Intent>>{
      OpenCommandPaletteIntent: CallbackAction<OpenCommandPaletteIntent>(onInvoke: (_) {
        _showCommandPalette();
        return null;
      }),
      CopyPayloadIntent: CallbackAction<CopyPayloadIntent>(onInvoke: (_) {
        if (_generatorKey.currentState != null) {
          _onDestinationSelected(0);
          _generatorKey.currentState!.copyCurrent();
        }
        return null;
      }),
      DownloadPayloadIntent: CallbackAction<DownloadPayloadIntent>(onInvoke: (_) {
        if (_generatorKey.currentState != null) {
          _onDestinationSelected(0);
          _generatorKey.currentState!.downloadCurrent();
        }
        return null;
      }),
      SearchHistoryIntent: CallbackAction<SearchHistoryIntent>(onInvoke: (_) {
        _onDestinationSelected(2);
        WidgetsBinding.instance.addPostFrameCallback((_) => _historyKey.currentState?.focusSearchField());
        return null;
      }),
      DeleteHistorySelectionIntent: CallbackAction<DeleteHistorySelectionIntent>(onInvoke: (_) {
        _historyKey.currentState?.deleteSelection();
        return null;
      }),
      PauseScannerIntent: CallbackAction<PauseScannerIntent>(onInvoke: (_) {
        if (_index == 1) {
          _scannerKey.currentState?.togglePauseExternally();
        }
        return null;
      }),
      ToggleTorchIntent: CallbackAction<ToggleTorchIntent>(onInvoke: (_) {
        if (_index == 1) {
          _scannerKey.currentState?.toggleTorchExternally();
        }
        return null;
      }),
      IncreaseScaleIntent: CallbackAction<IncreaseScaleIntent>(onInvoke: (_) {
        _generatorKey.currentState?.increaseExportScale();
        return null;
      }),
      DecreaseScaleIntent: CallbackAction<DecreaseScaleIntent>(onInvoke: (_) {
        _generatorKey.currentState?.decreaseExportScale();
        return null;
      }),
    };

    return Shortcuts(
      shortcuts: shortcuts,
      child: Actions(
        actions: actions,
        child: FocusTraversalGroup(
          policy: WidgetOrderTraversalPolicy(),
          child: Scaffold(
            extendBody: true,
            body: SafeArea(
              child: Row(
                children: [
                  if (wide)
                    NavigationRail(
                      selectedIndex: _index,
                      extended: media.size.width >= 1200,
                      destinations: const [
                        NavigationRailDestination(icon: Icon(Icons.qr_code_2_outlined), selectedIcon: Icon(Icons.qr_code_2), label: Text('Crear')),
                        NavigationRailDestination(icon: Icon(Icons.center_focus_strong_outlined), selectedIcon: Icon(Icons.center_focus_strong), label: Text('Escanear')),
                        NavigationRailDestination(icon: Icon(Icons.history_toggle_off), selectedIcon: Icon(Icons.history), label: Text('Historial')),
                        NavigationRailDestination(icon: Icon(Icons.tune_outlined), selectedIcon: Icon(Icons.tune), label: Text('Ajustes')),
                      ],
                      backgroundColor: Theme.of(context).colorScheme.surface,
                      indicatorColor: Theme.of(context).colorScheme.secondaryContainer,
                      onDestinationSelected: _onDestinationSelected,
                      leading: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text('Nexus QR', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  Expanded(
                    child: Stack(
                      children: [
                        PageView(
                          controller: _pageController,
                          physics: const ClampingScrollPhysics(),
                          onPageChanged: (index) => setState(() => _index = index),
                          children: pages,
                        ),
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Padding(
                            padding: EdgeInsets.only(
                              left: wide ? 96 : 16,
                              right: wide ? 96 : 16,
                              bottom: media.padding.bottom + (wide ? 32 : 100),
                            ),
                            child: ValueListenableBuilder<FabIntent>(
                              valueListenable: _fabIntent,
                              builder: (context, intent, _) {
                                if (intent == FabIntent.none) return const SizedBox.shrink();
                                return AnimatedSwitcher(
                                  duration: kShortAnim,
                                  transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                                  child: _FabSwitcher(intent: intent),
                                );
                              },
                            ),
                          ),
                        ),
                        if (_showOnboarding)
                          Positioned.fill(
                            child: OnboardingOverlay(
                              onClose: () {
                                AppStateScope.of(context).markOnboardingSeen();
                                setState(() => _showOnboarding = false);
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            bottomNavigationBar: wide
                ? null
                : NavigationBar(
                    selectedIndex: _index,
                    destinations: destinations,
                    onDestinationSelected: _onDestinationSelected,
                  ),
          ),
        ),
      ),
    );
  }

  void _showCommandPalette() {
    final controller = TextEditingController();
    final commands = _buildCommandEntries();
    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        String query = '';
        return StatefulBuilder(
          builder: (context, setState) {
            final filtered = commands.where((command) => command.matches(query)).toList();
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: SizedBox(
                width: 420,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                      child: TextField(
                        controller: controller,
                        autofocus: true,
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.search),
                          hintText: 'Acción rápida…',
                        ),
                        onChanged: (value) => setState(() => query = value),
                      ),
                    ),
                    const Divider(height: 1),
                    SizedBox(
                      height: min(360, 72.0 * max(1, filtered.length)),
                      child: filtered.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Text('Sin resultados, prueba otra búsqueda', style: Theme.of(context).textTheme.bodyMedium),
                              ),
                            )
                          : ListView.builder(
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final entry = filtered[index];
                                return ListTile(
                                  leading: Icon(entry.icon),
                                  title: Text(entry.title),
                                  subtitle: Text(entry.subtitle),
                                  onTap: () {
                                    Navigator.of(dialogContext).pop();
                                    entry.onSelected();
                                  },
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() => controller.dispose());
  }

  List<CommandEntry> _buildCommandEntries() {
    final appState = AppStateScope.of(context);
    final commands = <CommandEntry>[
      CommandEntry(
        title: 'Crear QR Wi-Fi',
        subtitle: 'Plantilla de invitados segura',
        icon: Icons.wifi,
        keywords: const ['wifi', 'crear', 'qr'],
        onSelected: () {
          _onDestinationSelected(0);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _generatorKey.currentState?.selectType(GeneratorContentType.wifi);
          });
        },
      ),
      CommandEntry(
        title: 'Crear QR URL',
        subtitle: 'Analiza y genera enlaces',
        icon: Icons.link,
        keywords: const ['url', 'enlace'],
        onSelected: () {
          _onDestinationSelected(0);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _generatorKey.currentState?.selectType(GeneratorContentType.url);
          });
        },
      ),
      CommandEntry(
        title: 'Crear QR vCard',
        subtitle: 'Tarjeta profesional',
        icon: Icons.badge,
        keywords: const ['vcard', 'contacto'],
        onSelected: () {
          _onDestinationSelected(0);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _generatorKey.currentState?.selectType(GeneratorContentType.vcard);
          });
        },
      ),
      CommandEntry(
        title: 'Activar modo lote',
        subtitle: 'Procesa múltiples códigos',
        icon: Icons.playlist_add_check,
        keywords: const ['lote', 'batch'],
        onSelected: () {
          _onDestinationSelected(0);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _generatorKey.currentState?.openBatchMode();
          });
        },
      ),
      CommandEntry(
        title: 'Copiar código actual',
        subtitle: 'Envía el contenido al portapapeles',
        icon: Icons.copy_all,
        keywords: const ['copiar'],
        onSelected: () => _generatorKey.currentState?.copyCurrent(),
      ),
      CommandEntry(
        title: 'Descargar PNG',
        subtitle: 'Exporta la vista previa',
        icon: Icons.download,
        keywords: const ['descargar', 'png'],
        onSelected: () => _generatorKey.currentState?.downloadCurrent(),
      ),
      CommandEntry(
        title: 'Ir al escáner',
        subtitle: 'Activa la cámara y el láser',
        icon: Icons.center_focus_strong,
        keywords: const ['scanner', 'scan'],
        onSelected: () => _onDestinationSelected(1),
      ),
      CommandEntry(
        title: 'Linterna del escáner',
        subtitle: 'Alterna el flash',
        icon: Icons.flashlight_on,
        keywords: const ['linterna', 'flash'],
        onSelected: () {
          _onDestinationSelected(1);
          WidgetsBinding.instance.addPostFrameCallback((_) => _scannerKey.currentState?.toggleTorchExternally());
        },
      ),
      CommandEntry(
        title: 'Buscar en historial',
        subtitle: 'Filtra códigos anteriores',
        icon: Icons.search,
        keywords: const ['historial', 'buscar'],
        onSelected: () {
          _onDestinationSelected(2);
          WidgetsBinding.instance.addPostFrameCallback((_) => _historyKey.currentState?.focusSearchField());
        },
      ),
      CommandEntry(
        title: 'Historial favoritos',
        subtitle: 'Muestra solo los destacados',
        icon: Icons.star,
        keywords: const ['favoritos'],
        onSelected: () {
          _onDestinationSelected(2);
          WidgetsBinding.instance.addPostFrameCallback((_) => _historyKey.currentState?.enableFavoritesView());
        },
      ),
      CommandEntry(
        title: 'Historial con notas',
        subtitle: 'Entradas con anotaciones',
        icon: Icons.sticky_note_2,
        keywords: const ['notas'],
        onSelected: () {
          _onDestinationSelected(2);
          WidgetsBinding.instance.addPostFrameCallback((_) => _historyKey.currentState?.enableNotesView());
        },
      ),
    ];
    for (final template in appState.templates.take(6)) {
      commands.add(
        CommandEntry(
          title: 'Aplicar plantilla: ${template.title}',
          subtitle: template.description.isEmpty ? template.type.label : template.description,
          icon: Icons.bookmark,
          keywords: ['plantilla', template.title.toLowerCase(), template.type.label.toLowerCase()],
          onSelected: () {
            _onDestinationSelected(0);
            WidgetsBinding.instance.addPostFrameCallback((_) => _generatorKey.currentState?.applyTemplateExternally(template));
          },
        ),
      );
    }
    for (final entry in appState.history.take(6)) {
      commands.add(
        CommandEntry(
          title: 'Historial: ${entry.displayLabel.isEmpty ? entry.value : entry.displayLabel}',
          subtitle: DateFormat.yMd().add_Hm().format(entry.createdAt),
          icon: entry.type.isBarcode ? Icons.view_week : Icons.qr_code_2,
          keywords: ['historial', entry.type.label.toLowerCase(), entry.displayLabel.toLowerCase()],
          onSelected: () {
            _onDestinationSelected(2);
            WidgetsBinding.instance.addPostFrameCallback((_) => _historyKey.currentState?.openEntryById(entry.id));
          },
        ),
      );
    }
    return commands;
  }
}

class CommandEntry {
  CommandEntry({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onSelected,
    this.keywords = const <String>[],
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onSelected;
  final List<String> keywords;

  bool matches(String query) {
    if (query.isEmpty) return true;
    final lower = query.toLowerCase();
    return title.toLowerCase().contains(lower) ||
        subtitle.toLowerCase().contains(lower) ||
        keywords.any((word) => word.toLowerCase().contains(lower));
  }
}

enum FabIntent { none, generate, refresh, flashlight, batch, historyActions }

typedef FabIntentNotifier = ValueNotifier<FabIntent>;

class OpenCommandPaletteIntent extends Intent {
  const OpenCommandPaletteIntent();
}

class CopyPayloadIntent extends Intent {
  const CopyPayloadIntent();
}

class DownloadPayloadIntent extends Intent {
  const DownloadPayloadIntent();
}

class SearchHistoryIntent extends Intent {
  const SearchHistoryIntent();
}

class DeleteHistorySelectionIntent extends Intent {
  const DeleteHistorySelectionIntent();
}

class PauseScannerIntent extends Intent {
  const PauseScannerIntent();
}

class ToggleTorchIntent extends Intent {
  const ToggleTorchIntent();
}

class IncreaseScaleIntent extends Intent {
  const IncreaseScaleIntent();
}

class DecreaseScaleIntent extends Intent {
  const DecreaseScaleIntent();
}

class _FabSwitcher extends StatelessWidget {
  const _FabSwitcher({required this.intent});

  final FabIntent intent;

  @override
  Widget build(BuildContext context) {
    switch (intent) {
      case FabIntent.generate:
        return FloatingActionButton.extended(
          key: const ValueKey('fab-generate'),
          heroTag: 'fab-generate',
          onPressed: () => GeneratorDispatcher.of(context).generate(),
          icon: const Icon(Icons.auto_fix_high),
          label: const Text('Generar'),
        );
      case FabIntent.refresh:
        return FloatingActionButton.extended(
          key: const ValueKey('fab-refresh'),
          heroTag: 'fab-refresh',
          onPressed: () => GeneratorDispatcher.of(context).refresh(),
          icon: const Icon(Icons.refresh),
          label: const Text('Actualizar'),
        );
      case FabIntent.batch:
        return FloatingActionButton.extended(
          key: const ValueKey('fab-batch'),
          heroTag: 'fab-batch',
          onPressed: () => GeneratorDispatcher.of(context).batch(),
          icon: const Icon(Icons.playlist_add_check),
          label: const Text('Procesar lote'),
        );
      case FabIntent.flashlight:
        return FloatingActionButton.extended(
          key: const ValueKey('fab-light'),
          heroTag: 'fab-light',
          onPressed: () => ScannerDispatcher.of(context).toggleTorch(),
          icon: const Icon(Icons.bolt),
          label: const Text('Linterna'),
        );
      case FabIntent.historyActions:
        return FloatingActionButton.extended(
          key: const ValueKey('fab-history'),
          heroTag: 'fab-history',
          onPressed: () => HistoryDispatcher.of(context).toggleSelection(),
          icon: const Icon(Icons.select_all),
          label: const Text('Acciones'),
        );
      case FabIntent.none:
      default:
        return const SizedBox.shrink();
    }
  }
}

class GeneratorDispatcher extends InheritedWidget {
  const GeneratorDispatcher({
    super.key,
    required super.child,
    required this.generate,
    required this.refresh,
    required this.batch,
    required this.copy,
    required this.share,
    required this.download,
    required this.open,
  });

  final VoidCallback generate;
  final VoidCallback refresh;
  final VoidCallback batch;
  final VoidCallback copy;
  final VoidCallback share;
  final VoidCallback download;
  final VoidCallback open;

  static GeneratorDispatcher of(BuildContext context) {
    final dispatcher = context.dependOnInheritedWidgetOfExactType<GeneratorDispatcher>();
    assert(dispatcher != null);
    return dispatcher!;
  }

  @override
  bool updateShouldNotify(GeneratorDispatcher oldWidget) => true;
}

class ScannerDispatcher extends InheritedWidget {
  const ScannerDispatcher({super.key, required super.child, required this.toggleTorch});

  final VoidCallback toggleTorch;

  static ScannerDispatcher of(BuildContext context) {
    final dispatcher = context.dependOnInheritedWidgetOfExactType<ScannerDispatcher>();
    assert(dispatcher != null);
    return dispatcher!;
  }

  @override
  bool updateShouldNotify(ScannerDispatcher oldWidget) => true;
}

class HistoryDispatcher extends InheritedWidget {
  const HistoryDispatcher({super.key, required super.child, required this.toggleSelection});

  final VoidCallback toggleSelection;

  static HistoryDispatcher of(BuildContext context) {
    final dispatcher = context.dependOnInheritedWidgetOfExactType<HistoryDispatcher>();
    assert(dispatcher != null);
    return dispatcher!;
  }

  @override
  bool updateShouldNotify(HistoryDispatcher oldWidget) => true;
}
class GeneratorPage extends StatefulWidget {
  const GeneratorPage({super.key, required this.onFabIntentChanged});

  final FabIntentNotifier onFabIntentChanged;

  @override
  State<GeneratorPage> createState() => _GeneratorPageState();
}

class _GeneratorPageState extends State<GeneratorPage> with SingleTickerProviderStateMixin {
  final GlobalKey _previewKey = GlobalKey();
  final TextEditingController _labelController = TextEditingController(text: 'Escanéame');
  final TextEditingController _batchController = TextEditingController();
  final Map<GeneratorContentType, GeneratorFormState> _states = <GeneratorContentType, GeneratorFormState>{};
  final ValueNotifier<bool> _batchEnabled = ValueNotifier<bool>(false);
  GeneratorContentType _selectedType = GeneratorContentType.url;
  GeneratorPalette _palette = GeneratorPalette.midnight;
  Color _foreground = GeneratorPalette.midnight.foreground;
  Color _background = GeneratorPalette.midnight.background;
  double _quietZone = 4;
  int _exportScale = 2;
  bool _showLogo = false;
  double _logoScale = 0.18;
  Uint8List? _logoBytes;
  bool _skeleton = true;
  bool _isSharing = false;
  bool _isDownloading = false;
  GeneratorPalette? _customPalette;
  bool _defaultsResolved = false;
  bool _autoLivePreview = true;
  bool _previewDirty = false;
  String _previewPayload = '';
  Timer? _previewDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onFabIntentChanged.value = FabIntent.generate;
      Future<void>.delayed(const Duration(milliseconds: 600), () {
        if (mounted) setState(() => _skeleton = false);
      });
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_defaultsResolved) return;
    final state = AppStateScope.of(context);
    _palette = GeneratorPalette.fromId(state.defaultPalette);
    _foreground = _palette.foreground;
    _background = _palette.background;
    _quietZone = state.defaultQuietZone;
    _exportScale = state.defaultScale;
    _defaultsResolved = true;
    _schedulePreview(immediate: true);
  }

  @override
  void dispose() {
    _labelController.dispose();
    _batchController.dispose();
    _batchEnabled.dispose();
    _previewDebounce?.cancel();
    super.dispose();
  }

  GeneratorFormState _formState(GeneratorContentType type) {
    return _states.putIfAbsent(type, () => GeneratorFormState(type: type));
  }

  String _payloadFor(GeneratorContentType type) {
    return _formState(type).buildPayload();
  }

  void _schedulePreview({bool immediate = false}) {
    _previewDebounce?.cancel();
    void apply() {
      final payload = _payloadFor(_selectedType);
      if (!mounted) return;
      setState(() {
        _previewPayload = payload;
        _previewDirty = false;
      });
    }

    if (!_autoLivePreview && !immediate) {
      setState(() => _previewDirty = true);
      return;
    }

    if (immediate) {
      apply();
    } else {
      _previewDebounce = Timer(const Duration(milliseconds: 300), apply);
    }
  }

  void _toggleAutoPreview(bool value) {
    setState(() {
      _autoLivePreview = value;
      _previewDirty = false;
    });
    widget.onFabIntentChanged.value = value ? FabIntent.generate : FabIntent.refresh;
    if (value) {
      _schedulePreview(immediate: true);
    }
  }

  void _applyQuietZone(double value) {
    setState(() => _quietZone = value);
    AppStateScope.of(context).setDefaultQuietZone(value);
    _schedulePreview(immediate: true);
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final content = ListView(
      padding: EdgeInsets.only(bottom: media.padding.bottom + 160),
      children: [
        _buildPreviewCard(),
        _buildTypeSelector(),
        const SizedBox(height: 12),
        _buildTemplateStrip(),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildFormSections(),
        ),
        const SizedBox(height: 48),
      ],
    );
    return GeneratorDispatcher(
      generate: () => _handleGenerate(save: true),
      refresh: () => _handleGenerate(save: false),
      batch: _showBatchPreview,
      copy: _copyCurrent,
      share: _shareCurrent,
      download: _downloadCurrent,
      open: _openCurrent,
      child: Stack(
        children: [
          content,
          Positioned(
            right: 24,
            bottom: 24,
            child: FilledButton(
              onPressed: () => _handleGenerate(save: true),
              child: const Text('Generar ahora'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewCard() {
    final payload = _previewPayload;
    final hasData = payload.isNotEmpty;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: AnimatedSwitcher(
        duration: kMediumAnim,
        child: Card(
          key: ValueKey<String>('preview-$payload'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Vista previa', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 4),
                          Text(_selectedType.description, style: Theme.of(context).textTheme.bodyMedium),
                          if (_previewDirty)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Chip(
                                label: const Text('Actualiza para ver cambios'),
                                avatar: const Icon(Icons.refresh, size: 16),
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                        ],
                      ),
                    ),
                    FilledButton.tonal(onPressed: _saveTemplate, child: const Text('Guardar plantilla')),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
                child: Column(
                  children: [
                    RepaintBoundary(
                      key: _previewKey,
                      child: Container(
                        decoration: BoxDecoration(
                          color: _background,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 20, offset: const Offset(0, 10)),
                          ],
                        ),
                        padding: const EdgeInsets.all(24),
                        child: SizedBox(
                          width: kPreviewSize,
                          height: kPreviewSize,
                          child: _skeleton
                              ? const _PreviewSkeleton()
                              : AnimatedSwitcher(
                                  duration: kMediumAnim,
                                  child: hasData
                                      ? Hero(tag: 'previewHero', child: _selectedType.isBarcode ? _buildBarcode(payload) : _buildQr(payload))
                                      : const _PreviewEmptyState(),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _labelController,
                      textAlign: TextAlign.center,
                      decoration: const InputDecoration(labelText: 'Etiqueta opcional'),
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile.adaptive(
                      value: _autoLivePreview,
                      onChanged: _toggleAutoPreview,
                      title: const Text('Auto-actualizar QR al escribir'),
                      subtitle: const Text('Aplica cambios tras 300 ms'),
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 12),
                      _PreviewActions(
                        payload: payload,
                        onCopy: () => _copy(payload),
                        onShare: () => _share(payload),
                        onOpen: () => _open(payload),
                        onDownload: hasData ? _download : null,
                        shareLoading: _isSharing,
                        downloadLoading: _isDownloading,
                      ),
                    const SizedBox(height: 12),
                      ExpansionTile(
                        initiallyExpanded: true,
                        tilePadding: EdgeInsets.zero,
                        childrenPadding: EdgeInsets.zero,
                        title: Text('Apariencia', style: Theme.of(context).textTheme.titleMedium),
                        subtitle: const Text('Paleta, etiqueta y margen'),
                        children: [
                          _PaletteSelector(
                            palettes: [
                              ...GeneratorPalette.values,
                              if (_customPalette != null) _customPalette!,
                            ],
                            selected: _palette,
                            onChanged: (value) {
                              setState(() {
                                _palette = value;
                                _foreground = value.foreground;
                                _background = value.background;
                                if (value.id != 'custom') {
                                  _customPalette = null;
                                }
                              });
                              if (value.id != 'custom') {
                                AppStateScope.of(context).setDefaultPalette(value.id);
                              }
                              _schedulePreview(immediate: true);
                            },
                          ),
                          const SizedBox(height: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Quiet zone', style: Theme.of(context).textTheme.labelLarge),
                              Slider(
                                value: _quietZone,
                                min: 0,
                                max: 16,
                                divisions: 16,
                                label: _quietZone <= 0 ? 'Auto' : '${_quietZone.toStringAsFixed(0)} px',
                                onChanged: (value) {
                                  setState(() => _quietZone = value);
                                  AppStateScope.of(context).setDefaultQuietZone(value);
                                  _schedulePreview(immediate: true);
                                },
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                children: [
                                  _QuietZoneChip(label: 'Auto', value: 0, groupValue: _quietZone, onSelected: _applyQuietZone),
                                  _QuietZoneChip(label: '2', value: 2, groupValue: _quietZone, onSelected: _applyQuietZone),
                                  _QuietZoneChip(label: '4', value: 4, groupValue: _quietZone, onSelected: _applyQuietZone),
                                  _QuietZoneChip(label: '8', value: 8, groupValue: _quietZone, onSelected: _applyQuietZone),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Resolución exportación', style: Theme.of(context).textTheme.labelLarge),
                              Wrap(
                                spacing: 8,
                                children: [
                                  for (final scale in [2, 3])
                                    ChoiceChip(
                                      label: Text('${scale}x'),
                                      selected: _exportScale == scale,
                                      onSelected: (_) {
                                        setState(() => _exportScale = scale);
                                        AppStateScope.of(context).setDefaultScale(scale);
                                      },
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Logo', style: Theme.of(context).textTheme.labelLarge),
                                        SwitchListTile.adaptive(
                                          contentPadding: EdgeInsets.zero,
                                          value: _showLogo,
                                          onChanged: (value) async {
                                            setState(() => _showLogo = value);
                                            if (!value) {
                                              setState(() => _logoBytes = null);
                                            } else if (_logoBytes == null) {
                                              await _promptLogoSource();
                                            }
                                            _schedulePreview(immediate: true);
                                          },
                                          title: const Text('Mostrar logo'),
                                          subtitle: const Text('Centro del código (0–20%)'),
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(
                                    width: 160,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Tamaño', style: Theme.of(context).textTheme.labelSmall),
                                        Slider(
                                          value: _logoScale,
                                          min: 0.0,
                                          max: 0.2,
                                          divisions: 20,
                                          label: '${(_logoScale * 100).round()}%',
                                          onChanged: _showLogo
                                              ? (value) {
                                                  setState(() => _logoScale = value);
                                                  _schedulePreview();
                                                }
                                              : null,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 12,
                                runSpacing: 12,
                                children: [
                                  FilledButton.icon(
                                    onPressed: _showCustomColorDialog,
                                    icon: const Icon(Icons.palette),
                                    label: const Text('Personalizar colores'),
                                  ),
                                  OutlinedButton.icon(
                                    onPressed: _promptLogoSource,
                                    icon: const Icon(Icons.image_outlined),
                                    label: const Text('Logo desde URL/Base64'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQr(String payload) {
    final quiet = _quietZone <= 0 ? 12.0 : _quietZone;
    final logoSize = kPreviewSize * _logoScale;
    return Padding(
      padding: EdgeInsets.all(quiet),
      child: CustomPaint(
        painter: QrPainter(
          data: payload,
          version: QrVersions.auto,
          gapless: true,
          color: _foreground,
          emptyColor: _background,
          errorCorrectionLevel: QrErrorCorrectLevel.Q,
          eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square),
          dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square),
        ),
        child: Center(
          child: _showLogo && _logoBytes != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.memory(
                    _logoBytes!,
                    width: max(24, logoSize),
                    height: max(24, logoSize),
                    fit: BoxFit.cover,
                  ),
                )
              : null,
        ),
      ),
    );
  }

  Widget _buildBarcode(String payload) {
    final barcode = _selectedType == GeneratorContentType.barcodeEan13
        ? bw.Barcode.ean13(drawEndChar: true)
        : bw.Barcode.code128();
    return bw.BarcodeWidget(
      barcode: barcode,
      data: payload,
      color: _foreground,
      backgroundColor: _background,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    );
  }

  Widget _buildTypeSelector() {
    return StickyHeader(
      child: Container(
        color: Theme.of(context).scaffoldBackgroundColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: _SegmentedSelector(
          value: _selectedType,
          items: GeneratorContentType.values,
          onChanged: (value) {
            selectType(value);
          },
        ),
      ),
    );
  }

  Widget _buildTemplateStrip() {
    final templates = AppStateScope.of(context).templates;
    if (templates.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 118,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: templates.length,
        itemBuilder: (context, index) {
          final template = templates[index];
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () => _applyTemplate(template),
              child: Container(
                width: 220,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 14, offset: const Offset(0, 8)),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(template.type.icon, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            template.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      template.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFormSections() {
    final sections = _selectedType.sections;
    final formState = _formState(_selectedType);
    return Column(
      children: [
        for (final section in sections)
          _FormSection(
            section: section,
            state: formState,
            onChanged: () {
              setState(() {});
              _schedulePreview();
            },
          ),
        ValueListenableBuilder<bool>(
          valueListenable: _batchEnabled,
          builder: (context, enabled, _) {
            return ExpansionTile(
              leading: const Icon(Icons.playlist_add),
              title: const Text('Modo lote'),
              subtitle: const Text('Genera múltiples códigos desde una lista'),
              initiallyExpanded: enabled,
              onExpansionChanged: (value) => _batchEnabled.value = value,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _batchController,
                        decoration: const InputDecoration(
                          labelText: 'Entradas',
                          hintText: 'Pedido #{{n}}',
                        ),
                        maxLines: 6,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: () {
                              _batchController.text = 'Pedido #{{n}}\nPedido #{{n}}';
                            },
                            child: const Text('Ejemplo'),
                          ),
                          const SizedBox(width: 12),
                          FilledButton.tonal(onPressed: _showBatchPreview, child: const Text('Previsualizar')),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Future<void> _handleGenerate({required bool save}) async {
    final payload = _payloadFor(_selectedType);
    if (payload.isEmpty) {
      _notify('Completa los campos');
      return;
    }
    if (!save) {
      _schedulePreview(immediate: true);
      HapticFeedback.selectionClick();
      _notify('Vista previa actualizada');
      return;
    }
    if (save) {
      final entry = HistoryEntry(
        id: UniqueKey().toString(),
        type: _selectedType,
        value: payload,
        displayLabel: _labelController.text,
        createdAt: DateTime.now(),
        favorite: false,
        tags: _selectedType.autoTags,
        note: '',
        source: HistorySource.created,
        paletteId: _palette.id,
        quietZone: _quietZone,
      );
      await AppStateScope.of(context).addHistory(entry, force: true);
      _notify('Guardado en historial');
    }
    HapticFeedback.mediumImpact();
  }

  void _copyCurrent() {
    final payload = _previewPayload;
    if (payload.isEmpty) {
      _notify('Genera contenido para copiar');
      return;
    }
    _copy(payload);
  }

  void _shareCurrent() {
    final payload = _previewPayload;
    if (payload.isEmpty) {
      _notify('Genera contenido para compartir');
      return;
    }
    _share(payload);
  }

  void _openCurrent() {
    final payload = _previewPayload;
    if (payload.isEmpty) {
      _notify('Genera contenido para abrir');
      return;
    }
    _open(payload);
  }

  void _downloadCurrent() {
    final payload = _previewPayload;
    if (payload.isEmpty) {
      _notify('Genera contenido para exportar');
      return;
    }
    _download();
  }

  void copyCurrent() => _copyCurrent();
  void shareCurrent() => _shareCurrent();
  void openCurrent() => _openCurrent();
  void downloadCurrent() => _downloadCurrent();
  void refreshPreview() => _schedulePreview(immediate: true);
  void setAutoPreview(bool value) => _toggleAutoPreview(value);
  void selectType(GeneratorContentType type) {
    setState(() => _selectedType = type);
    widget.onFabIntentChanged.value = type.supportsBatch ? FabIntent.batch : FabIntent.generate;
    _schedulePreview(immediate: true);
  }
  void applyTemplateExternally(SavedTemplate template) {
    _applyTemplate(template);
  }
  void increaseExportScale() {
    if (_exportScale >= 3) return;
    setState(() => _exportScale = (_exportScale + 1).clamp(1, 3));
    AppStateScope.of(context).setDefaultScale(_exportScale);
  }

  void decreaseExportScale() {
    if (_exportScale <= 1) return;
    setState(() => _exportScale = (_exportScale - 1).clamp(1, 3));
    AppStateScope.of(context).setDefaultScale(_exportScale);
  }

  void openBatchMode() => _batchEnabled.value = true;

  Future<void> _saveTemplate() async {
    final payload = _payloadFor(_selectedType);
    if (payload.isEmpty) {
      _notify('Completa los campos para guardar');
      return;
    }
    final form = _formState(_selectedType);
    final titleController = TextEditingController(text: form.suggestedTemplateName());
    final descriptionController = TextEditingController(text: form.describe());
    final template = await showDialog<SavedTemplate>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Guardar plantilla'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Nombre')),
              const SizedBox(height: 12),
              TextField(controller: descriptionController, decoration: const InputDecoration(labelText: 'Descripción'), maxLines: 2),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(
                  SavedTemplate(
                    id: UniqueKey().toString(),
                    title: titleController.text.trim().isEmpty ? 'Plantilla sin título' : titleController.text.trim(),
                    description: descriptionController.text.trim(),
                    type: _selectedType,
                    stateJson: form.toJson(),
                    paletteId: _palette.id,
                    label: _labelController.text,
                    quietZone: _quietZone,
                    includeLogo: _showLogo,
                  ),
                );
              },
              child: const Text('Guardar'),
            ),
          ],
        );
      },
    );
    titleController.dispose();
    descriptionController.dispose();
    if (template != null) {
      await AppStateScope.of(context).addTemplate(template);
      _notify('Plantilla guardada');
    }
  }

  Future<void> _applyTemplate(SavedTemplate template) async {
    final state = GeneratorFormState.fromJson(template.type, template.stateJson);
    setState(() {
      _states[template.type] = state;
      _selectedType = template.type;
      _labelController.text = template.label ?? 'Escanéame';
      _quietZone = template.quietZone ?? _quietZone;
      _showLogo = template.includeLogo ?? false;
      _palette = GeneratorPalette.fromId(template.paletteId ?? GeneratorPalette.midnight.id);
      _foreground = _palette.foreground;
      _background = _palette.background;
      _customPalette = null;
      _exportScale = AppStateScope.of(context).defaultScale;
    });
    _notify('Plantilla aplicada');
    _schedulePreview(immediate: true);
  }

  Future<void> _copy(String payload) async {
    await FlutterClipboard.copy(payload);
    _notify('Copiado al portapapeles');
  }

  Future<void> _share(String payload) async {
    if (_selectedType.isSensitive) {
      final proceed = await _confirmSensitive();
      if (proceed != true) return;
    }
    setState(() => _isSharing = true);
    try {
      await Share.share(
        payload,
        subject: _labelController.text.isEmpty ? 'Código generado' : _labelController.text,
      );
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  Future<void> _open(String payload) async {
    final uri = _selectedType.tryParseUri(payload);
    if (uri == null) {
      _notify('Contenido copiado');
      await _copy(payload);
      return;
    }
    if (!isAllowedScheme(uri.scheme)) {
      _notify('Esquema no permitido');
      return;
    }
    if (_selectedType.isSensitive) {
      final proceed = await _confirmSensitive();
      if (proceed != true) return;
    }
    if (!await canLaunchUrl(uri)) {
      _notify('No se pudo abrir');
      return;
    }
    await launchUrl(uri, mode: LaunchMode.platformDefault);
  }

  Future<void> _download() async {
    setState(() => _isDownloading = true);
    final boundary = _previewKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) {
      _notify('No se pudo capturar');
      setState(() => _isDownloading = false);
      return;
    }
    final image = await boundary.toImage(pixelRatio: _exportScale.toDouble());
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    if (data == null) {
      _notify('Error al exportar');
      setState(() => _isDownloading = false);
      return;
    }
    final bytes = data.buffer.asUint8List();
    final filename = _composeFileName();
    if (kIsWeb) {
      final dataUrl = Uri.dataFromBytes(bytes, mimeType: 'image/png').toString();
      await Clipboard.setData(ClipboardData(text: dataUrl));
      _notify('Enlace de descarga copiado');
    } else {
      var status = await Permission.storage.request();
      if (!status.isGranted) {
        status = await Permission.photos.request();
      }
      if (!status.isGranted) {
        _notify('Permiso denegado');
        setState(() => _isDownloading = false);
        return;
      }
      final result = await ImageGallerySaver.saveImage(bytes, quality: 100, name: filename);
      if (result is Map && result['isSuccess'] == true) {
        _notify('Guardado en galería');
      } else {
        _notify('Fallo al guardar');
      }
    }
    if (mounted) {
      setState(() => _isDownloading = false);
    }
  }

    Future<void> _showCustomColorDialog() async {
      final fgController = TextEditingController(text: _formatColorHex(_foreground));
      final bgController = TextEditingController(text: _formatColorHex(_background));
      final formKey = GlobalKey<FormState>();
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Paleta personalizada'),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: fgController,
                    decoration: const InputDecoration(labelText: 'Color primer plano (HEX)'),
                    textCapitalization: TextCapitalization.characters,
                    validator: _validateHex,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: bgController,
                    decoration: const InputDecoration(labelText: 'Color fondo (HEX)'),
                    textCapitalization: TextCapitalization.characters,
                    validator: _validateHex,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
              FilledButton(
                onPressed: () {
                  if (formKey.currentState?.validate() ?? false) {
                    Navigator.of(context).pop(true);
                  }
                },
                child: const Text('Aplicar'),
              ),
            ],
          );
        },
      );
      if (confirmed != true) return;
      final fg = _parseHexColor(fgController.text.trim());
      final bg = _parseHexColor(bgController.text.trim());
      if (fg == null || bg == null) {
        _notify('Colores no válidos');
        return;
      }
      setState(() {
        _foreground = fg;
        _background = bg;
        _customPalette = GeneratorPalette.custom(fg, bg);
        _palette = _customPalette!;
      });
      _schedulePreview(immediate: true);
    }

    Future<void> _promptLogoSource() async {
      final controller = TextEditingController();
      final input = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Logo personalizado'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(hintText: 'URL https:// o cadena Base64'),
            maxLines: 3,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
            FilledButton(onPressed: () => Navigator.of(context).pop(controller.text.trim()), child: const Text('Cargar')),
          ],
        ),
      );
      if (input == null || input.isEmpty) {
        if (mounted) setState(() => _showLogo = false);
        return;
      }
      try {
        Uint8List? bytes;
        if (input.startsWith('http')) {
          final uri = Uri.parse(input);
          final bundle = NetworkAssetBundle(uri);
          final key = (uri.path.isEmpty ? '/' : uri.path) + (uri.hasQuery ? '?${uri.query}' : '');
          final data = await bundle.load(key);
          bytes = data.buffer.asUint8List();
        } else {
          bytes = base64Decode(input);
        }
        setState(() {
          _logoBytes = bytes;
          _showLogo = true;
        });
        _schedulePreview(immediate: true);
      } catch (_) {
        _notify('No se pudo cargar el logo');
        if (mounted) setState(() => _showLogo = false);
      }
    }

    String _formatColorHex(Color color) => color.value.toRadixString(16).padLeft(8, '0').substring(2).toUpperCase();

    String? _validateHex(String? value) {
      final input = value?.trim() ?? '';
      if (input.isEmpty) return 'Ingresa un color válido';
      return _parseHexColor(input) == null ? 'Formato inválido' : null;
    }

    Color? _parseHexColor(String input) {
      final sanitized = input.replaceAll('#', '');
      if (sanitized.length != 6) return null;
      final value = int.tryParse(sanitized, radix: 16);
      if (value == null) return null;
      return Color(0xFF000000 | value);
    }

  String _composeFileName() {
    final now = DateTime.now();
    final pattern = AppStateScope.of(context).defaultFileName;
    final slug = _labelController.text.trim().isEmpty
        ? _selectedType.name
        : _labelController.text.trim().toLowerCase().replaceAll(RegExp('[^a-z0-9]+'), '-');
    return pattern
        .replaceAll('{type}', _selectedType.name)
        .replaceAll('{date}', '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}')
        .replaceAll('{slug}', slug.isEmpty ? 'codigo' : slug);
  }

  Future<void> _showBatchPreview() async {
    final payload = _batchController.text.trim();
    if (payload.isEmpty) {
      _notify('Introduce entradas para lote');
      return;
    }
    final entries = _parseBatch(payload);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final previewItems = entries.take(3).toList();
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Row(
                    children: [
                      Text('Previsualización', style: Theme.of(context).textTheme.titleLarge),
                      const Spacer(),
                      Text('${entries.length} elementos'),
                    ],
                  ),
                ),
                if (previewItems.isNotEmpty)
                  SizedBox(
                    height: 260,
                    child: PageView.builder(
                      itemCount: previewItems.length,
                      controller: PageController(viewportFraction: 0.8),
                      itemBuilder: (context, index) {
                        final item = previewItems[index];
                        final payload = item.payload;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Hero(
                            tag: 'batch_preview_$index',
                            child: Material(
                              elevation: 3,
                              borderRadius: BorderRadius.circular(24),
                              clipBehavior: Clip.antiAlias,
                              child: Container(
                                color: Theme.of(context).colorScheme.surface,
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Expanded(
                                      child: AspectRatio(
                                        aspectRatio: 1,
                                        child: _selectedType.isBarcode
                                            ? _buildBarcode(payload)
                                            : RepaintBoundary(
                                                child: _buildQr(payload),
                                              ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      item.label ?? 'Elemento ${index + 1}',
                                      style: Theme.of(context).textTheme.titleSmall,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                Expanded(
                  child: ListView.builder(
                    itemCount: entries.length,
                    itemBuilder: (context, index) {
                      final entry = entries[index];
                      return ListTile(
                        leading: CircleAvatar(child: Text('${index + 1}')),
                        title: Text(entry.payload, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(entry.label ?? ''),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: FilledButton(
                    onPressed: () async {
                      Navigator.of(context).pop();
                      await _processBatch(entries);
                    },
                    child: const Text('Generar lote'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  List<BatchEntry> _parseBatch(String payload) {
    final lines = payload.split(RegExp(r'\r?\n')).where((element) => element.trim().isNotEmpty).toList();
    final List<BatchEntry> entries = <BatchEntry>[];
    for (var i = 0; i < lines.length; i++) {
      final n = i + 1;
      entries.add(BatchEntry(payload: lines[i].replaceAll('{{n}}', '$n'), label: 'Lote $n'));
    }
    return entries;
  }

  Future<void> _processBatch(List<BatchEntry> entries) async {
    if (entries.isEmpty) {
      _notify('No hay elementos válidos');
      return;
    }
    final progress = ValueNotifier<int>(0);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text('Generando lote'),
          content: ValueListenableBuilder<int>(
            valueListenable: progress,
            builder: (context, value, _) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  LinearProgressIndicator(value: entries.isEmpty ? 0 : value / entries.length),
                  const SizedBox(height: 12),
                  Text('$value de ${entries.length} listos'),
                ],
              );
            },
          ),
        );
      },
    );
    final failures = <BatchEntry>[];
    final successes = <HistoryEntry>[];
    for (var i = 0; i < entries.length; i++) {
      final rawEntry = entries[i];
      final payload = _sanitizeBatchPayload(rawEntry.payload);
      if (payload == null) {
        failures.add(rawEntry);
      } else {
        final history = HistoryEntry(
          id: UniqueKey().toString(),
          type: _selectedType,
          value: payload,
          displayLabel: rawEntry.label ?? 'Lote ${i + 1}',
          createdAt: DateTime.now(),
          favorite: false,
          tags: <String>['lote', ..._selectedType.autoTags],
          note: '',
          source: HistorySource.created,
          paletteId: _palette.id,
          quietZone: _quietZone,
        );
        await AppStateScope.of(context).addHistory(history, force: true);
        successes.add(history);
      }
      progress.value = i + 1;
      if ((i + 1) % 8 == 0) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
      }
    }
    if (mounted) Navigator.of(context).pop();
    progress.dispose();
    if (!mounted) return;
    final summary = 'Generados ${successes.length} · Omitidos ${failures.length}';
    _notify(summary);
    if (failures.isNotEmpty) {
      await showDialog<void>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Algunos elementos fallaron'),
            content: SizedBox(
              width: double.maxFinite,
              child: ListView(
                shrinkWrap: true,
                children: failures
                    .map(
                      (entry) => ListTile(
                        title: Text(entry.payload, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(entry.label ?? 'Sin etiqueta'),
                      ),
                    )
                    .toList(),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cerrar')),
              FilledButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _processBatch(failures);
                },
                child: const Text('Reintentar fallidos'),
              ),
            ],
          );
        },
      );
    }
  }

  String? _sanitizeBatchPayload(String payload) {
    switch (_selectedType) {
      case GeneratorContentType.barcodeEan13:
        final digits = payload.replaceAll(RegExp('[^0-9]'), '');
        if (_validateEan13(digits) != null) {
          return null;
        }
        if (digits.length == 12) {
          final checksum = _calculateEan13Checksum(digits);
          return '$digits$checksum';
        }
        return digits;
      case GeneratorContentType.url:
        if (_validateUrl(payload) != null) return null;
        return payload;
      case GeneratorContentType.phone:
      case GeneratorContentType.sms:
        if (_validatePhone(payload) != null) return null;
        return payload;
      default:
        return payload;
    }
  }

  int _calculateEan13Checksum(String digits) {
    final numbers = digits.split('').map(int.parse).toList();
    var sum = 0;
    for (var i = 0; i < numbers.length; i++) {
      sum += numbers[i] * (i.isEven ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  }

  Future<bool?> _confirmSensitive() {
    return showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Contenido sensible'),
          content: const Text('Compartirás datos delicados (Wi-Fi, teléfono...). ¿Continuar?'),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
            ElevatedButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Compartir')),
          ],
        );
      },
    );
  }

  void _notify(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Row(children: [const Icon(Icons.check_circle_outline), const SizedBox(width: 12), Expanded(child: Text(message))])),
    );
  }
}

class _PreviewSkeleton extends StatefulWidget {
  const _PreviewSkeleton();

  @override
  State<_PreviewSkeleton> createState() => _PreviewSkeletonState();
}

class _PreviewSkeletonState extends State<_PreviewSkeleton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
                Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
                Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
              ],
              stops: [(_controller.value - 0.2).clamp(0.0, 1.0), _controller.value, (_controller.value + 0.2).clamp(0.0, 1.0)],
            ),
          ),
        );
      },
    );
  }
}

class _PreviewEmptyState extends StatelessWidget {
  const _PreviewEmptyState();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.qr_code_2, size: 72, color: Theme.of(context).colorScheme.outline),
        const SizedBox(height: 12),
        Text('Completa los campos para ver el código', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
      ],
    );
  }
}
class StickyHeader extends StatelessWidget {
  const StickyHeader({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      elevation: 3,
      shadowColor: Colors.black12,
      child: child,
    );
  }
}

class _SegmentedSelector extends StatelessWidget {
  const _SegmentedSelector({required this.value, required this.items, required this.onChanged});

  final GeneratorContentType value;
  final List<GeneratorContentType> items;
  final ValueChanged<GeneratorContentType> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: items.map((item) {
        final selected = item == value;
        return ChoiceChip(
          avatar: Icon(item.icon, size: 18),
          label: Text(item.label),
          selected: selected,
          onSelected: (_) => onChanged(item),
        );
      }).toList(),
    );
  }
}

class _PaletteSelector extends StatelessWidget {
  const _PaletteSelector({required this.palettes, required this.selected, required this.onChanged});

  final List<GeneratorPalette> palettes;
  final GeneratorPalette selected;
  final ValueChanged<GeneratorPalette> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemBuilder: (context, index) {
          final palette = palettes[index];
          final isSelected = palette == selected;
          return GestureDetector(
            onTap: () => onChanged(palette),
            child: AnimatedContainer(
              duration: kShortAnim,
              width: 96,
              decoration: BoxDecoration(
                color: palette.background,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isSelected ? Theme.of(context).colorScheme.primary : Colors.transparent,
                  width: 2,
                ),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 8))],
              ),
              child: Stack(
                children: [
                  Align(alignment: Alignment.center, child: Icon(Icons.qr_code_2, color: palette.foreground)),
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Icon(
                      isSelected ? Icons.check_circle : Icons.circle_outlined,
                      size: 20,
                      color: palette.foreground,
                    ),
                  ),
                  Positioned(
                    bottom: 6,
                    left: 8,
                    right: 8,
                    child: Text(
                      palette.title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(color: palette.foreground, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemCount: palettes.length,
      ),
    );
  }
}

class _FormSection extends StatefulWidget {
  const _FormSection({required this.section, required this.state, required this.onChanged});

  final GeneratorSection section;
  final GeneratorFormState state;
  final VoidCallback onChanged;

  @override
  State<_FormSection> createState() => _FormSectionState();
}

class _FormSectionState extends State<_FormSection> {
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    _expanded = widget.section.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: _expanded,
          onExpansionChanged: (value) => setState(() => _expanded = value),
          leading: Icon(widget.section.icon),
          title: Text(widget.section.title, style: Theme.of(context).textTheme.titleMedium),
          subtitle: Text(widget.section.subtitle),
          childrenPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            for (final field in widget.section.fields)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _GeneratorField(field: field, state: widget.state, onChanged: widget.onChanged),
              ),
          ],
        ),
      ),
    );
  }
}

class _GeneratorField extends StatefulWidget {
  const _GeneratorField({required this.field, required this.state, required this.onChanged});

  final GeneratorField field;
  final GeneratorFormState state;
  final VoidCallback onChanged;

  @override
  State<_GeneratorField> createState() => _GeneratorFieldState();
}

class _GeneratorFieldState extends State<_GeneratorField> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.state.getValue(widget.field.id));
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) {
        _validate();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _validate() {
    final validator = widget.field.validator;
    if (validator != null) {
      setState(() => _error = validator(_controller.text));
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (widget.field.kind) {
      case GeneratorFieldKind.choice:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.field.label, style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: widget.field.options!.map((option) {
                final selected = widget.state.getValue(widget.field.id) == option.value;
                return FilterChip(
                  label: Text(option.label),
                  selected: selected,
                  onSelected: (_) {
                    widget.state.setValue(widget.field.id, option.value);
                    widget.onChanged();
                  },
                );
              }).toList(),
            ),
          ],
        );
      case GeneratorFieldKind.switcher:
        final value = widget.state.getValue(widget.field.id) == 'true';
        return SwitchListTile(
          title: Text(widget.field.label),
          subtitle: widget.field.hint != null ? Text(widget.field.hint!) : null,
          value: value,
          onChanged: (newValue) {
            widget.state.setValue(widget.field.id, newValue ? 'true' : 'false');
            widget.onChanged();
          },
        );
      case GeneratorFieldKind.multiline:
      case GeneratorFieldKind.text:
      default:
        final isMultiline = widget.field.kind == GeneratorFieldKind.multiline;
        return TextField(
          controller: _controller,
          focusNode: _focusNode,
          keyboardType: widget.field.keyboardType,
          maxLines: isMultiline ? 4 : 1,
          onChanged: (value) {
            widget.state.setValue(widget.field.id, value);
            widget.onChanged();
          },
          decoration: InputDecoration(
            labelText: widget.field.label,
            hintText: widget.field.hint,
            errorText: _error,
          ),
        );
    }
  }
}
class _PreviewActions extends StatelessWidget {
  const _PreviewActions({
    required this.payload,
    required this.onCopy,
    required this.onShare,
    required this.onOpen,
    required this.onDownload,
    required this.shareLoading,
    required this.downloadLoading,
  });

  final String payload;
  final VoidCallback onCopy;
  final VoidCallback onShare;
  final VoidCallback onOpen;
  final VoidCallback? onDownload;
  final bool shareLoading;
  final bool downloadLoading;

  @override
  Widget build(BuildContext context) {
    final actions = <_PreviewActionItem>[
      _PreviewActionItem(icon: Icons.copy_all, label: 'Copiar', tooltip: 'Copiar contenido', onTap: onCopy),
      _PreviewActionItem(icon: Icons.ios_share, label: 'Compartir', tooltip: 'Compartir código', onTap: onShare, loading: shareLoading),
      _PreviewActionItem(icon: Icons.open_in_new, label: 'Abrir', tooltip: 'Abrir destino seguro', onTap: onOpen),
      _PreviewActionItem(icon: Icons.download, label: 'Descargar', tooltip: 'Guardar PNG', onTap: onDownload, loading: downloadLoading),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: actions.map((item) => _PreviewActionButton(item: item)).toList(),
    );
  }
}

class _PreviewActionItem {
  _PreviewActionItem({required this.icon, required this.label, required this.tooltip, required this.onTap, this.loading = false});

  final IconData icon;
  final String label;
  final String tooltip;
  final VoidCallback? onTap;
  final bool loading;
}

class _PreviewActionButton extends StatelessWidget {
  const _PreviewActionButton({required this.item});

  final _PreviewActionItem item;

  @override
  Widget build(BuildContext context) {
    final enabled = item.onTap != null && !item.loading;
    return Tooltip(
      message: item.tooltip,
      child: Semantics(
        button: true,
        label: item.tooltip,
        child: InkWell(
          onTap: enabled ? item.onTap : null,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: kShortAnim,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: enabled
                  ? Theme.of(context).colorScheme.secondaryContainer.withOpacity(0.4)
                  : Theme.of(context).disabledColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                item.loading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                        ),
                      )
                    : Icon(item.icon, color: enabled ? Theme.of(context).colorScheme.primary : Theme.of(context).disabledColor),
                const SizedBox(height: 4),
                Text(item.label, style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuietZoneChip extends StatelessWidget {
  const _QuietZoneChip({required this.label, required this.value, required this.groupValue, required this.onSelected});

  final String label;
  final double value;
  final double groupValue;
  final ValueChanged<double> onSelected;

  @override
  Widget build(BuildContext context) {
    final selected = (groupValue - value).abs() < 0.01;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(value),
    );
  }
}
enum GeneratorFieldKind { text, multiline, choice, switcher }

typedef FieldValidator = String? Function(String value);

class GeneratorOption {
  const GeneratorOption({required this.label, required this.value});

  final String label;
  final String value;
}

class GeneratorField {
  const GeneratorField({
    required this.id,
    required this.label,
    this.hint,
    this.kind = GeneratorFieldKind.text,
    this.options,
    this.validator,
    this.keyboardType,
  });

  final String id;
  final String label;
  final String? hint;
  final GeneratorFieldKind kind;
  final List<GeneratorOption>? options;
  final FieldValidator? validator;
  final TextInputType? keyboardType;
}

class GeneratorSection {
  const GeneratorSection({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.fields,
    this.initiallyExpanded = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<GeneratorField> fields;
  final bool initiallyExpanded;
}

enum GeneratorContentType {
  url,
  text,
  wifi,
  vcard,
  event,
  phone,
  sms,
  email,
  geo,
  barcodeEan13,
  barcodeCode128,
}

extension GeneratorContentTypeX on GeneratorContentType {
  String get label {
    switch (this) {
      case GeneratorContentType.url:
        return 'URL';
      case GeneratorContentType.text:
        return 'Texto';
      case GeneratorContentType.wifi:
        return 'Wi-Fi';
      case GeneratorContentType.vcard:
        return 'vCard';
      case GeneratorContentType.event:
        return 'Evento';
      case GeneratorContentType.phone:
        return 'Teléfono';
      case GeneratorContentType.sms:
        return 'SMS';
      case GeneratorContentType.email:
        return 'Email';
      case GeneratorContentType.geo:
        return 'Geo';
      case GeneratorContentType.barcodeEan13:
        return 'EAN-13';
      case GeneratorContentType.barcodeCode128:
        return 'Code128';
    }
  }

  String get description {
    switch (this) {
      case GeneratorContentType.url:
        return 'Comparte un enlace con análisis de seguridad local.';
      case GeneratorContentType.text:
        return 'Texto libre ideal para mensajes rápidos.';
      case GeneratorContentType.wifi:
        return 'Credenciales Wi-Fi con confirmación antes de compartir.';
      case GeneratorContentType.vcard:
        return 'Tarjeta de contacto con botones inteligentes tras escanear.';
      case GeneratorContentType.event:
        return 'Invita a eventos con fechas y ubicación.';
      case GeneratorContentType.phone:
        return 'Número telefónico listo para llamar.';
      case GeneratorContentType.sms:
        return 'Mensaje SMS prellenado.';
      case GeneratorContentType.email:
        return 'Correo con asunto y cuerpo preparados.';
      case GeneratorContentType.geo:
        return 'Coordenadas geográficas para mapas.';
      case GeneratorContentType.barcodeEan13:
        return 'Código de barras EAN-13 con validación.';
      case GeneratorContentType.barcodeCode128:
        return 'Código de barras Code128 universal.';
    }
  }

  IconData get icon {
    switch (this) {
      case GeneratorContentType.url:
        return Icons.link;
      case GeneratorContentType.text:
        return Icons.notes;
      case GeneratorContentType.wifi:
        return Icons.wifi;
      case GeneratorContentType.vcard:
        return Icons.badge;
      case GeneratorContentType.event:
        return Icons.event;
      case GeneratorContentType.phone:
        return Icons.phone;
      case GeneratorContentType.sms:
        return Icons.sms;
      case GeneratorContentType.email:
        return Icons.email;
      case GeneratorContentType.geo:
        return Icons.place;
      case GeneratorContentType.barcodeEan13:
        return Icons.view_week;
      case GeneratorContentType.barcodeCode128:
        return Icons.align_horizontal_center;
    }
  }

  bool get isSensitive {
    switch (this) {
      case GeneratorContentType.wifi:
      case GeneratorContentType.phone:
      case GeneratorContentType.sms:
        return true;
      default:
        return false;
    }
  }

  bool get isBarcode => this == GeneratorContentType.barcodeEan13 || this == GeneratorContentType.barcodeCode128;

  bool get supportsBatch => !isSensitive;

  String get groupLabel => isBarcode ? 'Barras' : label;

  List<String> get autoTags {
    final tags = <String>[label];
    if (isBarcode) tags.add('barcode');
    return tags;
  }

  List<GeneratorSection> get sections {
    switch (this) {
      case GeneratorContentType.url:
        return [
          GeneratorSection(
            title: 'Enlace seguro',
            subtitle: 'Validamos esquemas y dominios sospechosos',
            icon: Icons.link,
            initiallyExpanded: true,
            fields: [
              GeneratorField(
                id: 'url',
                label: 'URL',
                hint: 'https://ejemplo.com',
                validator: _validateUrl,
                keyboardType: TextInputType.url,
              ),
              GeneratorField(id: 'utm_source', label: 'UTM Source', hint: 'newsletter'),
              GeneratorField(id: 'utm_medium', label: 'UTM Medium'),
              GeneratorField(id: 'utm_campaign', label: 'UTM Campaign'),
            ],
          ),
        ];
      case GeneratorContentType.text:
        return [
          GeneratorSection(
            title: 'Mensaje',
            subtitle: 'Texto libre con contador',
            icon: Icons.notes,
            initiallyExpanded: true,
            fields: [
              GeneratorField(
                id: 'text',
                label: 'Contenido',
                kind: GeneratorFieldKind.multiline,
                hint: 'Escribe tu mensaje',
              ),
            ],
          ),
        ];
      case GeneratorContentType.wifi:
        return [
          GeneratorSection(
            title: 'Red Wi-Fi',
            subtitle: 'Comparte con invitados de forma segura',
            icon: Icons.wifi,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'ssid', label: 'SSID', hint: 'Nombre de la red', validator: _required),
              GeneratorField(
                id: 'security',
                label: 'Seguridad',
                kind: GeneratorFieldKind.choice,
                options: const [
                  GeneratorOption(label: 'WPA/WPA2', value: 'WPA'),
                  GeneratorOption(label: 'WEP', value: 'WEP'),
                  GeneratorOption(label: 'Sin contraseña', value: 'nopass'),
                ],
              ),
              GeneratorField(id: 'password', label: 'Contraseña', hint: 'Mínimo 8 caracteres'),
              GeneratorField(id: 'hidden', label: 'Red oculta', kind: GeneratorFieldKind.switcher),
            ],
          ),
        ];
      case GeneratorContentType.vcard:
        return [
          GeneratorSection(
            title: 'Perfil profesional',
            subtitle: 'Completa tu tarjeta de presentación',
            icon: Icons.badge,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'name', label: 'Nombre completo', validator: _required),
              GeneratorField(id: 'company', label: 'Empresa'),
              GeneratorField(id: 'role', label: 'Cargo'),
              GeneratorField(id: 'phone', label: 'Teléfono', keyboardType: TextInputType.phone),
              GeneratorField(id: 'email', label: 'Email', keyboardType: TextInputType.emailAddress, validator: _validateEmailOptional),
              GeneratorField(id: 'website', label: 'Sitio web', keyboardType: TextInputType.url),
              GeneratorField(id: 'address', label: 'Dirección', kind: GeneratorFieldKind.multiline),
              GeneratorField(id: 'notes', label: 'Notas', kind: GeneratorFieldKind.multiline),
            ],
          ),
        ];
      case GeneratorContentType.event:
        return [
          GeneratorSection(
            title: 'Detalles del evento',
            subtitle: 'Información lista para añadir al calendario',
            icon: Icons.event,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'title', label: 'Título', validator: _required),
              GeneratorField(id: 'start', label: 'Inicio (YYYY-MM-DD HH:MM)', hint: '2024-05-01 20:30'),
              GeneratorField(id: 'end', label: 'Fin (YYYY-MM-DD HH:MM)'),
              GeneratorField(id: 'location', label: 'Ubicación'),
              GeneratorField(id: 'description', label: 'Descripción', kind: GeneratorFieldKind.multiline),
            ],
          ),
        ];
      case GeneratorContentType.phone:
        return [
          GeneratorSection(
            title: 'Número a llamar',
            subtitle: 'Solicitaremos confirmación antes de compartir',
            icon: Icons.phone,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'phone', label: 'Número', hint: '+34900111222', validator: _validatePhone, keyboardType: TextInputType.phone),
            ],
          ),
        ];
      case GeneratorContentType.sms:
        return [
          GeneratorSection(
            title: 'Mensaje SMS',
            subtitle: 'Número y texto prellenado',
            icon: Icons.sms,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'phone', label: 'Número', validator: _validatePhone, keyboardType: TextInputType.phone),
              GeneratorField(id: 'message', label: 'Mensaje', kind: GeneratorFieldKind.multiline),
            ],
          ),
        ];
      case GeneratorContentType.email:
        return [
          GeneratorSection(
            title: 'Correo electrónico',
            subtitle: 'Asunto y cuerpo opcionales',
            icon: Icons.email,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'email', label: 'Para', validator: _validateEmail, keyboardType: TextInputType.emailAddress),
              GeneratorField(id: 'subject', label: 'Asunto'),
              GeneratorField(id: 'body', label: 'Mensaje', kind: GeneratorFieldKind.multiline),
            ],
          ),
        ];
      case GeneratorContentType.geo:
        return [
          GeneratorSection(
            title: 'Ubicación',
            subtitle: 'Coordenadas geográficas',
            icon: Icons.place,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'lat', label: 'Latitud', keyboardType: const TextInputType.numberWithOptions(decimal: true)),
              GeneratorField(id: 'lng', label: 'Longitud', keyboardType: const TextInputType.numberWithOptions(decimal: true)),
            ],
          ),
        ];
      case GeneratorContentType.barcodeEan13:
        return [
          GeneratorSection(
            title: 'Código de barras EAN-13',
            subtitle: 'Validamos longitud y dígito de control',
            icon: Icons.view_week,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'ean', label: 'Número EAN-13', hint: '12 o 13 dígitos', validator: _validateEan13, keyboardType: TextInputType.number),
            ],
          ),
        ];
      case GeneratorContentType.barcodeCode128:
        return [
          GeneratorSection(
            title: 'Código Code128',
            subtitle: 'Cualquier combinación alfanumérica',
            icon: Icons.align_horizontal_center,
            initiallyExpanded: true,
            fields: [
              GeneratorField(id: 'value', label: 'Contenido', validator: _required),
            ],
          ),
        ];
    }
  }

  Uri? tryParseUri(String payload) {
    try {
      if (this == GeneratorContentType.url || this == GeneratorContentType.email || this == GeneratorContentType.phone || this == GeneratorContentType.sms || this == GeneratorContentType.geo) {
        return Uri.parse(payload);
      }
      return Uri.tryParse(payload);
    } catch (_) {
      return null;
    }
  }
}

String? _required(String value) {
  if (value.trim().isEmpty) {
    return 'Campo obligatorio';
  }
  return null;
}

String? _validateUrl(String value) {
  if (value.trim().isEmpty) return 'Introduce un enlace';
  if (value.startsWith('javascript:') || value.startsWith('data:')) {
    return 'Esquema no permitido';
  }
  final uri = Uri.tryParse(value);
  if (uri == null || !(uri.isScheme('http') || uri.isScheme('https'))) {
    return 'Debe ser http o https';
  }
  if (uri.host.isEmpty) {
    return 'Dominio requerido';
  }
  return null;
}

String? _validateEmail(String value) {
  if (value.trim().isEmpty) return 'Introduce un correo';
  final regex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
  if (!regex.hasMatch(value.trim())) return 'Correo no válido';
  return null;
}

String? _validateEmailOptional(String value) {
  if (value.trim().isEmpty) return null;
  return _validateEmail(value);
}

String? _validatePhone(String value) {
  final clean = value.trim();
  if (clean.isEmpty) return 'Introduce un número';
  final regex = RegExp(r'^\+?[0-9 ]{6,}$');
  if (!regex.hasMatch(clean)) return 'Número no válido';
  return null;
}

String? _validateEan13(String value) {
  final digits = value.replaceAll(RegExp('[^0-9]'), '');
  if (digits.length < 12 || digits.length > 13) {
    return 'Debe tener 12 o 13 dígitos';
  }
  return null;
}

class GeneratorFormState {
  GeneratorFormState({required this.type});

  final GeneratorContentType type;
  final Map<String, String> _values = <String, String>{};

  factory GeneratorFormState.fromJson(GeneratorContentType type, Map<String, dynamic>? json) {
    final state = GeneratorFormState(type: type);
    if (json != null) {
      json.forEach((key, value) {
        state._values[key] = value?.toString() ?? '';
      });
    }
    return state;
  }

  Map<String, dynamic> toJson() => Map<String, String>.from(_values);

  String getValue(String key) => _values[key] ?? '';

  void setValue(String key, String value) {
    _values[key] = value;
  }

  String buildPayload() {
    switch (type) {
      case GeneratorContentType.url:
        final url = getValue('url');
        final uri = Uri.tryParse(url);
        if (uri == null) return '';
        final query = Map<String, String>.from(uri.queryParameters);
        void addParam(String key, String field) {
          final value = getValue(field);
          if (value.trim().isNotEmpty) {
            query[key] = value.trim();
          }
        }
        addParam('utm_source', 'utm_source');
        addParam('utm_medium', 'utm_medium');
        addParam('utm_campaign', 'utm_campaign');
        final cleanUri = uri.replace(queryParameters: query.isEmpty ? null : query);
        return cleanUri.toString();
      case GeneratorContentType.text:
        return getValue('text');
      case GeneratorContentType.wifi:
        final ssid = getValue('ssid');
        if (ssid.isEmpty) return '';
        final security = getValue('security').isEmpty ? 'WPA' : getValue('security');
        final password = getValue('password');
        final hidden = getValue('hidden') == 'true';
        if (security != 'nopass' && password.length < 8) {
          return '';
        }
        return 'WIFI:T:$security;S:$ssid;P:$password;H:${hidden ? 'true' : 'false'};;';
      case GeneratorContentType.vcard:
        final name = getValue('name');
        if (name.isEmpty) return '';
        final buffer = StringBuffer('BEGIN:VCARD\nVERSION:3.0\nFN:$name\n');
        void addLine(String prefix, String field) {
          final value = getValue(field);
          if (value.trim().isNotEmpty) {
            buffer.writeln('$prefix:$value');
          }
        }
        addLine('ORG', 'company');
        addLine('TITLE', 'role');
        addLine('TEL', 'phone');
        addLine('EMAIL', 'email');
        addLine('URL', 'website');
        addLine('ADR', 'address');
        addLine('NOTE', 'notes');
        buffer.write('END:VCARD');
        return buffer.toString();
      case GeneratorContentType.event:
        final title = getValue('title');
        if (title.isEmpty) return '';
        final start = _formatDateTime(getValue('start'));
        final end = _formatDateTime(getValue('end'));
        final buffer = StringBuffer('BEGIN:VEVENT\nSUMMARY:$title\n');
        if (start != null) buffer.writeln('DTSTART:$start');
        if (end != null) buffer.writeln('DTEND:$end');
        final location = getValue('location');
        if (location.isNotEmpty) buffer.writeln('LOCATION:$location');
        final description = getValue('description');
        if (description.isNotEmpty) buffer.writeln('DESCRIPTION:$description');
        buffer.write('END:VEVENT');
        return 'BEGIN:VCALENDAR\nVERSION:2.0\n${buffer.toString()}\nEND:VCALENDAR';
      case GeneratorContentType.phone:
        final phone = getValue('phone');
        return phone.isEmpty ? '' : 'tel:$phone';
      case GeneratorContentType.sms:
        final phone = getValue('phone');
        if (phone.isEmpty) return '';
        final message = Uri.encodeComponent(getValue('message'));
        return 'sms:$phone?body=$message';
      case GeneratorContentType.email:
        final email = getValue('email');
        if (email.isEmpty) return '';
        final subject = Uri.encodeComponent(getValue('subject'));
        final body = Uri.encodeComponent(getValue('body'));
        final query = <String>[];
        if (subject.isNotEmpty) query.add('subject=$subject');
        if (body.isNotEmpty) query.add('body=$body');
        final suffix = query.isEmpty ? '' : '?${query.join('&')}';
        return 'mailto:$email$suffix';
      case GeneratorContentType.geo:
        final lat = getValue('lat');
        final lng = getValue('lng');
        if (lat.isEmpty || lng.isEmpty) return '';
        return 'geo:$lat,$lng';
      case GeneratorContentType.barcodeEan13:
        final digits = getValue('ean').replaceAll(RegExp('[^0-9]'), '');
        if (digits.length == 12) {
          return digits + _computeEan13CheckDigit(digits);
        }
        return digits.length == 13 ? digits : '';
      case GeneratorContentType.barcodeCode128:
        return getValue('value');
    }
  }

  String suggestedTemplateName() {
    switch (type) {
      case GeneratorContentType.url:
        return 'Enlace seguro';
      case GeneratorContentType.text:
        return 'Nota rápida';
      case GeneratorContentType.wifi:
        return 'Wi-Fi invitados';
      case GeneratorContentType.vcard:
        return 'Contacto profesional';
      case GeneratorContentType.event:
        return 'Evento especial';
      case GeneratorContentType.phone:
        return 'Teléfono directo';
      case GeneratorContentType.sms:
        return 'SMS automático';
      case GeneratorContentType.email:
        return 'Correo predefinido';
      case GeneratorContentType.geo:
        return 'Ubicación favorita';
      case GeneratorContentType.barcodeEan13:
        return 'SKU EAN';
      case GeneratorContentType.barcodeCode128:
        return 'Etiqueta logística';
    }
  }

  String describe() {
    switch (type) {
      case GeneratorContentType.url:
        final uri = Uri.tryParse(getValue('url'));
        return uri?.host ?? 'Enlace personalizado';
      case GeneratorContentType.text:
        final text = getValue('text');
        return text.length > 40 ? '${text.substring(0, 40)}…' : text;
      case GeneratorContentType.wifi:
        return getValue('ssid');
      case GeneratorContentType.vcard:
        return getValue('name');
      case GeneratorContentType.event:
        return getValue('title');
      case GeneratorContentType.phone:
        return getValue('phone');
      case GeneratorContentType.sms:
        return '${getValue('phone')} · ${getValue('message')}';
      case GeneratorContentType.email:
        return getValue('email');
      case GeneratorContentType.geo:
        return '${getValue('lat')}, ${getValue('lng')}';
      case GeneratorContentType.barcodeEan13:
        return getValue('ean');
      case GeneratorContentType.barcodeCode128:
        return getValue('value');
    }
  }

  static String _computeEan13CheckDigit(String digits) {
    int sum = 0;
    for (var i = 0; i < digits.length; i++) {
      final value = int.tryParse(digits[i]) ?? 0;
      sum += (i % 2 == 0) ? value : value * 3;
    }
    final mod = sum % 10;
    return mod == 0 ? '0' : '${10 - mod}';
  }

  static String? _formatDateTime(String input) {
    if (input.trim().isEmpty) return null;
    final parts = input.split(' ');
    if (parts.length != 2) return null;
    final date = parts[0].split('-');
    final time = parts[1].split(':');
    if (date.length != 3 || time.length != 2) return null;
    return '${date[0]}${date[1]}${date[2]}T${time[0]}${time[1]}00Z';
  }
}

  class GeneratorPalette {
  const GeneratorPalette._(this.id, this.title, this.foreground, this.background);

  final String id;
  final String title;
  final Color foreground;
  final Color background;

  static const GeneratorPalette midnight = GeneratorPalette._('midnight', 'Midnight', Color(0xFFF8FBFF), Color(0xFF0F172A));
  static const GeneratorPalette wasabi = GeneratorPalette._('wasabi', 'Wasabi', Color(0xFF163300), Color(0xFFDDFFD7));
  static const GeneratorPalette coral = GeneratorPalette._('coral', 'Coral', Color(0xFF31111D), Color(0xFFFFD9E3));
  static const GeneratorPalette slate = GeneratorPalette._('slate', 'Slate', Color(0xFF1D1B20), Color(0xFFE8DEF8));
  static const GeneratorPalette orchid = GeneratorPalette._('orchid', 'Orchid', Color(0xFF3B2A57), Color(0xFFF4EAFF));

    static List<GeneratorPalette> get values => const [midnight, wasabi, coral, slate, orchid];

    static GeneratorPalette fromId(String id) {
      switch (id) {
        case 'midnight':
          return midnight;
        case 'coral':
          return coral;
        case 'wasabi':
          return wasabi;
        case 'slate':
          return slate;
        case 'orchid':
          return orchid;
        case 'duotone':
          return midnight;
        case 'graphite':
          return slate;
        default:
          return midnight;
      }
    }

    static GeneratorPalette custom(Color foreground, Color background) {
      return GeneratorPalette._('custom', 'Personalizado', foreground, background);
    }
  }

class BatchEntry {
  BatchEntry({required this.payload, this.label});

  final String payload;
  final String? label;
}
enum HistorySource { created, scanned }

class HistoryEntry {
  HistoryEntry({
    required this.id,
    required this.type,
    required this.value,
    required this.displayLabel,
    required this.createdAt,
    required this.favorite,
    required this.tags,
    required this.note,
    required this.source,
    this.paletteId,
    this.quietZone,
  });

  final String id;
  final GeneratorContentType type;
  final String value;
  final String displayLabel;
  final DateTime createdAt;
  final bool favorite;
  final List<String> tags;
  final String note;
  final HistorySource source;
  final String? paletteId;
  final double? quietZone;

  bool get isSensitive => type.isSensitive;

  HistoryEntry copyWith({
    String? displayLabel,
    bool? favorite,
    List<String>? tags,
    String? note,
  }) {
    return HistoryEntry(
      id: id,
      type: type,
      value: value,
      displayLabel: displayLabel ?? this.displayLabel,
      createdAt: createdAt,
      favorite: favorite ?? this.favorite,
      tags: tags ?? this.tags,
      note: note ?? this.note,
      source: source,
      paletteId: paletteId,
      quietZone: quietZone,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'type': type.name,
        'value': value,
        'displayLabel': displayLabel,
        'createdAt': createdAt.toIso8601String(),
        'favorite': favorite,
        'tags': tags,
        'note': note,
        'source': source.name,
        'paletteId': paletteId,
        'quietZone': quietZone,
      };

  static HistoryEntry? fromJson(Map<String, dynamic> json) {
    try {
      final sourceName = json['source'] as String?;
      return HistoryEntry(
        id: json['id'] as String,
        type: GeneratorContentType.values.firstWhere((element) => element.name == json['type'] as String),
        value: json['value'] as String,
        displayLabel: json['displayLabel'] as String? ?? '',
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
        favorite: json['favorite'] as bool? ?? false,
        tags: (json['tags'] as List<dynamic>? ?? const <dynamic>[]).map((e) => e.toString()).toList(),
        note: json['note'] as String? ?? '',
        source: HistorySource.values.firstWhere(
          (element) => element.name == (sourceName ?? 'created'),
          orElse: () => HistorySource.created,
        ),
        paletteId: json['paletteId'] as String?,
        quietZone: (json['quietZone'] as num?)?.toDouble(),
      );
    } catch (_) {
      return null;
    }
  }
}

class SavedTemplate {
  SavedTemplate({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.stateJson,
    this.paletteId,
    this.label,
    this.quietZone,
    this.includeLogo,
  });

  final String id;
  final String title;
  final String description;
  final GeneratorContentType type;
  final Map<String, dynamic> stateJson;
  final String? paletteId;
  final String? label;
  final double? quietZone;
  final bool? includeLogo;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'description': description,
        'type': type.name,
        'state': stateJson,
        'paletteId': paletteId,
        'label': label,
        'quietZone': quietZone,
        'includeLogo': includeLogo,
      };

  static SavedTemplate? fromJson(Map<String, dynamic> json) {
    try {
      return SavedTemplate(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Plantilla',
        description: json['description'] as String? ?? '',
        type: GeneratorContentType.values.firstWhere((element) => element.name == json['type'] as String),
        stateJson: Map<String, dynamic>.from(json['state'] as Map? ?? {}),
        paletteId: json['paletteId'] as String?,
        label: json['label'] as String?,
        quietZone: (json['quietZone'] as num?)?.toDouble(),
        includeLogo: json['includeLogo'] as bool?,
      );
    } catch (_) {
      return null;
    }
  }
}

class SavedHistoryView {
  SavedHistoryView({
    required this.id,
    required this.name,
    required this.filters,
    required this.onlyFavorites,
    required this.onlyWithNotes,
    required this.sort,
    required this.gridMode,
  });

  final String id;
  final String name;
  final List<String> filters;
  final bool onlyFavorites;
  final bool onlyWithNotes;
  final String sort;
  final bool gridMode;

  SavedHistoryView copyWith({
    String? name,
    List<String>? filters,
    bool? onlyFavorites,
    bool? onlyWithNotes,
    String? sort,
    bool? gridMode,
  }) {
    return SavedHistoryView(
      id: id,
      name: name ?? this.name,
      filters: filters ?? this.filters,
      onlyFavorites: onlyFavorites ?? this.onlyFavorites,
      onlyWithNotes: onlyWithNotes ?? this.onlyWithNotes,
      sort: sort ?? this.sort,
      gridMode: gridMode ?? this.gridMode,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'filters': filters,
      'onlyFavorites': onlyFavorites,
      'onlyWithNotes': onlyWithNotes,
      'sort': sort,
      'gridMode': gridMode,
    };
  }

  static SavedHistoryView? fromJson(Map<String, dynamic> json) {
    try {
      return SavedHistoryView(
        id: json['id'] as String,
        name: json['name'] as String,
        filters: (json['filters'] as List<dynamic>? ?? const <dynamic>[]).map((e) => e.toString()).toList(),
        onlyFavorites: json['onlyFavorites'] as bool? ?? false,
        onlyWithNotes: json['onlyWithNotes'] as bool? ?? false,
        sort: json['sort'] as String? ?? 'recent',
        gridMode: json['gridMode'] as bool? ?? false,
      );
    } catch (_) {
      return null;
    }
  }
}


class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key, required this.onFabIntentChanged});

  final FabIntentNotifier onFabIntentChanged;

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> with SingleTickerProviderStateMixin {
  late final ms.MobileScannerController _controller;
  bool _torchEnabled = false;
  bool _paused = false;
  DateTime _lastDetection = DateTime.fromMillisecondsSinceEpoch(0);
  ScanResult? _result;
  late final AnimationController _laserController;
  Timer? _noteDebounce;

  @override
  void initState() {
    super.initState();
    _controller = ms.MobileScannerController(
      detectionSpeed: ms.DetectionSpeed.normal,
      facing: ms.CameraFacing.back,
    );
    widget.onFabIntentChanged.value = FabIntent.flashlight;
    _laserController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    _laserController.dispose();
    _noteDebounce?.cancel();
    super.dispose();
  }

  void _togglePause() {
    setState(() {
      _paused = !_paused;
      HapticFeedback.selectionClick();
      if (_paused) {
        _controller.stop();
        _laserController.stop();
      } else {
        _controller.start();
        _laserController.repeat(reverse: true);
      }
    });
  }

  void _toggleTorch() {
    _torchEnabled = !_torchEnabled;
    HapticFeedback.selectionClick();
    _controller.toggleTorch();
    setState(() {});
  }

  void toggleTorchExternally() => _toggleTorch();

  void togglePauseExternally() => _togglePause();

  void _switchCamera() {
    HapticFeedback.selectionClick();
    _controller.switchCamera();
  }

  Future<void> _handleDetection(ms.BarcodeCapture capture) async {
    if (_paused) return;
    final now = DateTime.now();
    if (now.difference(_lastDetection) < const Duration(milliseconds: 700)) {
      return;
    }
    _lastDetection = now;
    final barcode = capture.barcodes.firstOrNull;
    final rawValue = barcode?.rawValue ?? '';
    if (rawValue.isEmpty) return;
    final analysis = ScanResult.fromRaw(rawValue);
    final appState = AppStateScope.of(context);
    final existing = appState.history.firstWhereOrNull((entry) => entry.value == rawValue);
    final enriched = analysis.copyWith(
      note: existing?.note ?? '',
      favorite: existing?.favorite ?? false,
      existingId: existing?.id,
    );
    _noteDebounce?.cancel();
    setState(() => _result = enriched);
    widget.onFabIntentChanged.value = FabIntent.flashlight;
    await HapticFeedback.lightImpact();
    if (analysis.smartActions.isNotEmpty) {
      _showResultSheet();
    }
  }

  void _showResultSheet() {
    final result = _result;
    if (result == null) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return ScannerActionSheet(
          result: result,
          onFavorite: _toggleFavorite,
          onSave: _saveToHistory,
          onClose: () => Navigator.of(context).pop(),
          onNoteChanged: _handleNoteChanged,
        );
      },
    );
  }

  void _handleNoteChanged(String note) {
    final current = _result;
    if (current == null) return;
    _noteDebounce?.cancel();
    _noteDebounce = Timer(const Duration(milliseconds: 400), () async {
      final updated = current.copyWith(note: note);
      if (mounted) {
        setState(() => _result = updated);
      }
      final existingId = updated.existingId;
      if (existingId != null) {
        final appState = AppStateScope.of(context);
        final existing = appState.history.firstWhereOrNull((entry) => entry.id == existingId);
        if (existing != null) {
          await appState.updateHistory(existing.copyWith(note: note));
        }
      }
    });
  }

  Future<void> _toggleFavorite() async {
    final result = _result;
    if (result == null) return;
    final appState = AppStateScope.of(context);
    final existing = result.existingId != null
        ? appState.history.firstWhereOrNull((entry) => entry.id == result.existingId)
        : appState.history.firstWhereOrNull((entry) => entry.value == result.payload);
    if (existing != null) {
      final updatedEntry = existing.copyWith(favorite: !existing.favorite);
      await appState.updateHistory(updatedEntry);
      setState(() => _result = result.copyWith(favorite: updatedEntry.favorite, existingId: updatedEntry.id));
      _showSnack('Favorito actualizado');
    } else {
      setState(() => _result = result.copyWith(favorite: !result.favorite));
    }
  }

  Future<void> _saveToHistory({String note = ''}) async {
    final result = _result;
    if (result == null) return;
    final entry = HistoryEntry(
      id: UniqueKey().toString(),
      type: result.type,
      value: result.payload,
      displayLabel: result.title,
      createdAt: DateTime.now(),
      favorite: result.favorite,
      tags: <String>[result.type.label, if (result.isHttps) 'https'],
      note: note,
      source: HistorySource.scanned,
      paletteId: null,
      quietZone: null,
    );
    await AppStateScope.of(context).addHistory(entry, force: true);
    if (mounted) {
      setState(() => _result = result.copyWith(note: note, existingId: entry.id));
    }
    _showSnack('Guardado en historial');
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Row(children: [const Icon(Icons.info_outline), const SizedBox(width: 12), Expanded(child: Text(message))])),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ScannerDispatcher(
      toggleTorch: _toggleTorch,
      child: Stack(
        children: [
          Positioned.fill(
            child: ms.MobileScanner(
              controller: _controller,
              onDetect: _handleDetection,
            ),
          ),
          Positioned.fill(
            child: CustomPaint(
              painter: ScannerOverlayPainter(animation: _laserController),
            ),
          ),
          Positioned(
            right: 16,
            top: 32,
            child: Column(
              children: [
                _ScannerActionButton(
                  icon: _torchEnabled ? Icons.flash_on : Icons.flash_off,
                  label: 'Linterna',
                  onTap: _toggleTorch,
                ),
                const SizedBox(height: 12),
                _ScannerActionButton(
                  icon: Icons.cameraswitch,
                  label: 'Cámara',
                  onTap: _switchCamera,
                ),
                const SizedBox(height: 12),
                _ScannerActionButton(
                  icon: _paused ? Icons.play_arrow : Icons.pause,
                  label: _paused ? 'Reanudar' : 'Pausar',
                  onTap: _togglePause,
                ),
              ],
            ),
          ),
          if (_result != null)
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: GestureDetector(
                  onTap: _showResultSheet,
                  child: _ScanPeekCard(result: _result!, colorScheme: colorScheme),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ScannerActionButton extends StatelessWidget {
  const _ScannerActionButton({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Semantics(
        button: true,
        label: label,
        child: Material(
          color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 2,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              width: 56,
              height: 56,
              child: Icon(icon, color: Theme.of(context).colorScheme.onSurface),
            ),
          ),
        ),
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  ScannerOverlayPainter({required this.animation}) : super(repaint: animation);

  final Animation<double> animation;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.4);
    final rect = Rect.fromLTWH(size.width * 0.12, size.height * 0.2, size.width * 0.76, size.height * 0.6);
    final outer = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final inner = Path()
      ..addRRect(RRect.fromRectAndRadius(rect, const Radius.circular(24)));
    canvas.drawPath(Path.combine(PathOperation.difference, outer, inner), paint);

    final borderPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    const cornerLength = 32.0;
    void drawCorner(double left, double top, double dx, double dy) {
      canvas.drawLine(Offset(left, top), Offset(left + dx * cornerLength, top), borderPaint);
      canvas.drawLine(Offset(left, top), Offset(left, top + dy * cornerLength), borderPaint);
    }

    drawCorner(rect.left, rect.top, 1, 1);
    drawCorner(rect.right, rect.top, -1, 1);
    drawCorner(rect.left, rect.bottom, 1, -1);
    drawCorner(rect.right, rect.bottom, -1, -1);

    final laserY = rect.top + rect.height * animation.value;
    final laserPaint = Paint()
      ..shader = LinearGradient(colors: [Colors.redAccent.withOpacity(0.2), Colors.redAccent.withOpacity(0.8), Colors.redAccent.withOpacity(0.2)]).createShader(Rect.fromLTWH(rect.left, laserY, rect.width, 4))
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(rect.left, laserY), Offset(rect.right, laserY), laserPaint);
  }

  @override
  bool shouldRepaint(covariant ScannerOverlayPainter oldDelegate) => oldDelegate.animation != animation;
}

class ScanResult {
  ScanResult({
    required this.payload,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.smartActions,
    required this.warnings,
    this.note = '',
    this.favorite = false,
    this.existingId,
  });

  final String payload;
  final GeneratorContentType type;
  final String title;
  final String subtitle;
  final List<SmartAction> smartActions;
  final List<String> warnings;
  final String note;
  final bool favorite;
  final String? existingId;

  bool get isHttps => type == GeneratorContentType.url && payload.startsWith('https://');

  bool get hasExisting => existingId != null;

  ScanResult copyWith({String? note, bool? favorite, String? existingId}) {
    return ScanResult(
      payload: payload,
      type: type,
      title: title,
      subtitle: subtitle,
      smartActions: smartActions,
      warnings: warnings,
      note: note ?? this.note,
      favorite: favorite ?? this.favorite,
      existingId: existingId ?? this.existingId,
    );
  }

  static ScanResult fromRaw(String rawValue) {
    rawValue = rawValue.trim();
    if (rawValue.startsWith('WIFI:')) {
      final params = rawValue.substring(5).split(';');
      final map = <String, String>{};
      for (final part in params) {
        if (part.contains(':')) {
          final pieces = part.split(':');
          map[pieces[0]] = pieces.sublist(1).join(':');
        }
      }
      final ssid = map['S'] ?? 'Red Wi-Fi';
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.wifi,
        title: ssid,
        subtitle: 'Red Wi-Fi',
        smartActions: [
          SmartAction(icon: Icons.copy_all, label: 'Copiar clave', action: SmartActionType.copy),
        ],
        warnings: const <String>['No se conectará automáticamente en web.'],
      );
    }
    if (rawValue.startsWith('BEGIN:VCARD')) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.vcard,
        title: _extractLine(rawValue, 'FN') ?? 'Contacto',
        subtitle: 'Tarjeta de contacto',
        smartActions: [
          SmartAction(icon: Icons.copy_all, label: 'Copiar vCard', action: SmartActionType.copy),
        ],
        warnings: const <String>['Añade manualmente a tus contactos.'],
      );
    }
    if (rawValue.startsWith('BEGIN:VEVENT') || rawValue.startsWith('BEGIN:VCALENDAR')) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.event,
        title: _extractLine(rawValue, 'SUMMARY') ?? 'Evento',
        subtitle: 'Evento escaneado',
        smartActions: [SmartAction(icon: Icons.copy_all, label: 'Copiar .ics', action: SmartActionType.copy)],
        warnings: const <String>['Añade el evento manualmente a tu calendario.'],
      );
    }
    if (rawValue.startsWith('geo:')) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.geo,
        title: rawValue.substring(4),
        subtitle: 'Coordenadas',
        smartActions: [SmartAction(icon: Icons.map, label: 'Ver mapa', action: SmartActionType.open)],
        warnings: const <String>[],
      );
    }
    if (rawValue.startsWith('mailto:')) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.email,
        title: rawValue.substring(7).split('?').first,
        subtitle: 'Correo electrónico',
        smartActions: [SmartAction(icon: Icons.email, label: 'Abrir', action: SmartActionType.open)],
        warnings: const <String>[],
      );
    }
    if (rawValue.startsWith('sms:')) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.sms,
        title: rawValue.substring(4).split('?').first,
        subtitle: 'Mensaje SMS',
        smartActions: [SmartAction(icon: Icons.sms, label: 'Abrir', action: SmartActionType.open)],
        warnings: const <String>['Confirma el destinatario antes de enviar.'],
      );
    }
    if (rawValue.startsWith('tel:')) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.phone,
        title: rawValue.substring(4),
        subtitle: 'Teléfono',
        smartActions: [SmartAction(icon: Icons.phone, label: 'Llamar', action: SmartActionType.open)],
        warnings: const <String>['Verifica el número antes de llamar.'],
      );
    }
      if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
        final uri = Uri.tryParse(rawValue);
        final warnings = <String>[];
        final host = uri?.host ?? '';
        if (uri != null && uri.scheme != 'https') warnings.add('Enlace sin HTTPS');
        if (host.contains('xn--') || RegExp(r'[^\x00-\x7F]').hasMatch(host)) warnings.add('Dominio inusual');
        if (uri != null && uri.scheme == 'http' && uri.port != 80) warnings.add('Puerto no estándar: ${uri.port}');
        return ScanResult(
          payload: rawValue,
          type: GeneratorContentType.url,
          title: uri?.host ?? rawValue,
          subtitle: uri?.path ?? '',
        smartActions: [
          SmartAction(icon: Icons.open_in_new, label: 'Abrir', action: SmartActionType.open),
          SmartAction(icon: Icons.copy, label: 'Copiar', action: SmartActionType.copy),
        ],
        warnings: warnings,
      );
    }
    if (rawValue.length >= 12 && RegExp(r'^[0-9]+$').hasMatch(rawValue)) {
      return ScanResult(
        payload: rawValue,
        type: GeneratorContentType.barcodeEan13,
        title: rawValue,
        subtitle: 'Código de barras',
        smartActions: [SmartAction(icon: Icons.copy, label: 'Copiar', action: SmartActionType.copy)],
        warnings: const <String>[],
      );
    }
    return ScanResult(
      payload: rawValue,
      type: GeneratorContentType.text,
      title: rawValue.length > 32 ? '${rawValue.substring(0, 32)}…' : rawValue,
      subtitle: 'Contenido sin formato',
      smartActions: [SmartAction(icon: Icons.copy, label: 'Copiar', action: SmartActionType.copy)],
      warnings: const <String>[],
    );
  }

  static String? _extractLine(String data, String key) {
    for (final line in data.split('\n')) {
      if (line.startsWith('$key:')) {
        return line.substring(key.length + 1);
      }
    }
    return null;
  }
}

enum SmartActionType { copy, open }

class SmartAction {
  SmartAction({required this.icon, required this.label, required this.action});

  final IconData icon;
  final String label;
  final SmartActionType action;
}

class _ScanPeekCard extends StatelessWidget {
  const _ScanPeekCard({required this.result, required this.colorScheme});

  final ScanResult result;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 6,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(child: Icon(result.type.icon)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(result.title, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(result.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Icon(Icons.expand_less, color: colorScheme.primary),
          ],
        ),
      ),
    );
  }
}

class ScannerActionSheet extends StatefulWidget {
  const ScannerActionSheet({super.key, required this.result, required this.onFavorite, required this.onSave, required this.onClose, required this.onNoteChanged});

  final ScanResult result;
  final VoidCallback onFavorite;
  final Future<void> Function({String note}) onSave;
  final VoidCallback onClose;
  final ValueChanged<String> onNoteChanged;

  @override
  State<ScannerActionSheet> createState() => _ScannerActionSheetState();
}

class _ScannerActionSheetState extends State<ScannerActionSheet> {
  late TextEditingController _noteController;
  late bool _favorite;

  @override
  void initState() {
    super.initState();
    _favorite = widget.result.favorite;
    _noteController = TextEditingController(text: widget.result.note);
    _noteController.addListener(() => widget.onNoteChanged(_noteController.text));
  }

  @override
  void didUpdateWidget(covariant ScannerActionSheet oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.result.note != widget.result.note && _noteController.text != widget.result.note) {
      _noteController.value = TextEditingValue(
        text: widget.result.note,
        selection: TextSelection.collapsed(offset: widget.result.note.length),
      );
    }
    if (oldWidget.result.favorite != widget.result.favorite) {
      _favorite = widget.result.favorite;
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final saveLabel = widget.result.hasExisting ? 'Actualizar historial' : 'Guardar en historial';
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.55,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  CircleAvatar(child: Icon(widget.result.type.icon)),
                  const SizedBox(width: 12),
                  Expanded(child: Text(widget.result.title, style: Theme.of(context).textTheme.titleLarge)),
                  IconButton(
                    onPressed: widget.onClose,
                    tooltip: 'Cerrar',
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            if (widget.result.warnings.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Wrap(
                  spacing: 8,
                  children: widget.result.warnings
                      .map((warning) => Chip(
                            avatar: const Icon(Icons.warning, size: 18),
                            label: Text(warning),
                            backgroundColor: Theme.of(context).colorScheme.tertiaryContainer,
                            labelStyle: Theme.of(context).textTheme.labelMedium,
                          ))
                      .toList(),
                ),
              ),
            const SizedBox(height: 12),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.result.subtitle, style: Theme.of(context).textTheme.bodyLarge),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _noteController,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Notas (auto-guardado)'),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      children: widget.result.smartActions
                          .map((action) => Tooltip(
                                message: action.label,
                                child: ActionChip(
                                  label: Text(action.label),
                                  avatar: Icon(action.icon),
                                  onPressed: () async => _performAction(context, action, widget.result),
                                ),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        await widget.onSave(note: _noteController.text);
                      },
                      icon: const Icon(Icons.save),
                      label: Text(saveLabel),
                    ),
                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: () async {
                        await widget.onFavorite();
                        setState(() => _favorite = !_favorite);
                      },
                      icon: Icon(_favorite ? Icons.star : Icons.star_border),
                      label: Text(_favorite ? 'Favorito' : 'Marcar como favorito'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _performAction(BuildContext context, SmartAction action, ScanResult result) async {
    switch (action.action) {
      case SmartActionType.copy:
        await FlutterClipboard.copy(result.payload);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copiado al portapapeles')));
        break;
      case SmartActionType.open:
        final uri = result.type.tryParseUri(result.payload);
        if (uri == null) return;
        if (!isAllowedScheme(uri.scheme)) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Esquema no permitido')));
          return;
        }
        if (result.type.isSensitive) {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Contenido sensible'),
              content: const Text('¿Quieres abrir este contenido sensible?'),
              actions: [
                TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
                FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Abrir')),
              ],
            ),
          );
          if (confirm != true) return;
        }
        if (!await canLaunchUrl(uri)) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir')));
          return;
        }
        await launchUrl(uri, mode: LaunchMode.platformDefault);
        break;
    }
  }
}

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key, required this.onFabIntentChanged});

  final FabIntentNotifier onFabIntentChanged;

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  final Set<GeneratorContentType> _filters = <GeneratorContentType>{};
  bool _selectionMode = false;
  final Set<String> _selectedIds = <String>{};
  String _sort = 'recent';
  bool _onlyFavorites = false;
  bool _onlyWithNotes = false;
  bool _gridMode = false;
  String? _activeViewId;

  @override
  void initState() {
    super.initState();
    widget.onFabIntentChanged.value = FabIntent.historyActions;
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final entries = _applyFilters(appState.history);
    final locale = Localizations.localeOf(context);
    final grouped = groupHistoryEntries(entries, locale);
    final stats = _computeStats(appState.history);
    return HistoryDispatcher(
      toggleSelection: _toggleSelectionMode,
      child: Column(
        children: [
          _buildSearchBar(),
          _buildSavedViews(appState),
          _buildFilters(),
          _HistoryStatsRow(stats: stats, autoCleanDays: appState.autoCleanDays),
          Expanded(
            child: grouped.isEmpty
                ? _HistoryEmptyState(onCreate: () => HomeShell.of(context)?.switchTab(0))
                : _gridMode
                    ? _buildGrid(entries)
                    : ListView.builder(
                        padding: const EdgeInsets.only(bottom: 120),
                        itemCount: grouped.length,
                        itemBuilder: (context, index) {
                          final item = grouped[index];
                          return item.when(
                            header: (label) => _HistoryGroupHeader(label: label),
                            entry: (entry) => _HistoryTile(
                              entry: entry,
                              selected: _selectedIds.contains(entry.id),
                              selectionMode: _selectionMode,
                              onTap: () => _onEntryTap(entry),
                              onLongPress: () => _onEntryLongPress(entry),
                            ),
                          );
                        },
                      ),
          ),
          if (_selectionMode)
            _HistorySelectionBar(
              onCopy: _copySelected,
              onShare: _shareSelected,
              onExport: _exportSelected,
              onDelete: _deleteSelected,
              count: _selectedIds.length,
            ),
        ],
      ),
    );
  }

  List<HistoryEntry> _applyFilters(List<HistoryEntry> entries) {
      Iterable<HistoryEntry> filtered = entries;
      if (_filters.isNotEmpty) {
        filtered = filtered.where((entry) => _filters.contains(entry.type));
      }
      if (_onlyFavorites) {
        filtered = filtered.where((entry) => entry.favorite);
      }
      if (_onlyWithNotes) {
        filtered = filtered.where((entry) => entry.note.trim().isNotEmpty);
      }
      final query = _searchController.text.trim().toLowerCase();
      if (query.isNotEmpty) {
        filtered = filtered.where((entry) => entry.value.toLowerCase().contains(query) || entry.displayLabel.toLowerCase().contains(query));
      }
      List<HistoryEntry> sorted = filtered.toList();
      switch (_sort) {
        case 'recent':
          sorted.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          break;
        case 'old':
          sorted.sort((a, b) => a.createdAt.compareTo(b.createdAt));
          break;
        case 'az':
          sorted.sort((a, b) => a.displayLabel.compareTo(b.displayLabel));
          break;
        case 'za':
          sorted.sort((a, b) => b.displayLabel.compareTo(a.displayLabel));
          break;
      }
      return sorted;
    }

    HistoryStats _computeStats(List<HistoryEntry> entries) {
    final now = DateTime.now();
    final thisWeek = entries.where((e) => now.difference(e.createdAt).inDays < 7).length;
    final qrCount = entries.where((e) => !e.type.isBarcode).length;
    final barcodeCount = entries.length - qrCount;
    return HistoryStats(total: entries.length, thisWeek: thisWeek, qrShare: qrCount, barcodeShare: barcodeCount);
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocus,
        decoration: InputDecoration(
          prefixIcon: const Icon(Icons.search),
          labelText: 'Buscar en historial',
          suffixIcon: _searchController.text.isEmpty
              ? null
              : IconButton(icon: const Icon(Icons.clear), onPressed: () => _searchController.clear()),
        ),
      ),
    );
  }

  Widget _buildSavedViews(AppState appState) {
    final views = appState.historyViews;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          ActionChip(
            avatar: const Icon(Icons.bookmark_add_outlined, size: 18),
            label: const Text('Guardar vista actual'),
            onPressed: _saveCurrentView,
          ),
          for (final view in views)
            Tooltip(
              message: 'Vista guardada: ${view.name}',
              child: InputChip(
                label: Text(view.name),
                selected: _activeViewId == view.id,
                onPressed: () => _applySavedView(view),
                onDeleted: () => _showViewMenu(view),
                deleteIcon: const Icon(Icons.more_vert),
              ),
            ),
        ],
      ),
    );
  }

  void focusSearchField() => FocusScope.of(context).requestFocus(_searchFocus);

  void enableFavoritesView() {
    setState(() {
      _onlyFavorites = true;
      _onlyWithNotes = false;
      _selectionMode = false;
      _selectedIds.clear();
      _activeViewId = null;
    });
  }

  void enableNotesView() {
    setState(() {
      _onlyWithNotes = true;
      _onlyFavorites = false;
      _selectionMode = false;
      _selectedIds.clear();
      _activeViewId = null;
    });
  }

  Future<void> deleteSelection() async {
    if (_selectionMode && _selectedIds.isNotEmpty) {
      await _deleteSelected();
    }
  }

  void openEntryById(String id) {
    final appState = AppStateScope.of(context);
    final entry = appState.history.firstWhereOrNull((element) => element.id == id);
    if (entry != null) {
      _onEntryTap(entry);
    }
  }

  Widget _buildFilters() {
    final List<Widget> chips = GeneratorContentType.values
        .map<Widget>(
          (type) => FilterChip(
            label: Text(type.label),
            avatar: Icon(type.icon, size: 18),
            selected: _filters.contains(type),
            onSelected: (_) {
              setState(() {
                if (_filters.contains(type)) {
                  _filters.remove(type);
                } else {
                  _filters.add(type);
                }
                _activeViewId = null;
              });
            },
          ),
        )
        .toList();
    chips.addAll([
      FilterChip(
        label: const Text('Solo favoritos'),
        avatar: const Icon(Icons.star, size: 18),
        selected: _onlyFavorites,
        onSelected: (value) => setState(() {
          _onlyFavorites = value;
          _activeViewId = null;
        }),
      ),
      FilterChip(
        label: const Text('Con notas'),
        avatar: const Icon(Icons.sticky_note_2, size: 18),
        selected: _onlyWithNotes,
        onSelected: (value) => setState(() {
          _onlyWithNotes = value;
          _activeViewId = null;
        }),
      ),
    ]);
    chips.add(
      FilterChip(
        label: Text(_gridMode ? 'Vista tablero' : 'Vista lista'),
        avatar: Icon(_gridMode ? Icons.grid_view : Icons.view_agenda, size: 18),
        selected: _gridMode,
        onSelected: (value) => setState(() {
          _gridMode = value;
          _activeViewId = null;
        }),
      ),
    );
    chips.add(_buildSortMenu());
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: chips,
      ),
    );
  }

  Widget _buildGrid(List<HistoryEntry> entries) {
    final width = MediaQuery.of(context).size.width;
    final crossAxisCount = width >= 1200 ? 3 : 2;
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.95,
      ),
      itemCount: entries.length,
      itemBuilder: (context, index) {
        final entry = entries[index];
        return _HistoryGridTile(
          entry: entry,
          selected: _selectedIds.contains(entry.id),
          selectionMode: _selectionMode,
          onTap: () => _onEntryTap(entry),
          onLongPress: () => _onEntryLongPress(entry),
        );
      },
    );
  }

  Future<void> _saveCurrentView() async {
    final appState = AppStateScope.of(context);
    final controller = TextEditingController(text: 'Vista ${appState.historyViews.length + 1}');
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Guardar vista'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Nombre de la vista'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.of(context).pop(controller.text.trim()), child: const Text('Guardar')),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    final view = SavedHistoryView(
      id: UniqueKey().toString(),
      name: name,
      filters: _filters.map((e) => e.name).toList(),
      onlyFavorites: _onlyFavorites,
      onlyWithNotes: _onlyWithNotes,
      sort: _sort,
      gridMode: _gridMode,
    );
    await appState.addHistoryView(view);
    setState(() => _activeViewId = view.id);
  }

  void _applySavedView(SavedHistoryView view) {
    setState(() {
      _activeViewId = view.id;
      _filters
        ..clear()
        ..addAll(view.filters
            .map((value) => GeneratorContentType.values.firstWhereOrNull((type) => type.name == value))
            .whereType<GeneratorContentType>());
      _onlyFavorites = view.onlyFavorites;
      _onlyWithNotes = view.onlyWithNotes;
      _sort = view.sort;
      _gridMode = view.gridMode;
    });
  }

  Future<void> _showViewMenu(SavedHistoryView view) async {
    final action = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Renombrar'),
              onTap: () => Navigator.of(context).pop('rename'),
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline),
              title: const Text('Eliminar'),
              onTap: () => Navigator.of(context).pop('delete'),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
    if (action == null) return;
    final appState = AppStateScope.of(context);
    if (action == 'rename') {
      final controller = TextEditingController(text: view.name);
      final newName = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Renombrar vista'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(labelText: 'Nombre'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
            FilledButton(onPressed: () => Navigator.of(context).pop(controller.text.trim()), child: const Text('Guardar')),
          ],
        ),
      );
      if (newName != null && newName.isNotEmpty) {
        await appState.addHistoryView(view.copyWith(name: newName));
        if (!mounted) return;
        setState(() => _activeViewId = view.id);
      }
    } else if (action == 'delete') {
      await appState.removeHistoryView(view.id);
      if (!mounted) return;
      if (_activeViewId == view.id) {
        setState(() => _activeViewId = null);
      }
    }
  }

  Widget _buildSortMenu() {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.sort),
      onSelected: (value) => setState(() {
        _sort = value;
        _activeViewId = null;
      }),
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'recent', child: Text('Más recientes')),
        PopupMenuItem(value: 'old', child: Text('Más antiguos')),
        PopupMenuItem(value: 'az', child: Text('A-Z')),
        PopupMenuItem(value: 'za', child: Text('Z-A')),
      ],
    );
  }

  void _toggleSelectionMode() {
    setState(() {
      _selectionMode = !_selectionMode;
      if (!_selectionMode) {
        _selectedIds.clear();
      }
    });
  }

  void _onEntryTap(HistoryEntry entry) {
    if (_selectionMode) {
      setState(() {
        if (_selectedIds.contains(entry.id)) {
          _selectedIds.remove(entry.id);
          if (_selectedIds.isEmpty) _selectionMode = false;
        } else {
          _selectedIds.add(entry.id);
        }
      });
      return;
    }
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => HistoryDetailSheet(entry: entry, onUpdate: _updateEntry, onDelete: _deleteEntry),
    );
  }

  void _onEntryLongPress(HistoryEntry entry) {
    if (!_selectionMode) {
      setState(() {
        _selectionMode = true;
        _selectedIds.add(entry.id);
      });
    }
  }

  Future<void> _copySelected() async {
    final appState = AppStateScope.of(context);
    final selected = appState.history.where((entry) => _selectedIds.contains(entry.id)).map((e) => e.value).join('\n');
    await FlutterClipboard.copy(selected);
    _toggleSelectionMode();
  }

  Future<void> _shareSelected() async {
    final appState = AppStateScope.of(context);
    final selectedEntries = appState.history.where((entry) => _selectedIds.contains(entry.id)).toList();
    if (selectedEntries.any((entry) => entry.isSensitive)) {
      final proceed = await _confirmHistorySensitive(context);
      if (proceed != true) return;
    }
    final selected = selectedEntries.map((e) => e.value).join('\n');
    await Share.share(selected, subject: 'Historial Nexus QR');
    _toggleSelectionMode();
  }

  Future<void> _deleteSelected() async {
    final appState = AppStateScope.of(context);
    final removed = await appState.removeHistory(_selectedIds);
    _toggleSelectionMode();
    _showUndoSnack(removed);
  }

  Future<void> _exportSelected() async {
    final appState = AppStateScope.of(context);
    final entries = appState.history.where((entry) => _selectedIds.contains(entry.id)).toList();
    if (entries.isEmpty) return;
    final format = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => _ExportFormatSheet(),
    );
    if (format == null) return;
    if (format == 'csv') {
      final csv = StringBuffer('"id","type","label","value","createdAt","favorite","note"\n');
      for (final entry in entries) {
        csv.writeln('"${entry.id}","${entry.type.name}","${_escapeCsv(entry.displayLabel)}","${_escapeCsv(entry.value)}","${entry.createdAt.toIso8601String()}","${entry.favorite}","${_escapeCsv(entry.note)}"');
      }
      await Share.share(csv.toString(), subject: 'Historial CSV');
    } else {
      final payload = jsonEncode(entries.map((e) => e.toJson()).toList());
      await Share.share(payload, subject: 'Historial JSON');
    }
    _toggleSelectionMode();
  }

  Future<void> _updateEntry(HistoryEntry entry) async {
    await AppStateScope.of(context).updateHistory(entry);
  }

  Future<void> _deleteEntry(HistoryEntry entry) async {
    final removed = await AppStateScope.of(context).removeHistory(<String>{entry.id});
    _showUndoSnack(removed);
  }

  void _showUndoSnack(List<HistoryEntry> removed) {
    if (removed.isEmpty) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: const [
            Icon(Icons.delete_outline),
            SizedBox(width: 12),
            Expanded(child: Text('Elementos eliminados')),
          ],
        ),
        action: SnackBarAction(
          label: 'Deshacer',
          onPressed: () {
            final appState = AppStateScope.of(context);
            for (final entry in removed.reversed) {
              appState.addHistory(entry, force: true);
            }
          },
        ),
      ),
    );
  }

    String _escapeCsv(String value) => value.replaceAll('"', '""');
  }

class HistoryStats {
  HistoryStats({required this.total, required this.thisWeek, required this.qrShare, required this.barcodeShare});

  final int total;
  final int thisWeek;
  final int qrShare;
  final int barcodeShare;
}

class _HistoryStatsRow extends StatelessWidget {
  const _HistoryStatsRow({required this.stats, required this.autoCleanDays});

  final HistoryStats stats;
  final int autoCleanDays;

  @override
  Widget build(BuildContext context) {
    final cards = [
      _HistoryStatCard(label: 'Creados esta semana', value: stats.thisWeek.toString()),
      _HistoryStatCard(label: '% QR', value: stats.total == 0 ? '0%' : '${((stats.qrShare / stats.total) * 100).round()}%'),
      _HistoryStatCard(label: '% Barras', value: stats.total == 0 ? '0%' : '${((stats.barcodeShare / stats.total) * 100).round()}%'),
    ];
    final maintenance = autoCleanDays <= 0 ? 'Manual' : 'Cada ${autoCleanDays}d';
    final needsCleanup = stats.total > 200;
    cards.add(
      _HistoryStatCard(
        label: 'Mantenimiento',
        value: needsCleanup ? '$maintenance · Revisar' : maintenance,
      ),
    );
    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemBuilder: (context, index) => cards[index],
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemCount: cards.length,
      ),
    );
  }
}

class _HistoryStatCard extends StatelessWidget {
  const _HistoryStatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 180,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 6))],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _HistoryEmptyState extends StatelessWidget {
  const _HistoryEmptyState({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.qr_code_2, size: 96, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 16),
          Text('Aún no hay nada aquí. Crea tu primer código en menos de 10 segundos.', textAlign: TextAlign.center),
          const SizedBox(height: 16),
          FilledButton(onPressed: onCreate, child: const Text('Crear código')),
        ],
      ),
    );
  }
}

class _HistorySelectionBar extends StatelessWidget {
  const _HistorySelectionBar({required this.onCopy, required this.onShare, required this.onExport, required this.onDelete, required this.count});

  final Future<void> Function() onCopy;
  final Future<void> Function() onShare;
  final Future<void> Function() onExport;
  final Future<void> Function() onDelete;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, -4))],
      ),
      child: Row(
        children: [
          Text('$count seleccionados'),
          const Spacer(),
          _SelectionActionButton(icon: Icons.copy_all, tooltip: 'Copiar', onPressed: onCopy),
          _SelectionActionButton(icon: Icons.ios_share, tooltip: 'Compartir', onPressed: onShare),
          _SelectionActionButton(icon: Icons.file_download, tooltip: 'Exportar', onPressed: onExport),
          _SelectionActionButton(icon: Icons.delete_outline, tooltip: 'Eliminar', onPressed: onDelete),
        ],
      ),
    );
  }
}

class _SelectionActionButton extends StatelessWidget {
  const _SelectionActionButton({required this.icon, required this.tooltip, required this.onPressed});

  final IconData icon;
  final String tooltip;
  final Future<void> Function() onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Semantics(
        button: true,
        label: tooltip,
        child: SizedBox(
          width: 48,
          height: 48,
          child: IconButton(
            onPressed: () => onPressed(),
            icon: Icon(icon),
            splashRadius: 24,
            padding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}

class _ExportFormatSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Exportar historial', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.table_chart),
              title: const Text('CSV'),
              subtitle: const Text('Ideal para hojas de cálculo y análisis rápidos'),
              onTap: () => Navigator.of(context).pop('csv'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.data_object),
              title: const Text('JSON'),
              subtitle: const Text('Incluye todos los metadatos de cada elemento'),
              onTap: () => Navigator.of(context).pop('json'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryListItem {
  const _HistoryListItem._({this.label, this.entry});

  final String? label;
  final HistoryEntry? entry;

  factory _HistoryListItem.header(String label) => _HistoryListItem._(label: label);
  factory _HistoryListItem.entry(HistoryEntry entry) => _HistoryListItem._(entry: entry);

  T when<T>({required T Function(String label) header, required T Function(HistoryEntry entry) entry}) {
    if (label != null) {
      return header(label!);
    }
    return entry(this.entry!);
  }
}

class _HistoryGroupHeader extends StatelessWidget {
  const _HistoryGroupHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        label,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.entry, required this.selected, required this.selectionMode, required this.onTap, required this.onLongPress});

  final HistoryEntry entry;
  final bool selected;
  final bool selectionMode;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      color: selected ? colorScheme.secondaryContainer : null,
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        onTap: onTap,
        onLongPress: onLongPress,
        leading: Hero(
          tag: entry.id,
          child: CircleAvatar(
            backgroundColor: colorScheme.primaryContainer,
            child: Icon(entry.type.icon, color: colorScheme.primary),
          ),
        ),
        title: Text(entry.displayLabel.isEmpty ? entry.value : entry.displayLabel, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text('${entry.type.label} · ${_formatDate(entry.createdAt)}${entry.note.isNotEmpty ? ' · Nota' : ''}'),
        trailing: selectionMode
            ? Icon(selected ? Icons.check_circle : Icons.circle_outlined)
            : Wrap(
                spacing: 4,
                children: [
                  _HistoryActionButton(
                    icon: Icons.copy_all,
                    tooltip: 'Copiar',
                    onPressed: () async {
                      await FlutterClipboard.copy(entry.value);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copiado al portapapeles')));
                    },
                  ),
                  _HistoryActionButton(
                    icon: Icons.ios_share,
                    tooltip: 'Compartir',
                    onPressed: () async {
                      if (entry.isSensitive) {
                        final proceed = await _confirmHistorySensitive(context);
                        if (proceed != true) return;
                      }
                      await Share.share(entry.value, subject: entry.displayLabel);
                    },
                  ),
                  _HistoryActionButton(
                    icon: Icons.open_in_new,
                    tooltip: 'Abrir',
                    onPressed: () async {
                      final uri = entry.type.tryParseUri(entry.value);
                      if (uri == null || !isAllowedScheme(uri.scheme)) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Destino no compatible')));
                        return;
                      }
                      if (entry.isSensitive) {
                        final proceed = await _confirmHistorySensitive(context);
                        if (proceed != true) return;
                      }
                      if (!await canLaunchUrl(uri)) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir')));
                        return;
                      }
                      await launchUrl(uri, mode: LaunchMode.platformDefault);
                    },
                  ),
                  _HistoryActionButton(
                    icon: entry.favorite ? Icons.star : Icons.star_border,
                    tooltip: entry.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
                    onPressed: () async {
                      final updated = entry.copyWith(favorite: !entry.favorite);
                      await AppStateScope.of(context).updateHistory(updated);
                    },
                  ),
                ],
              ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (now.difference(date).inHours < 24) {
      return DateFormat.Hm().format(date);
    }
    return DateFormat.yMd().format(date);
  }
}

class _HistoryGridTile extends StatelessWidget {
  const _HistoryGridTile({required this.entry, required this.selected, required this.selectionMode, required this.onTap, required this.onLongPress});

  final HistoryEntry entry;
  final bool selected;
  final bool selectionMode;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final cardColor = selected ? colorScheme.secondaryContainer : colorScheme.surface;
    return Semantics(
      selected: selected,
      button: !selectionMode,
      label: '${entry.type.label} ${entry.displayLabel.isEmpty ? entry.value : entry.displayLabel}',
      child: Material(
        color: cardColor,
        elevation: 3,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          onLongPress: onLongPress,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Hero(
                      tag: 'grid_${entry.id}',
                      child: CircleAvatar(
                        backgroundColor: colorScheme.primaryContainer,
                        child: Icon(entry.type.icon, color: colorScheme.primary),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        entry.displayLabel.isEmpty ? entry.value : entry.displayLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    if (selectionMode)
                      Icon(selected ? Icons.check_circle : Icons.circle_outlined, color: colorScheme.primary),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: Text(
                    entry.value,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                const SizedBox(height: 12),
                Text('${entry.type.label} · ${_formatDate(entry.createdAt)}${entry.note.isNotEmpty ? ' · Nota' : ''}', style: Theme.of(context).textTheme.labelMedium),
                const SizedBox(height: 12),
                if (!selectionMode)
                  Wrap(
                    spacing: 4,
                    children: [
                      _HistoryActionButton(
                        icon: Icons.copy_all,
                        tooltip: 'Copiar',
                        onPressed: () async {
                          await FlutterClipboard.copy(entry.value);
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copiado al portapapeles')));
                        },
                      ),
                      _HistoryActionButton(
                        icon: Icons.ios_share,
                        tooltip: 'Compartir',
                        onPressed: () async {
                          if (entry.isSensitive) {
                            final proceed = await _confirmHistorySensitive(context);
                            if (proceed != true) return;
                          }
                          await Share.share(entry.value, subject: entry.displayLabel);
                        },
                      ),
                      _HistoryActionButton(
                        icon: entry.favorite ? Icons.star : Icons.star_border,
                        tooltip: entry.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
                        onPressed: () async {
                          final updated = entry.copyWith(favorite: !entry.favorite);
                          await AppStateScope.of(context).updateHistory(updated);
                        },
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (now.difference(date).inHours < 24) {
      return DateFormat.Hm().format(date);
    }
    return DateFormat.yMd().format(date);
  }
}

class _HistoryActionButton extends StatelessWidget {
  const _HistoryActionButton({required this.icon, required this.tooltip, required this.onPressed});

  final IconData icon;
  final String tooltip;
  final Future<void> Function() onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Semantics(
        button: true,
        label: tooltip,
        child: SizedBox(
          width: 48,
          height: 48,
          child: IconButton(
            onPressed: () => onPressed(),
            icon: Icon(icon, size: 22),
            splashRadius: 24,
            padding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}

Future<bool?> _confirmHistorySensitive(BuildContext context) {
  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Contenido sensible'),
      content: const Text('Este elemento contiene datos sensibles. ¿Seguro que deseas compartirlo?'),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
        FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Continuar')),
      ],
    ),
  );
}


class HistoryDetailSheet extends StatefulWidget {
  const HistoryDetailSheet({super.key, required this.entry, required this.onUpdate, required this.onDelete});

  final HistoryEntry entry;
  final Future<void> Function(HistoryEntry entry) onUpdate;
  final Future<void> Function(HistoryEntry entry) onDelete;

  @override
  State<HistoryDetailSheet> createState() => _HistoryDetailSheetState();
}

class _HistoryDetailSheetState extends State<HistoryDetailSheet> {
  late TextEditingController _labelController;
  late TextEditingController _noteController;
  bool _favorite = false;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.entry.displayLabel);
    _noteController = TextEditingController(text: widget.entry.note);
    _favorite = widget.entry.favorite;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final entry = widget.entry;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                CircleAvatar(child: Icon(entry.type.icon)),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _labelController,
                    decoration: const InputDecoration(labelText: 'Etiqueta'),
                  ),
                ),
                IconButton(
                  tooltip: _favorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
                  icon: Icon(_favorite ? Icons.star : Icons.star_border),
                  onPressed: () => setState(() => _favorite = !_favorite),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SelectableText(entry.value, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Notas'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              children: [
                  FilledButton.icon(
                    onPressed: () async {
                      await FlutterClipboard.copy(entry.value);
                      if (mounted) Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.copy_all),
                    label: const Text('Copiar'),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () async {
                      if (entry.isSensitive) {
                        final proceed = await _confirmHistorySensitive(context);
                        if (proceed != true) return;
                      }
                      await Share.share(entry.value, subject: entry.displayLabel);
                    },
                    icon: const Icon(Icons.share),
                    label: const Text('Compartir'),
                  ),
                TextButton.icon(
                  onPressed: () async {
                    await widget.onDelete(entry);
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Eliminar'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () async {
                final updated = entry.copyWith(
                  displayLabel: _labelController.text,
                  favorite: _favorite,
                  note: _noteController.text,
                );
                await widget.onUpdate(updated);
                Navigator.of(context).pop();
              },
              child: const Text('Guardar cambios'),
            ),
          ],
        ),
      ),
    );
  }
}


class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key, required this.onFabIntentChanged});

  final FabIntentNotifier onFabIntentChanged;

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  @override
  void initState() {
    super.initState();
    widget.onFabIntentChanged.value = FabIntent.none;
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final themeMode = appState.themeMode;
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 120),
          children: [
            _SettingsSection(
              title: 'Apariencia',
              children: [
                ToggleButtons(
                  isSelected: [themeMode == ThemeMode.light, themeMode == ThemeMode.dark, themeMode == ThemeMode.system],
                  borderRadius: BorderRadius.circular(16),
                  onPressed: (index) {
                    final modes = [ThemeMode.light, ThemeMode.dark, ThemeMode.system];
                    appState.setThemeMode(modes[index]);
                  },
                  children: const [
                    Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Icon(Icons.light_mode)),
                    Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Icon(Icons.dark_mode)),
                    Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Icon(Icons.brightness_auto)),
                  ],
                ),
                SwitchListTile(
                  title: const Text('Alto contraste'),
                  subtitle: const Text('Aumenta la legibilidad de textos y controles'),
                  value: appState.highContrast,
                  onChanged: (value) => appState.setHighContrast(value),
                ),
              ],
            ),
            _SettingsSection(
              title: 'Privacidad',
              children: [
                SwitchListTile(
                  title: const Text('Guardar datos sensibles automáticamente'),
                  subtitle: const Text('Incluye Wi-Fi, teléfonos y SMS en el historial'),
                  value: appState.autoSaveSensitive,
                  onChanged: (value) => appState.setAutoSaveSensitive(value),
                ),
                ListTile(
                  title: const Text('Autolimpieza del historial'),
                  subtitle: Text('${appState.autoCleanDays} días'),
                  trailing: DropdownButton<int>(
                    value: appState.autoCleanDays,
                    items: const [0, 7, 30, 90]
                        .map((days) => DropdownMenuItem(value: days, child: Text(days == 0 ? 'Desactivado' : '$days días')))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        appState.setAutoCleanDays(value);
                      }
                    },
                  ),
                ),
              ],
            ),
            _SettingsSection(
              title: 'Exportación',
              children: [
                ListTile(
                  title: const Text('Escala por defecto'),
                  trailing: DropdownButton<int>(
                    value: appState.defaultScale,
                    items: const [1, 2, 3, 4]
                        .map((scale) => DropdownMenuItem(value: scale, child: Text('${scale}x')))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        appState.setDefaultScale(value);
                      }
                    },
                  ),
                ),
                ListTile(
                  title: const Text('Patrón de nombre de archivo'),
                  subtitle: Text(appState.defaultFileName),
                  onTap: () async {
                    final controller = TextEditingController(text: appState.defaultFileName);
                    final result = await showDialog<String>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Patrón de exportación'),
                        content: TextField(
                          controller: controller,
                          decoration: const InputDecoration(helperText: '{type} {date} {slug} disponibles'),
                        ),
                        actions: [
                          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
                          ElevatedButton(onPressed: () => Navigator.of(context).pop(controller.text), child: const Text('Guardar')),
                        ],
                      ),
                    );
                    if (result != null) {
                      await appState.setDefaultFileName(result);
                    }
                  },
                ),
              ],
            ),
            _SettingsSection(
              title: 'Plantillas',
              children: [
                ReorderableListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: appState.templates.length,
                  onReorder: (oldIndex, newIndex) { appState.reorderTemplates(oldIndex, newIndex); },
                  itemBuilder: (context, index) {
                    final template = appState.templates[index];
                    return ListTile(
                      key: ValueKey(template.id),
                      leading: Icon(template.type.icon),
                      title: Text(template.title),
                      subtitle: Text(template.description),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => appState.removeTemplate(template.id),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),
            Center(
              child: Text('Nexus QR v3.0.0', style: Theme.of(context).textTheme.bodySmall),
            ),
          ],
        );
      },
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}


class OnboardingOverlay extends StatefulWidget {
  const OnboardingOverlay({super.key, required this.onClose});

  final VoidCallback onClose;

  @override
  State<OnboardingOverlay> createState() => _OnboardingOverlayState();
}

class _OnboardingOverlayState extends State<OnboardingOverlay> {
  int _index = 0;

  final List<_OnboardingSlide> _slides = const [
    _OnboardingSlide(
      icon: Icons.auto_awesome,
      title: 'Genera códigos en segundos',
      description: 'Elige plantillas inteligentes y personaliza colores, logos y márgenes.'
    ),
    _OnboardingSlide(
      icon: Icons.center_focus_strong,
      title: 'Escáner profesional',
      description: 'Overlay con láser animado, linterna y acciones inteligentes por tipo de contenido.'
    ),
    _OnboardingSlide(
      icon: Icons.history,
      title: 'Historial con control total',
      description: 'Filtra, busca, selecciona y gestiona tus códigos con un par de toques.'
    ),
  ];

  void _next() {
    if (_index >= _slides.length - 1) {
      widget.onClose();
    } else {
      setState(() => _index++);
    }
  }

  @override
  Widget build(BuildContext context) {
    final slide = _slides[_index];
    return Material(
      color: Colors.black.withOpacity(0.7),
      child: Center(
        child: Card(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(slide.icon, size: 72, color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 16),
                Text(slide.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                Text(slide.description, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < _slides.length; i++)
                      Container(
                        width: 12,
                        height: 12,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: i == _index ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.outlineVariant,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _next,
                  child: Text(_index == _slides.length - 1 ? 'Empezar' : 'Siguiente'),
                ),
                TextButton(onPressed: widget.onClose, child: const Text('Saltar')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingSlide {
  const _OnboardingSlide({required this.icon, required this.title, required this.description});

  final IconData icon;
  final String title;
  final String description;
}

List<_HistoryListItem> groupHistoryEntries(List<HistoryEntry> entries, Locale locale) {
  final items = <_HistoryListItem>[];
  String? currentLabel;
  for (final entry in entries) {
    final label = _historyGroupLabel(entry.createdAt, locale);
    if (label != currentLabel) {
      items.add(_HistoryListItem.header(label));
      currentLabel = label;
    }
    items.add(_HistoryListItem.entry(entry));
  }
  return items;
}

String _historyGroupLabel(DateTime date, Locale locale) {
  final now = DateTime.now();
  final difference = DateUtils.dateOnly(now).difference(DateUtils.dateOnly(date)).inDays;
  if (difference == 0) return 'Hoy';
  if (difference == 1) return 'Ayer';
  if (difference < 7) return 'Últimos 7 días';
  if (difference < 30) return 'Este mes';
  final localeName = locale.toString();
  return DateFormat.yMMMM(localeName).format(date);
}

