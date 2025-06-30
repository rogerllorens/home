import 'package:camera/camera.dart';
import 'stats.dart';

class SharedCamera {
  SharedCamera._();
  static final instance = SharedCamera._();

  CameraController? controller;
  Future<void>? _initFuture;

  Future<void> init() async {
    if (_initFuture != null) return _initFuture!;
    _initFuture = _internalInit();
    return _initFuture!;
  }

  Future<void> _internalInit() async {
    final start = DateTime.now();
    final cams = await availableCameras();
    if (cams.isEmpty) return;
    final ctrl = CameraController(cams.first, ResolutionPreset.medium, enableAudio: false);
    await ctrl.initialize();
    controller = ctrl;
    final duration = DateTime.now().difference(start);
    StatsHelper.recordOpenTime(duration);
  }
}
