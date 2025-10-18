import 'dart:async';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

final appStartupProvider = FutureProvider<void>((ref) async {
  await Future.wait([
    _warmupDeviceInfo(),
    _requestStoragePermissions(),
    Future<void>.delayed(const Duration(milliseconds: 600)),
  ]);
});

Future<void> _warmupDeviceInfo() async {
  try {
    final info = DeviceInfoPlugin();
    await info.deviceInfo;
  } on PlatformException {
    // ignore missing permissions or unsupported platforms
  }
}

Future<void> _requestStoragePermissions() async {
  final status = await Permission.manageExternalStorage.status;
  if (!status.isGranted) {
    await Permission.manageExternalStorage.request();
  }
}
