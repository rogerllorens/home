import 'dart:io';
import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers.dart';
import '../models/communities_model.dart';

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  XFile? _image;
  DateTime? _eventDate;
  bool _isEvent = false;
  bool _loading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.gallery);
    if (img != null) {
      setState(() => _image = img);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: DateTime(now.year + 1),
      initialDate: now,
    );
    if (picked != null) {
      setState(() => _eventDate = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isEvent && _eventDate == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Selecciona fecha')));
      return;
    }
    setState(() => _loading = true);
    final form = FormData();
    form.fields
      ..add(MapEntry('title', _titleCtrl.text))
      ..add(MapEntry('description', _descCtrl.text))
      ..add(MapEntry('isEvent', _isEvent.toString()));
    if (_eventDate != null) {
      form.fields
          .add(MapEntry('date', _eventDate!.toIso8601String()));
    }
    if (_image != null) {
      form.files.add(await MultipartFile.fromFile(_image!.path,
          filename: _image!.name));
    }
    try {
      await Dio()
          .post('https://api.example.com/posts', data: form)
          .timeout(const Duration(seconds: 30));
      final post = Post(title: _titleCtrl.text, description: _descCtrl.text);
      ref.read(communitiesProvider).addPost(post);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Publicado')));
        Navigator.of(context).pop();
      }
    } on DioException catch (e) {
      final msg = e.type == DioExceptionType.connectionTimeout
          ? 'Conexión lenta'
          : e.type == DioExceptionType.unknown
              ? 'Sin conexión'
              : 'Error del servidor';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(msg)));
    } catch (_) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Error al publicar')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Crear publicación')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Título'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Campo requerido' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descCtrl,
              decoration: const InputDecoration(labelText: 'Descripción'),
              maxLines: 4,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Checkbox(
                    value: _isEvent,
                    onChanged: (v) => setState(() => _isEvent = v!)),
                const Text('Evento'),
              ],
            ),
            if (_isEvent)
              ListTile(
                title: Text(_eventDate != null
                    ? DateFormat.yMd().format(_eventDate!)
                    : 'Selecciona fecha'),
                trailing: const Icon(Icons.calendar_today),
                onTap: _pickDate,
              ),
            if (_image != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Image.file(File(_image!.path), height: 120),
              ),
            TextButton(
                onPressed: _pickImage, child: const Text('Subir imagen')),
            const SizedBox(height: 24),
            ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: Text(_loading ? 'Publicando...' : 'Publicar')),
          ],
        ),
      ),
    );
  }
}
