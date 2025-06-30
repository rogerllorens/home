import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapPage extends StatelessWidget {
  final double lat;
  final double lon;
  final String? label;
  const MapPage({super.key, required this.lat, required this.lon, this.label});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(label ?? 'Ubicación')),
      body: FlutterMap(
        options: MapOptions(center: LatLng(lat, lon), zoom: 15),
        children: [
          TileLayer(
            urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains: const ['a', 'b', 'c'],
            userAgentPackageName: 'com.scanly.app',
          ),
          MarkerLayer(markers: [
            Marker(
              point: LatLng(lat, lon),
              width: 40,
              height: 40,
              builder: (context) => const Icon(Icons.location_pin, color: Colors.red, size: 40),
            )
          ])
        ],
      ),
    );
  }
}
