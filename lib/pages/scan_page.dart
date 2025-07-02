import 'dart:developer';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:social_sharing_plus/social_sharing_plus.dart';
import 'package:showcaseview/showcaseview.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:add_2_calendar/add_2_calendar.dart';
import 'package:icalendar_parser/icalendar_parser.dart';
import '../sb_cache.dart';
import '../main.dart';
import '../widgets/scanly_logo.dart';
import '../shared_camera.dart';
import '../widgets/scan_overlay.dart';
import '../config.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import '../widgets/zxing_scanner.dart';
import '../stats.dart';
import 'map_page.dart';
import '../content_parser.dart';


class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  Barcode? result;
  final MobileScannerController controller = MobileScannerController();
  bool flashOn = false;
  bool frontCamera = false;
  bool _flashWasOn = false;
  late final AnimationController _pulse;
  late final AnimationController _lineController;
  late final AnimationController _zoomController;
  late final AnimationController _highlightController;
  PermissionStatus _permission = PermissionStatus.denied;
  bool _settingsPromptShown = false;
  bool _hideControls = false;
  bool _batch = false;
  int _batchCount = 0;
  DateTime? _batchStart;
  Duration _elapsed = Duration.zero;
  Timer? _elapsedTimer;
  Timer? _inactivityTimer;
  late final AnimationController _holdController;
  bool _barcodeMode = false;
  bool _showHint = true;
  bool _showCta = true;
  bool _initialized = false;
  bool _useZxing = false;
  String? _previewCode;
  final GlobalKey _batchKey = GlobalKey();

  Future<void> _saveContact(String vcard) async {
    final nameMatch = RegExp(r'N:([^;]*);([^;]*)').firstMatch(vcard);
    final given = nameMatch?.group(2) ?? '';
    final family = nameMatch?.group(1) ?? '';
    final telMatch = RegExp(r"TEL[^:]*:([^\n\r]+)").firstMatch(vcard);
    final phone = telMatch?.group(1) ?? '';
    if (await FlutterContacts.requestPermission()) {
      final contact = Contact()
        ..name.first = given
        ..name.last = family
        ..phones = [Phone(phone)];
      await FlutterContacts.insertContact(contact);
    }
  }

  Future<void> _saveEvent(String ics) async {
    try {
      final cal = ICalendar.fromString(ics);
      final component = cal.data.firstWhere((c) => c['type'] == 'VEVENT', orElse: () => {});
      if (component.isEmpty) return;
      final data = component['data'] as Map<String, dynamic>;
      final summary = data['SUMMARY'] as String? ?? 'Evento';
      final startRaw = data['DTSTART'] as String?;
      final endRaw = data['DTEND'] as String?;
      final start = startRaw != null ? DateTime.tryParse(startRaw) : null;
      final end = endRaw != null ? DateTime.tryParse(endRaw) : null;
      final event = Event(
        title: summary,
        description: data['DESCRIPTION'] as String? ?? '',
        location: data['LOCATION'] as String? ?? '',
        startDate: start ?? DateTime.now(),
        endDate: end ?? (start ?? DateTime.now()).add(const Duration(hours: 1)),
      );
      await Add2Calendar.addEvent2Cal(event);
    } catch (_) {}
  }

  Future<bool> _isUrlSafe(String url) async {
    if (!safeBrowsingNotifier.value) return true;
    final offline = offlineNotifier.value;
    return SafeBrowsingCache.checkUrl(url, offline: offline);
  }

  Future<void> _shareText(String text) async {
    await showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Compartir'),
              onTap: () {
                Share.share(text);
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.whatsapp),
              title: const Text('WhatsApp'),
              onTap: () async {
                await SocialSharingPlus.shareToSocialMedia(
                  SocialPlatform.whatsapp,
                  text,
                  isOpenBrowser: false,
                  onAppNotInstalled: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('WhatsApp no instalado')),
                    );
                  },
                );
                if (context.mounted) Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.send),
              title: const Text('Telegram'),
              onTap: () async {
                await SocialSharingPlus.shareToSocialMedia(
                  SocialPlatform.telegram,
                  text,
                  isOpenBrowser: false,
                  onAppNotInstalled: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Telegram no instalado')),
                    );
                  },
                );
                if (context.mounted) Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<bool> _confirmOpenUrl(String url, bool safe) async {
    return await showDialog<bool>(
          context: context,
          builder: (d) {
            final uri = Uri.tryParse(url);
            return AlertDialog(
              title: Row(
                children: [
                  const CodeMaster ProLogo(variant: LogoVariant.scan, size: 24),
                  const SizedBox(width: 8),
                  Text(safe ? 'Enlace seguro' : 'Posible riesgo'),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(url, style: const TextStyle(fontFamily: 'monospace')),
                  if (uri != null) ...[
                    const SizedBox(height: 8),
                    Text('Dominio: ${uri.host}'),
                  ],
                  if (!safe)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        '⚠️ Detectado como inseguro por Safe Browsing',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: url));
                      Navigator.pop(d, null);
                    },
                    child: const Text('Copiar enlace')),
                TextButton(
                    onPressed: () => Navigator.pop(d, false),
                    child: const Text('Cancelar')),
                if (safe)
                  TextButton(
                      onPressed: () => Navigator.pop(d, true),
                      child: const Text('Abrir ahora')),
              ],
            );
          },
        ) ??
        false;
  }

  @override
  void initState() {
    super.initState();
    SharedCamera.instance.init();
    WidgetsBinding.instance.addObserver(this);
    _updatePermission();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
      lowerBound: 1.0,
      upperBound: 1.08,
    )..repeat(reverse: true);
    _lineController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _zoomController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
      lowerBound: 1.0,
      upperBound: 1.03,
    );
    _highlightController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _holdController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..addListener(() {
        if (mounted) setState(() {});
      });
    _batch = batchNotifier.value;
    batchNotifier.addListener(_onBatchChanged);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showHint = false);
    });
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) setState(() => _showCta = false);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final box = Hive.box('settings');
      if (!box.get('shownBatchTut', false)) {
        ShowCaseWidget.of(context).startShowCase([_batchKey]);
        box.put('shownBatchTut', true);
      }
    });
  }

  Future<void> _showResult(ContentInfo info, bool safe) async {
    final code = info.raw.isNotEmpty
        ? info.raw
        : (info.data.values.isNotEmpty ? info.data.values.first : '');
    final uri = Uri.tryParse(info.data['url'] ?? '');
    await showModalBottomSheet(
      context: context,
      builder: (ctx) {
        final actions = <Widget>[];
        void addCopy(String text) {
          actions.add(ElevatedButton.icon(
            icon: const Icon(Icons.copy),
            label: const Text('Copiar'),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: text));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Copiado al portapapeles')),
              );
            },
          ));
        }

        switch (info.type) {
          case ContentType.url:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.open_in_browser),
              label: const Text('Abrir'),
              onPressed: () async {
                bool open = true;
                if (confirmOpenNotifier.value || !safe) {
                  open = await _confirmOpenUrl(info.data['url']!, safe);
                }
                if (open) {
                  Navigator.pop(ctx);
                  await launchUrl(Uri.parse(info.data['url']!));
                }
              },
            ));
            addCopy(info.data['url']!);
            break;
          case ContentType.tel:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.phone),
              label: const Text('Llamar'),
              onPressed: () async {
                await launchUrl(Uri.parse('tel:${info.data['tel']}'));
              },
            ));
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.message),
              label: const Text('SMS'),
              onPressed: () async {
                await launchUrl(Uri.parse('sms:${info.data['tel']}'));
              },
            ));
            addCopy(info.data['tel']!);
            break;
          case ContentType.sms:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.message),
              label: const Text('SMS'),
              onPressed: () async {
                await launchUrl(Uri.parse('sms:${info.data['number']}?body=${Uri.encodeComponent(info.data['body'] ?? '')}'));
              },
            ));
            addCopy('${info.data['number']}:${info.data['body']}');
            break;
          case ContentType.email:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.email),
              label: const Text('Email'),
              onPressed: () async {
                await launchUrl(Uri.parse('mailto:${info.data['email']}'));
              },
            ));
            addCopy(info.data['email']!);
            break;
          case ContentType.geo:
            final lat = double.tryParse(info.data['lat'] ?? '');
            final lon = double.tryParse(info.data['lon'] ?? '');
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.map),
              label: const Text('Ver en mapa'),
              onPressed: () async {
                Navigator.pop(ctx);
                if (lat != null && lon != null) {
                  await Navigator.push(context, MaterialPageRoute(
                      builder: (_) => MapPage(lat: lat, lon: lon)));
                } else {
                  await launchUrl(Uri.parse('geo:${info.data['geo']}'));
                }
              },
            ));
            addCopy(info.data['geo']!);
            break;
          case ContentType.wifi:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.wifi),
              label: const Text('Conectar'),
              onPressed: () async {
                await launchUrl(Uri.parse(info.raw));
              },
            ));
            addCopy(info.data['password'] ?? '');
            break;
          case ContentType.contact:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.save),
              label: const Text('Guardar contacto'),
              onPressed: () async {
                await _saveContact(info.raw);
                if (mounted) Navigator.pop(ctx);
              },
            ));
            addCopy(info.raw);
            break;
          case ContentType.event:
            actions.add(ElevatedButton.icon(
              icon: const Icon(Icons.event),
              label: const Text('Guardar evento'),
              onPressed: () async {
                await _saveEvent(info.raw);
                if (mounted) Navigator.pop(ctx);
              },
            ));
            final summary = info.data['summary'];
            final loc = info.data['location'];
            if (summary != null || loc != null) {
              actions.insert(
                  0,
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (summary != null && summary.isNotEmpty)
                          Text('Evento: $summary'),
                        if (loc != null && loc.isNotEmpty)
                          Text('Lugar: $loc'),
                      ],
                    ),
                  ));
            }
            addCopy(info.raw);
            break;
          case ContentType.text:
            addCopy(code);
            break;
        }

        actions.add(ElevatedButton.icon(
          icon: const Icon(Icons.share),
          label: const Text('Compartir'),
          onPressed: () {
            Navigator.pop(ctx);
            _shareText(code);
          },
        ));

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(code, textAlign: TextAlign.center),
                const SizedBox(height: 12),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 8,
                  children: actions,
                ),
                if (!safe)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Text('⚠️ La URL es peligrosa', textAlign: TextAlign.center),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pulse.dispose();
    _lineController.dispose();
    _zoomController.dispose();
    _highlightController.dispose();
    _holdController.dispose();
    _elapsedTimer?.cancel();
    _inactivityTimer?.cancel();
    controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _updatePermission();
    }
  }

  Future<void> _updatePermission() async {
    final status = await Permission.camera.status;
    if (!mounted) return;
    setState(() => _permission = status);
  }

  Future<void> _requestPermission() async {
    var status = await Permission.camera.status;
    if (status.isDenied) {
      if (await Permission.camera.shouldShowRequestRationale) {
        final proceed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Row(
              children: const [
                Icon(Icons.camera_alt, size: 28),
                SizedBox(width: 8),
                Text('Permiso requerido'),
              ],
            ),
            content: const Text('La cámara es necesaria para escanear códigos QR en tiempo real.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Continuar')),
            ],
          ),
        );
        if (proceed != true) return;
      }
      status = await Permission.camera.request();
    }
    if (status.isPermanentlyDenied && !_settingsPromptShown) {
      _settingsPromptShown = true;
      final open = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Row(
            children: const [
              Icon(Icons.camera_alt, size: 28),
              SizedBox(width: 8),
              Text('Permiso requerido'),
            ],
          ),
          content: const Text('Habilita la cámara en los ajustes de la aplicación.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Abrir ajustes')),
          ],
        ),
      );
      if (open == true) {
        await openAppSettings();
      }
    }
    if (!mounted) return;
    setState(() => _permission = status);
  }

  void _onBatchChanged() {
    if (batchNotifier.value && !_batch) {
      _startBatch();
    } else if (!batchNotifier.value && _batch) {
      _endBatch();
    }
  }

  void _startBatch() {
    _batchStart = DateTime.now();
    _batchCount = 0;
    _elapsed = Duration.zero;
    _elapsedTimer?.cancel();
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _elapsed = DateTime.now().difference(_batchStart!);
      });
    });
    _resetInactivity();
    _resume();
    setState(() => _batch = true);
  }

  void _resetInactivity() {
    _inactivityTimer?.cancel();
    _inactivityTimer = Timer(const Duration(seconds: 30), _endBatch);
  }

  void _endBatch() {
    if (!_batch) return;
    _elapsedTimer?.cancel();
    _inactivityTimer?.cancel();
    final duration = DateTime.now().difference(_batchStart ?? DateTime.now());
    final count = _batchCount;
    batchNotifier.value = false;
    setState(() {
      _batch = false;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Has escaneado $count códigos en ${duration.inSeconds}s'),
        ),
      );
    }
  }


  void _onDetect(BarcodeCapture capture) async {
    if (capture.barcodes.isEmpty) return;
    final scanData = capture.barcodes.first;
    _zoomController.forward().then((_) => _zoomController.reverse());
    _highlightController.forward(from: 0);
    SystemSound.play(SystemSoundType.click);
    setState(() {
      result = scanData;
      _previewCode = scanData.rawValue;
      _hideControls = true;
      _showHint = false;
      _showCta = false;
    });
    if (_previewCode != null) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _previewCode = null);
      });
    }
    HapticFeedback.mediumImpact();
    if (!_batch) {
      if (flashOn) {
        _flashWasOn = true;
        await controller.toggleTorch();
        flashOn = false;
      }
      controller.stop();
    } else {
      _batchCount++;
      _resetInactivity();
    }
    final code = scanData.rawValue;
    if (code != null) {
      final info = ContentParser.parse(code);
      bool safe = true;
      if (info.type == ContentType.url) {
        safe = await _isUrlSafe(code);
      }
      if (!_batch) {
        await _showResult(info, safe);
      }
      _saveHistory(code, safe, scanData.format.name, type: info.type.name);
    }
  }

  void _onDetectString(String code) async {
    _zoomController.forward().then((_) => _zoomController.reverse());
    _highlightController.forward(from: 0);
    SystemSound.play(SystemSoundType.click);
    setState(() {
      _previewCode = code;
      _hideControls = true;
      _showHint = false;
      _showCta = false;
    });
    if (_previewCode != null) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _previewCode = null);
      });
    }
    HapticFeedback.mediumImpact();
    if (!_batch) {
      if (flashOn) {
        _flashWasOn = true;
        await controller.toggleTorch();
        flashOn = false;
      }
      controller.stop();
    } else {
      _batchCount++;
      _resetInactivity();
    }
    final info = ContentParser.parse(code);
    bool safe = true;
    if (info.type == ContentType.url) {
      safe = await _isUrlSafe(code);
    }
    if (!_batch) {
      await _showResult(info, safe);
    }
    _saveHistory(code, safe, 'zxing', type: info.type.name);
  }

  void _resume() {
    try {
      controller.start();
    } catch (_) {
      setState(() => _useZxing = true);
      return;
    }
    if (_flashWasOn) {
      controller.toggleTorch();
      flashOn = true;
      _flashWasOn = false;
    }
    setState(() {
      _hideControls = false;
      result = null;
    });
  }

  void _saveHistory(String code, bool safe, String mode,
      {required String type, String? translation, String? lang}) {
    final box = Hive.box('history');
    final key = box.keys.cast<dynamic?>().firstWhere(
      (k) {
        final val = box.get(k);
        return val is Map && val['code'] == code;
      },
      orElse: () => null,
    );
    final now = DateTime.now().toIso8601String();
    if (key != null) {
      final Map value = Map.from(box.get(key));
      value['count'] = (value['count'] ?? 1) + 1;
      value['lastDate'] = now;
      value['firstDate'] = value['firstDate'] ?? now;
      value['safe'] = safe;
      value['checkTs'] = now;
      value['type'] = type;
      if (translation != null) value['translation'] = translation;
      if (lang != null) value['lang'] = lang;
      value['kind'] = 'scanned';
      box.put(key, value);
      value['pending'] = offlineNotifier.value;
    } else {
      box.add({
        'pending': offlineNotifier.value,
        'code': code,
        'firstDate': now,
        'lastDate': now,
        'count': 1,
        'safe': safe,
        'checkTs': now,
        'type': type,
        'kind': 'scanned',
        if (translation != null) 'translation': translation,
        if (lang != null) 'lang': lang,
      });
    }
    StatsHelper.recordScan(mode);
    if (AppConfig.enableAnalytics) {
      FirebaseAnalytics.instance.logEvent(
        name: 'qr_scanned',
        parameters: {'mode': mode, 'type': type},
      );
    }
    final monthTotal = StatsHelper.getMonthlyTotal(DateTime.now());
    if (monthTotal == 200 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Has escaneado 200 códigos este mes')));
    }
    final Map stored = Map.from(box.get(key ?? box.keys.last));
    final count = stored['count'] ?? 1;
    if (count == 5 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('"${stored['code']}" se escaneó 5 veces')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_permission != PermissionStatus.granted) {
      return Scaffold(
        body: Center(
          child: ElevatedButton(
            onPressed: _requestPermission,
            child: const Text("Permitir cámara"),
          ),
        ),
      );
    }
    return OrientationBuilder(
      builder: (context, orientation) {
        return ShowCaseWidget(
          builder: Builder(
            builder: (context) => Scaffold(
          body: GestureDetector(
        onTap: _resume,
        behavior: HitTestBehavior.opaque,
        child: Semantics(
          label: 'Vista de cámara. Toca para reanudar el escaneo',
          container: true,
          child: Stack(
          children: [
            const Positioned(
              top: 32,
              left: 0,
              right: 0,
              child: Center(
                child: CodeMaster ProLogo(variant: LogoVariant.scan),
              ),
            ),
            ValueListenableBuilder<bool>(
              valueListenable: offlineNotifier,
              builder: (context, off, _) => off
                  ? const Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: ColoredBox(
                        color: Colors.amber,
                        child: Padding(
                          padding: EdgeInsets.all(4),
                          child: Text(
                            '⚠️ Sin conexión – verificación deshabilitada',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.black),
                          ),
                        ),
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
            if (_batch)
              Positioned(
                top: 80,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  margin: const EdgeInsets.symmetric(horizontal: 32),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Modo lote: $_batchCount - ${_elapsed.inSeconds}s',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ScaleTransition(
              scale: _zoomController,
              child: GestureDetector(
                child: Stack(
                  children: [
                    if (!_useZxing)
                      MobileScanner(
                        controller: controller,
                        onDetect: _onDetect,
                        fit: BoxFit.cover,
                      )
                    else
                      ZxingScanner(onDetect: _onDetectString),
                    ScanOverlay(
                      barcodeMode: _barcodeMode,
                      highlight: _highlightController,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    if (!_initialized)
                      const Positioned.fill(
                        child: ColoredBox(
                          color: Colors.black87,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _highlightController,
              builder: (context, child) {
                final alpha = (0x66 + (0x33 * _highlightController.value)).round();
                return ColoredBox(
                  color: Color.fromARGB(alpha, 0, 0, 0),
                );
              },
            ),
          ),
          Center(
            child: ScaleTransition(
              scale: _pulse,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_showHint)
                    const Positioned(
                      bottom: -30,
                      child: Text('Toca para escanear',
                          style: TextStyle(color: Colors.white70)),
                    ),
                  AnimatedBuilder(
                    animation: _lineController,
                    builder: (context, child) {
                      return Positioned(
                        top: (_barcodeMode ? 120 : 250) * _lineController.value,
                        child: Container(
                          width: _barcodeMode ? 200 : 230,
                          height: 2,
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.6),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          FadeTransition(
            opacity: _highlightController.drive(Tween(begin: 1.0, end: 0.0)),
            child: Center(
              child: Container(
                width: _barcodeMode ? 300 : 260,
                height: _barcodeMode ? 140 : 260,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.greenAccent, width: 4),
                ),
              ),
            ),
          ),
          if (_previewCode != null)
            Positioned(
              bottom: 220,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _previewCode!,
                    style: const TextStyle(color: Colors.white),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
          child: ScaleTransition(
            scale: _pulse,
            child: GestureDetector(
              onTapDown: (_) => _holdController.forward(),
              onTapUp: (_) {
                if (_holdController.isCompleted) {
                  batchNotifier.value = true;
                } else {
                  _resume();
                }
                _holdController.reset();
              },
              onTapCancel: () => _holdController.reset(),
              onDoubleTap: _endBatch,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_holdController.value > 0)
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CircularProgressIndicator(
                        value: _holdController.value,
                        valueColor: AlwaysStoppedAnimation<Color>(
                            Theme.of(context).colorScheme.secondary),
                        backgroundColor: Colors.white24,
                        strokeWidth: 4,
                      ),
                    ),
                  Material(
                    color: Theme.of(context).colorScheme.primary,
                    shape: const CircleBorder(),
                    child: InkWell(
                      onTap: () {},
                      customBorder: const CircleBorder(),
                      splashColor: Colors.white24,
                      child: Semantics(
                        label: 'Escanear cámara',
                        button: true,
                        child: const SizedBox(
                          width: 100,
                          height: 100,
                          child: Icon(Icons.center_focus_strong,
                              color: Colors.white, size: 40),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_showCta && !_batch)
            Positioned(
              bottom: 140,
              left: 0,
              right: 0,
              child: AnimatedOpacity(
                opacity: _showCta ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: const Text(
                  'Mantén pulsado para lote',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70),
                ),
              ),
            ),
          Positioned(
            left: 16,
            top: 40,
            child: AnimatedOpacity(
              opacity: _hideControls ? 0.0 : 1.0,
              duration: const Duration(milliseconds: 300),
              child: FloatingActionButton(
                heroTag: 'flash',
                tooltip: 'Alternar flash',
                backgroundColor: Colors.black54,
                onPressed: () async {
                  await controller.toggleTorch();
                  setState(() {
                    flashOn = controller.torchState.value == TorchState.on;
                  });
                },
                child: Icon(
                  flashOn ? Icons.flash_on : Icons.flash_off,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          Positioned(
            right: 16,
            top: 40,
            child: AnimatedOpacity(
              opacity: _hideControls ? 0.0 : 1.0,
              duration: const Duration(milliseconds: 300),
              child: FloatingActionButton(
                heroTag: 'camera',
                tooltip: 'Cambiar cámara',
                backgroundColor: Colors.black54,
                onPressed: () async {
                  await controller.switchCamera();
                  setState(() {
                    frontCamera = controller.cameraFacing == CameraFacing.front;
                  });
                },
                child: const Icon(Icons.cameraswitch, color: Colors.white),
              ),
            ),
          ),
          Positioned(
            right: 16,
            top: 110,
            child: AnimatedOpacity(
              opacity: _hideControls ? 0.0 : 1.0,
              duration: const Duration(milliseconds: 300),
              child: Showcase(
                key: _batchKey,
                description: 'Activa el modo lote',
                child: FloatingActionButton(
                  heroTag: 'batch',
                  tooltip: 'Modo batch',
                  backgroundColor: Colors.black54,
                  onPressed: () {
                    batchNotifier.value = !batchNotifier.value;
                  },
                  child: Icon(
                    batchNotifier.value ? Icons.all_inclusive : Icons.looks_one,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            right: 16,
            top: 180,
            child: AnimatedOpacity(
              opacity: _hideControls ? 0.0 : 1.0,
              duration: const Duration(milliseconds: 300),
              child: FloatingActionButton(
                heroTag: 'mode',
                tooltip: 'Cambiar modo',
                backgroundColor: Colors.black54,
                onPressed: () {
                  setState(() => _barcodeMode = !_barcodeMode);
                },
                child: Semantics(
                  label: _barcodeMode ? 'Modo QR' : 'Modo barras',
                  toggleable: true,
                  child: Icon(
                    _barcodeMode ? Icons.qr_code : Icons.view_week,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
 }
}
