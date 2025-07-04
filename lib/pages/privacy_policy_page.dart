import 'package:flutter/material.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Política de privacidad')),
      body: const Padding(
        padding: EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Text('''POLÍTICA DE PRIVACIDAD DE SCANLY (España)

Fecha de entrada en vigor: 01/07/2025

1. RESPONSABLE
– Nombre: CodeMaster Pro
– País: España

2. DATOS QUE RECOPILAMOS
– No recopilamos datos personales identificables.
– Registramos datos de uso, fallos y tiempos de carga.
– No almacenamos contactos ni contenido de códigos.

3. FINALIDADES
– Mejorar experiencia y rendimiento.
– Ofrecer soporte técnico.
– Detectar errores.

4. CONSERVACIÓN
– Datos de uso: hasta 12 meses.
– Historial: solo si lo activas en ajustes.

5. COMPARTICIÓN
– No compartimos con terceros, salvo por mandato legal.
– Solo usamos Google Safe Browsing si activado.

6. DERECHOS
– Acceso, rectificación, supresión, limitación, oposición y portabilidad.
– Contacto: scanlyqr@gmail.com

7. CAMBIOS
– Aviso 30 días antes de actualizar la política.'''),
        ),
      ),
    );
  }
}
