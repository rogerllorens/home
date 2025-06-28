import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

class AudioPlayerWidget extends StatefulWidget {
  final String url;
  const AudioPlayerWidget({super.key, required this.url});

  @override
  State<AudioPlayerWidget> createState() => _AudioPlayerWidgetState();
}

class _AudioPlayerWidgetState extends State<AudioPlayerWidget> {
  late AudioPlayer _player;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer()..setUrl(widget.url);
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Duration?> (
      stream: _player.durationStream,
      builder: (ctx, snapDur) {
        final duration = snapDur.data ?? Duration.zero;
        return StreamBuilder<Duration>(
            stream: _player.positionStream,
            builder: (ctx, snap) {
              final pos = snap.data ?? Duration.zero;
              final playing = _player.playing;
              return Column(
                children: [
                  Slider(
                    value: pos.inSeconds.toDouble().clamp(0, duration.inSeconds.toDouble()),
                    max: duration.inSeconds.toDouble().clamp(1, double.infinity),
                    onChanged: (v) => _player.seek(Duration(seconds: v.toInt())),
                  ),
                  IconButton(
                    icon: Icon(playing ? Icons.pause : Icons.play_arrow),
                    iconSize: 64,
                    onPressed: () => playing ? _player.pause() : _player.play(),
                  )
                ],
              );
            });
      });
  }
}

class VideoPlayerWidget extends StatefulWidget {
  final String url;
  const VideoPlayerWidget({super.key, required this.url});

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  late VideoPlayerController _controller;
  ChewieController? _chewie;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.network(widget.url)
      ..initialize().then((_) => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _chewie?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_controller.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }
    _chewie ??= ChewieController(
      videoPlayerController: _controller,
      autoPlay: false,
      aspectRatio: _controller.value.aspectRatio,
    );
    return Chewie(controller: _chewie!);
  }
}
