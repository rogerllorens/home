import 'dart:io';
import 'dart:ui' as ui;
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';
import 'package:lottie/lottie.dart';
import 'package:social_sharing_plus/social_sharing_plus.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:in_app_review/in_app_review.dart';
import '../config.dart';

import '../widgets/scanly_logo.dart';

enum _QrType { text, phone, sms, email, wifi, vcard, geo }

class GeneratePage extends StatefulWidget {
  const GeneratePage({super.key});

  @override
  State<GeneratePage> createState() => _GeneratePageState();
}

class _GeneratePageState extends State<GeneratePage>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _smsCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _wifiSsidCtrl = TextEditingController();
  final _wifiPassCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _geoLatCtrl = TextEditingController();
  final _geoLngCtrl = TextEditingController();
  _QrType _type = _QrType.text;
  late final TabController _tabs;
  final GlobalKey _qrKey = GlobalKey();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  int? _version;
  int _errorLevel = QrErrorCorrectLevel.M;
  Color _fgColor = Colors.black;
  Color _bgColor = Colors.white;
  Color _gradientColor = Colors.blue;
  bool _useGradient = false;
  QrDataModuleShape _dataShape = QrDataModuleShape.square;
  QrEyeShape _eyeShape = QrEyeShape.square;
  double _padding = 10;
  File? _logo;
  double _logoSize = 40;

  InputDecoration _dec(String label) => InputDecoration(
        labelText: label,
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      );

  void _saveGenerated(String code) {
    final box = Hive.box('history');
    final key = box.keys.cast<dynamic?>().firstWhere(
      (k) {
        final val = box.get(k);
        return val is Map && val['code'] == code && val['kind'] == 'generated';
      },
      orElse: () => null,
    );
    final now = DateTime.now().toIso8601String();
    if (key != null) {
      final Map value = Map.from(box.get(key));
      value['count'] = (value['count'] ?? 1) + 1;
      value['lastDate'] = now;
      box.put(key, value);
    } else {
      box.add({
        'code': code,
        'firstDate': now,
        'lastDate': now,
        'count': 1,
        'type': _type.name,
        'kind': 'generated',
      });
    }
  }

  String _composeData() {
    switch (_type) {
      case _QrType.phone:
        return 'tel:${_phoneCtrl.text}';
      case _QrType.sms:
        final msg = Uri.encodeComponent(_smsCtrl.text);
        return 'smsto:${_phoneCtrl.text}:$msg';
      case _QrType.email:
        final subj = Uri.encodeComponent(_subjectCtrl.text);
        final body = Uri.encodeComponent(_smsCtrl.text);
        return 'mailto:${_emailCtrl.text}?subject=$subj&body=$body';
      case _QrType.wifi:
        final t = 'WIFI:S:${_wifiSsidCtrl.text};T:WPA;P:${_wifiPassCtrl.text};;';
        return t;
      case _QrType.vcard:
        return 'BEGIN:VCARD\nFN:${_nameCtrl.text}\nEND:VCARD';
      case _QrType.geo:
        return 'geo:${_geoLatCtrl.text},${_geoLngCtrl.text}';
      case _QrType.text:
      default:
        return _controller.text;
    }
  }

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  Future<void> _pickLogo() async {
    var status = await Permission.photos.request();
    if (!status.isGranted) return;
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _logo = File(picked.path));
  }

  Future<File?> _capturePng() async {
    final boundary = _qrKey.currentContext?.findRenderObject()
        as RenderRepaintBoundary?;
    if (boundary == null) return;
    final image = await boundary.toImage(pixelRatio: 3);
    final byteData =
        await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) return;
    final bytes = byteData.buffer.asUint8List();
    final dir = await getTemporaryDirectory();
    final file =
        File('${dir.path}/qr_${DateTime.now().millisecondsSinceEpoch}.png');
    await file.writeAsBytes(bytes);
    return file;
  }

  bool _validateFields() {
    return _formKey.currentState?.validate() ?? false;
  }

  bool _checkContrast() {
    double luminance(Color c) {
      final r = c.red / 255.0;
      final g = c.green / 255.0;
      final b = c.blue / 255.0;
      final List<double> channels = [r, g, b].map((v) {
        v = v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4).toDouble();
        return v;
      }).toList();
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    final l1 = luminance(_fgColor) + 0.05;
    final l2 = luminance(_bgColor) + 0.05;
    final ratio = l1 > l2 ? l1 / l2 : l2 / l1;
    return ratio >= 4.5;
  }

  Future<void> _savePng() async {
    if (!_validateFields()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Completa los campos requeridos')));
      return;
    }
    _saveGenerated(_composeData());
    if (!_checkContrast()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('El contraste de colores puede dificultar la lectura del QR')));
    }
    final file = await _capturePng();
    if (file == null || !mounted) return;
    HapticFeedback.mediumImpact();
    if (AppConfig.enableAnalytics) {
      FirebaseAnalytics.instance.logEvent(name: 'qr_generated', parameters: {'type': _type.name});
    }
    _maybeAskReview();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('QR guardado'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Lottie.asset('assets/animations/success.json',
                width: 80, height: 80, repeat: false),
            Text('Imagen guardada en ${file.path}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cerrar'),
          ),
          TextButton(
            onPressed: () {
              Share.shareXFiles([XFile(file.path)], text: 'Mi QR CodeMaster Pro');
              Navigator.pop(ctx);
            },
            child: const Text('Compartir ahora'),
          ),
        ],
      ),
    );
  }

  Future<void> _savePdf() async {
    if (!_validateFields()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Completa los campos requeridos')));
      return;
    }
    _saveGenerated(_composeData());
    if (!_checkContrast()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('El contraste de colores puede dificultar la lectura del QR')));
    }
    final file = await _capturePng();
    if (file == null) return;
    if (AppConfig.enableAnalytics) {
      FirebaseAnalytics.instance.logEvent(name: 'qr_generated', parameters: {'type': _type.name, 'format': 'pdf'});
    }
    _maybeAskReview();
    HapticFeedback.selectionClick();
    final pdfDoc = pw.Document();
    final image = pw.MemoryImage(await file.readAsBytes());
    pdfDoc.addPage(pw.Page(build: (ctx) => pw.Center(child: pw.Image(image))));
    final bytes = await pdfDoc.save();
    final dir = await getTemporaryDirectory();
    final out = File('${dir.path}/qr_${DateTime.now().millisecondsSinceEpoch}.pdf');
    await out.writeAsBytes(bytes);
    if (!mounted) return;
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('QR guardado'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Lottie.asset('assets/animations/success.json',
                width: 80, height: 80, repeat: false),
            Text('PDF guardado en ${out.path}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cerrar'),
          ),
          TextButton(
            onPressed: () {
              Share.shareXFiles([XFile(out.path)], text: 'Mi QR CodeMaster Pro');
              Navigator.pop(ctx);
            },
            child: const Text('Compartir ahora'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveSvg() async {
    if (!_validateFields()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Completa los campos requeridos')));
      return;
    }
    _saveGenerated(_composeData());
    final qrPainter = QrPainter(
      data: _composeData(),
      version: _version ?? QrVersions.auto,
      errorCorrectionLevel: _errorLevel,
      color: _fgColor,
      emptyColor: _bgColor,
    );
    final svg = await qrPainter.toSvgString();
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/qr_${DateTime.now().millisecondsSinceEpoch}.svg');
    await file.writeAsString(svg);
    if (!mounted) return;
    if (AppConfig.enableAnalytics) {
      FirebaseAnalytics.instance.logEvent(name: 'qr_generated', parameters: {'type': _type.name, 'format': 'svg'});
    }
    _maybeAskReview();
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('QR guardado'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Lottie.asset('assets/animations/success.json',
                width: 80, height: 80, repeat: false),
            Text('SVG guardado en ${file.path}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cerrar'),
          ),
          TextButton(
            onPressed: () {
              Share.shareXFiles([XFile(file.path)], text: 'Mi QR CodeMaster Pro');
              Navigator.pop(ctx);
            },
            child: const Text('Compartir ahora'),
          ),
        ],
      ),
    );
  }

  Future<void> _shareQr() async {
    if (!_validateFields()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Completa los campos requeridos')));
      return;
    }
    _saveGenerated(_composeData());
    if (!_checkContrast()) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('El contraste de colores puede dificultar la lectura del QR')));
    }
    final file = await _capturePng();
    if (file == null) return;
    await showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Compartir'),
              onTap: () {
                Share.shareXFiles([XFile(file.path)], text: 'Mi QR CodeMaster Pro');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.whatsapp),
              title: const Text('WhatsApp'),
              onTap: () async {
                await SocialSharingPlus.shareToSocialMedia(
                  SocialPlatform.whatsapp,
                  '',
                  media: file.path,
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
                  '',
                  media: file.path,
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
    if (AppConfig.enableAnalytics) {
      FirebaseAnalytics.instance.logEvent(name: 'qr_shared');
    }
    _maybeAskReview();
  }

  void _maybeAskReview() {
    if (!AppConfig.enableAnalytics) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Te gusta CodeMaster Pro?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final review = InAppReview.instance;
              if (await review.isAvailable()) {
                showDialog(
                  context: context,
                  builder: (ctx2) => AlertDialog(
                    title: const Text('Valora la app'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx2),
                        child: const Text('Omitir'),
                      ),
                      TextButton(
                        onPressed: () async {
                          Navigator.pop(ctx2);
                          await review.requestReview();
                        },
                        child: const Text('Valorar'),
                      ),
                    ],
                  ),
                );
              }
            },
            child: const Text('Sí'),
          ),
        ],
      ),
    );
  }

  Future<Color?> _pickColor(Color current) async {
    Color? selected = current;
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selecciona color'),
        content: Wrap(
          spacing: 8,
          children: [
            Colors.black,
            Colors.white,
            Colors.blue,
            Colors.red,
            Colors.green,
            Colors.purple,
            Colors.orange
          ].map((c) {
            return GestureDetector(
              onTap: () {
                selected = c;
                Navigator.pop(context);
              },
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: c,
                  border: Border.all(color: Colors.grey.shade300),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
    return selected;
  }

  @override
  Widget build(BuildContext context) {
    final data = _composeData();
    final version = _version ?? QrVersions.auto;
    final qr = RepaintBoundary(
      key: _qrKey,
      child: QrImageView(
        data: data.isEmpty ? ' ' : data,
        version: version,
        errorCorrectionLevel: _errorLevel,
        size: 220,
        padding: EdgeInsets.all(_padding),
        backgroundColor: _bgColor,
        gradient: _useGradient
            ? LinearGradient(colors: [_fgColor, _gradientColor])
            : null,
        eyeStyle: QrEyeStyle(eyeShape: _eyeShape, color: _fgColor),
        dataModuleStyle:
            QrDataModuleStyle(dataModuleShape: _dataShape, color: _fgColor),
        embeddedImage: _logo == null ? null : FileImage(_logo!),
        embeddedImageStyle: QrEmbeddedImageStyle(size: Size.square(_logoSize)),
      ),
    );

    return OrientationBuilder(
      builder: (context, orientation) {
        final tabs = TabBar(
          controller: _tabs,
          labelColor: Theme.of(context).colorScheme.primary,
          tabs: const [
            Tab(text: 'Datos'),
            Tab(text: 'Estilo'),
            Tab(text: 'Exportar'),
          ],
        );
        final views = Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _buildDataTab(qr),
              _buildStyleTab(qr),
              _buildExportTab(qr),
            ],
          ),
        );
        if (orientation == Orientation.landscape) {
          return Scaffold(
            appBar: AppBar(
              centerTitle: true,
              title: const CodeMaster ProLogo(variant: LogoVariant.static),
            ),
            body: Row(
              children: [
                Expanded(child: Center(child: qr)),
                Expanded(
                  child: Column(
                    children: [tabs, views],
                  ),
                ),
              ],
            ),
          );
        }
        return Scaffold(
          appBar: AppBar(
            centerTitle: true,
            title: const CodeMaster ProLogo(variant: LogoVariant.static),
          ),
          body: Column(
            children: [tabs, views],
          ),
        );
      },
    );
  }

  Widget _buildDataTab(Widget qr) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: ListView(
          children: [
          DropdownButtonFormField<_QrType>(
            value: _type,
            decoration: const InputDecoration(labelText: 'Tipo'),
            items: const [
              DropdownMenuItem(value: _QrType.text, child: Text('Texto/URL')),
              DropdownMenuItem(value: _QrType.phone, child: Text('Teléfono')),
              DropdownMenuItem(value: _QrType.sms, child: Text('SMS')),
              DropdownMenuItem(value: _QrType.email, child: Text('Email')),
              DropdownMenuItem(value: _QrType.wifi, child: Text('Wi-Fi')),
              DropdownMenuItem(value: _QrType.vcard, child: Text('vCard')),
              DropdownMenuItem(value: _QrType.geo, child: Text('Geo')),
            ],
            onChanged: (v) => setState(() => _type = v ?? _QrType.text),
          ),
          const SizedBox(height: 8),
          if (_type == _QrType.text)
            TextFormField(
              controller: _controller,
              decoration: _dec('Texto o URL'),
              onChanged: (_) => setState(() {}),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          if (_type == _QrType.phone || _type == _QrType.sms)
            TextFormField(
              controller: _phoneCtrl,
              decoration: _dec('Teléfono'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          if (_type == _QrType.sms)
            TextFormField(
              controller: _smsCtrl,
              decoration: _dec('Mensaje'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          if (_type == _QrType.email)
            TextFormField(
              controller: _emailCtrl,
              decoration: _dec('Email'),
              validator: (v) =>
                  v != null && RegExp(r'^.+@.+\..+').hasMatch(v)
                      ? null
                      : 'Email inválido',
            ),
          if (_type == _QrType.email)
            TextFormField(
              controller: _subjectCtrl,
              decoration: _dec('Asunto'),
            ),
          if (_type == _QrType.email)
            TextFormField(
              controller: _smsCtrl,
              decoration: _dec('Mensaje'),
            ),
          if (_type == _QrType.wifi)
            TextFormField(
              controller: _wifiSsidCtrl,
              decoration: _dec('SSID'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          if (_type == _QrType.wifi)
            TextFormField(
              controller: _wifiPassCtrl,
              decoration: _dec('Contraseña'),
            ),
          if (_type == _QrType.vcard)
            TextFormField(
              controller: _nameCtrl,
              decoration: _dec('Nombre'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          if (_type == _QrType.geo)
            TextFormField(
              controller: _geoLatCtrl,
              decoration: _dec('Latitud'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          if (_type == _QrType.geo)
            TextFormField(
              controller: _geoLngCtrl,
              decoration: _dec('Longitud'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Requerido' : null,
            ),
          const SizedBox(height: 10),
          TextFormField(
            readOnly: true,
            decoration: const InputDecoration(labelText: 'Vista previa'),
            controller: TextEditingController(text: _composeData()),
          ),
          const SizedBox(height: 20),
          Center(child: qr),
        ],
      ),
    );
  }

  Widget _buildStyleTab(Widget qr) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(child: qr),
        const SizedBox(height: 20),
        DropdownButtonFormField<int?>(
          value: _version,
          decoration: const InputDecoration(labelText: 'Versión'),
          items: [
            const DropdownMenuItem(value: null, child: Text('Auto')),
            ...List.generate(10, (i) => i + 1)
                .map((v) => DropdownMenuItem(value: v, child: Text('$v'))),
          ],
          onChanged: (v) => setState(() => _version = v),
        ),
        DropdownButtonFormField<int>(
          value: _errorLevel,
          decoration:
              const InputDecoration(labelText: 'Corrección de errores'),
          items: const [
            DropdownMenuItem(value: QrErrorCorrectLevel.L, child: Text('L')),
            DropdownMenuItem(value: QrErrorCorrectLevel.M, child: Text('M')),
            DropdownMenuItem(value: QrErrorCorrectLevel.Q, child: Text('Q')),
            DropdownMenuItem(value: QrErrorCorrectLevel.H, child: Text('H')),
          ],
          onChanged: (v) => setState(() => _errorLevel = v ?? QrErrorCorrectLevel.M),
        ),
        SwitchListTile(
          title: const Text('Gradiente'),
          value: _useGradient,
          onChanged: (v) => setState(() => _useGradient = v),
        ),
        ListTile(
          title: const Text('Color principal'),
          trailing: Container(width: 24, height: 24, color: _fgColor),
          onTap: () async {
            final c = await _pickColor(_fgColor);
            if (c != null) setState(() => _fgColor = c);
          },
        ),
        if (_useGradient)
          ListTile(
            title: const Text('Color secundario'),
            trailing:
                Container(width: 24, height: 24, color: _gradientColor),
            onTap: () async {
              final c = await _pickColor(_gradientColor);
              if (c != null) setState(() => _gradientColor = c);
            },
          ),
        ListTile(
          title: const Text('Color fondo'),
          trailing: Container(width: 24, height: 24, color: _bgColor),
          onTap: () async {
            final c = await _pickColor(_bgColor);
            if (c != null) setState(() => _bgColor = c);
          },
        ),
        DropdownButtonFormField<QrDataModuleShape>(
          value: _dataShape,
          decoration:
              const InputDecoration(labelText: 'Forma de módulos'),
          items: const [
            DropdownMenuItem(
              value: QrDataModuleShape.square,
              child: Text('Cuadrado'),
            ),
            DropdownMenuItem(
              value: QrDataModuleShape.circle,
              child: Text('Círculo'),
            ),
          ],
          onChanged: (v) => setState(() => _dataShape = v!),
        ),
        DropdownButtonFormField<QrEyeShape>(
          value: _eyeShape,
          decoration: const InputDecoration(labelText: 'Forma de ojos'),
          items: const [
            DropdownMenuItem(
              value: QrEyeShape.square,
              child: Text('Cuadrado'),
            ),
            DropdownMenuItem(
              value: QrEyeShape.circle,
              child: Text('Círculo'),
            ),
          ],
          onChanged: (v) => setState(() => _eyeShape = v!),
        ),
        Slider(
          label: 'Padding',
          value: _padding,
          min: 0,
          max: 40,
          divisions: 40,
          onChanged: (v) => setState(() => _padding = v),
        ),
        ListTile(
          title: const Text('Logo'),
          trailing: _logo == null
              ? const Icon(Icons.add_photo_alternate)
              : Image.file(_logo!, width: 32, height: 32, fit: BoxFit.cover),
          onTap: _pickLogo,
        ),
        if (_logo != null)
          Slider(
            label: 'Tamaño logo',
            value: _logoSize,
            min: 20,
            max: 100,
            divisions: 16,
            onChanged: (v) => setState(() => _logoSize = v),
          ),
      ],
    );
  }

  Widget _buildExportTab(Widget qr) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Center(child: qr),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _savePng,
            child: const Text('Guardar PNG'),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _savePdf,
            child: const Text('Guardar PDF'),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _saveSvg,
            child: const Text('Guardar SVG'),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _shareQr,
            child: const Text('Compartir'),
          ),
        ],
      ),
    );
  }
}
