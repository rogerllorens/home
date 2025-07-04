import 'package:flutter/material.dart';

class FAQPage extends StatelessWidget {
  const FAQPage({super.key});

  @override
  Widget build(BuildContext context) {
    final sections = {
      'Escaneo': [
        {
          'q': '¿Cómo cambiar la calidad del escaneo o detectar solo QR?',
          'a': 'Desde el botón ⚙️ en la pantalla de escaneo puedes elegir calidad y tipo.'
        },
        {
          'q': '¿Qué tipos de códigos puedo escanear?',
          'a': 'QR, EAN‑13, UPC‑A, Code128 y más. Activa cada tipo en el menú ⚙️.'
        },
        {
          'q': '¿Por qué no vibró al leer un código?',
          'a': 'Activa "Vibrar al detectar" en el mismo menú para recibir feedback háptico.'
        },
      ],
      'Generador QR': [
        {
          'q': '¿Qué campos puedo generar en un código QR?',
          'a': 'URL, texto, vCard, evento, Wi‑Fi, ubicación, email y SMS.'
        },
        {
          'q': '¿Puedo ver una vista previa antes de generar y compartir?',
          'a': 'Sí, la vista previa se actualiza al instante y permite ajustar el estilo.'
        },
        {
          'q': '¿Cómo cambio el color o añado un logo?',
          'a': 'En la pestaña de estilo puedes elegir colores y subir un logo manteniendo el contraste.'
        },
      ],
      'Historial': [
        {
          'q': '¿Por qué no detecta bien un código en mis fotos?',
          'a': 'Usa la galería para rotar, recortar y ajustar brillo antes de escanear.'
        },
        {
          'q': '¿Cómo busco un código que escaneé hace días?',
          'a': 'Utiliza la barra de búsqueda y los filtros por tipo dentro de Historial.'
        },
      ],
      'Seguridad': [
        {
          'q': '¿Cómo sé si un enlace es seguro?',
          'a': 'Activa la verificación con Safe Browsing en Ajustes.'
        },
      ],
      'Permisos': [
        {
          'q': '¿Cómo resetear permisos de cámara o galería?',
          'a': 'Ve a Ajustes del sistema > Apps > CodeMaster Pro > Permisos y actívalos.'
        },
      ],
    };
    return Scaffold(
      appBar: AppBar(title: const Text('Preguntas frecuentes')),
      body: ListView(
        children: sections.entries.map((e) {
          return ExpansionTile(
            leading: Icon(_iconForSection(e.key)),
            title: Text(e.key),
            children: e.value.map<Widget>((qa) {
              return ListTile(
                title: Text(qa['q']!),
                subtitle: Text(qa['a']!),
              );
            }).toList(),
          );
        }).toList(),
      ),
    );
  }

  IconData _iconForSection(String s) {
    switch (s) {
      case 'Escaneo':
        return Icons.search;
      case 'Generador QR':
        return Icons.qr_code_2;
      case 'Historial':
        return Icons.history;
      case 'Seguridad':
        return Icons.security;
      case 'Permisos':
        return Icons.vpn_key;
      default:
        return Icons.help;
    }
  }
}
