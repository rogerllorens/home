import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/chat_service.dart';

class ChatMessage {
  final String author;
  final String text;
  final DateTime timestamp;
  ChatMessage(this.author, this.text) : timestamp = DateTime.now();
}

class ChatScreen extends StatefulWidget {
  final String? roomId;
  const ChatScreen({super.key, this.roomId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  bool _loading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Escribe algo antes de enviar')),
      );
      return;
    }
    setState(() {
      _loading = true;
      _messages.insert(0, ChatMessage('Yo', text));
    });
    _controller.clear();
    try {
      final resp = await ChatService('YOUR_API_KEY')
          .sendMessage(text)
          .timeout(const Duration(seconds: 10), onTimeout: () {
        throw TimeoutException('Tiempo de espera agotado');
      });
      setState(() {
        _messages.insert(0, ChatMessage('Bot', resp));
        _loading = false;
      });
    } on TimeoutException {
      setState(() {
        _messages.insert(
            0,
            ChatMessage(
                'Bot', '⚠️ El bot no responde. Intenta de nuevo más tarde.'));
        _loading = false;
      });
    } on SocketException {
      setState(() {
        _messages.insert(
            0, ChatMessage('Bot', '⚠️ Sin conexión. Revisa tu internet.'));
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Error enviando mensaje')));
      }
    }
  }

  Widget _buildInputField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              semanticsLabel: 'Campo de mensaje',
              controller: _controller,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.send),
            onPressed: _send,
            tooltip: 'Enviar',
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chat de soporte')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length,
              itemBuilder: (_, index) {
                final m = _messages[index];
                final isUser = m.author == 'Yo';
                return Align(
                  alignment:
                      isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin:
                        const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.blueAccent : Colors.grey[200],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment:
                          isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        Text(m.text,
                            style: TextStyle(
                                color: isUser ? Colors.white : Colors.black)),
                        const SizedBox(height: 4),
                        Text(DateFormat('HH:mm').format(m.timestamp),
                            style: TextStyle(fontSize: 10, color: Colors.grey[600])),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (_loading) const LinearProgressIndicator(),
          _buildInputField(),
        ],
      ),
    );
  }
}
