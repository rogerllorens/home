import 'package:flutter/foundation.dart';

class Post {
  final String title;
  final String description;
  final DateTime time;

  Post({required this.title, required this.description, DateTime? time})
      : time = time ?? DateTime.now();
}

class CommunitiesModel extends ChangeNotifier {
  final List<Post> _posts = [];

  List<Post> get posts => List.unmodifiable(_posts);

  Future<void> fetchPosts() async {
    // In a real app, fetch from backend or local storage
    notifyListeners();
  }

  Future<void> addPost(Post post) async {
    _posts.insert(0, post);
    notifyListeners();
    // Optionally send to backend
  }
}

