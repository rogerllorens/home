import 'package:flutter/material.dart';
import '../models/webinar_model.dart';
import 'package:chewie/chewie.dart';
import 'package:video_player/video_player.dart';
import '../screens/chat_screen.dart';

class WebinarScreen extends StatefulWidget {
  final Webinar webinar;
  const WebinarScreen({super.key, required this.webinar});

  @override
  State<WebinarScreen> createState() => _WebinarScreenState();
}

class _WebinarScreenState extends State<WebinarScreen> {
  late VideoPlayerController _vp;
  ChewieController? _chewie;

  @override
  void initState() {
    super.initState();
    _vp = VideoPlayerController.network(widget.webinar.streamUrl)
      ..initialize().then((_) => setState(() {}));
    _chewie = ChewieController(videoPlayerController: _vp);
  }

  @override
  void dispose() {
    _chewie?.dispose();
    _vp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.webinar.title)),
      body: Column(
        children: [
          Expanded(
            child: _vp.value.isInitialized
                ? Chewie(controller: _chewie!)
                : const Center(child: CircularProgressIndicator()),
          ),
          const Divider(),
          Expanded(child: ChatScreen(roomId: widget.webinar.id)),
        ],
      ),
    );
  }
}
