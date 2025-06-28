import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _appAuth = const FlutterAppAuth();
  final _googleSignIn = GoogleSignIn();
  bool _loading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final resp = await http
          .post(Uri.parse('https://api.example.com/login'), body: {
        'email': _emailCtrl.text,
        'password': _passCtrl.text
      }).timeout(const Duration(seconds: 10));
      if (resp.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        final hasConsent = prefs.getBool('consent_mood') ?? false;
        context.read<UserModel>().login(_emailCtrl.text);
        if (!mounted) return;
        context.go(hasConsent ? '/home' : '/consent');
      } else {
        final msg = jsonDecode(resp.body)['error'] ?? 'Error en login';
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(msg)));
        }
      }
    } on TimeoutException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Tiempo agotado, intenta de nuevo')));
      }
    } on SocketException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Sin conexión, verifica tu internet')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Error inesperado')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _signInGoogle() async {
    try {
      final acct = await _googleSignIn.signIn();
      if (acct != null && mounted) {
        final prefs = await SharedPreferences.getInstance();
        final hasConsent = prefs.getBool('consent_mood') ?? false;
        context.read<UserModel>().login(acct.email);
        if (hasConsent) {
          context.go('/home');
        } else {
          context.go('/consent');
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error con Google Sign-In')),
        );
      }
    }
  }

  Future<void> _signInSSO() async {
    try {
      await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          'CLIENT_ID',
          'com.example:/callback',
          discoveryUrl:
              'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
          scopes: ['openid', 'profile', 'email'],
        ),
      );
      if (mounted) {
        context.read<UserModel>().login('sso_user');
        context.go('/home');
      }
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al iniciar sesión')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Ingresa tu email';
                  final r = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
                  if (!r.hasMatch(v)) return 'Email inválido';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passCtrl,
                decoration: const InputDecoration(labelText: 'Contraseña'),
                obscureText: true,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Contraseña requerida';
                  final r = RegExp(r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#\$&*~]).{8,}$');
                  if (!r.hasMatch(v)) {
                    return '8+ chars, mayúscula, minúscula, número y especial';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                    ? const CircularProgressIndicator()
                    : const Text('Continuar'),
              ),
              TextButton(
                onPressed: () => context.go('/register'),
                child: const Text('Crear cuenta'),
              ),
              TextButton(
                onPressed: () => context.go('/reset'),
                child: const Text('¿Olvidaste tu contraseña?'),
              ),
              TextButton(
                onPressed: () => context.go('/home'),
                child: const Text('Continuar como anónimo'),
              ),
              ElevatedButton.icon(
                onPressed: _signInSSO,
                icon: const Icon(Icons.login),
                label: const Text('Iniciar sesión con SSO'),
              ),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: _signInGoogle,
                icon: const Icon(Icons.g_mobiledata),
                label: const Text('Entrar con Google'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
