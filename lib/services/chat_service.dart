import 'dart:convert';
import 'package:http/http.dart' as http;

class ChatService {
  final String apiKey;
  ChatService(this.apiKey);

  Future<String> sendMessage(String text) async {
    final response = await http.post(
      Uri.parse('https://api.openai.com/v1/chat/completions'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode({
        'model': 'gpt-4o',
        'messages': [
          {'role': 'user', 'content': text}
        ]
      }),
    );
    final data = jsonDecode(response.body);
    return data['choices'][0]['message']['content'] ?? '';
  }
}
