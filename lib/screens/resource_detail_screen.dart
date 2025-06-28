import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:just_audio/just_audio.dart';
import 'package:chewie/chewie.dart';
import 'package:video_player/video_player.dart';
import 'package:share_plus/share_plus.dart';

import '../models/resource_model.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ResourceDetailScreen extends StatefulWidget {
  final String id;
  const ResourceDetailScreen({super.key, required this.id});

  @override
  State<ResourceDetailScreen> createState() => _ResourceDetailScreenState();
}

class _ResourceDetailScreenState extends State<ResourceDetailScreen> {
  AudioPlayer? _audioPlayer;
  VideoPlayerController? _videoController;
  ChewieController? _chewie;

  @override
  void dispose() {
    _audioPlayer?.dispose();
    _chewie?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final resource = context.read<ResourceModel>().getById(widget.id)!;
    final body = _buildBody(resource);
    return Scaffold(
      appBar: AppBar(actions: [
        IconButton(
          icon: const Icon(Icons.share),
          onPressed: () => Share.share(resource.mediaUrl),
        )
      ]),
      body: body,
    );
  }

  Widget _buildBody(Resource resource) {
    switch (resource.type) {
      case ResourceType.article:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (resource.mediaUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: resource.mediaUrl,
                  placeholder: (_, __) =>
                      const Center(child: CircularProgressIndicator()),
                  errorWidget: (_, __, ___) => const Icon(Icons.error),
                  semanticLabel: resource.title,
                ),
              const SizedBox(height: 16),
              Text(resource.description),
            ],
          ),
        );
      case ResourceType.podcast:
        _audioPlayer ??= AudioPlayer()..setUrl(resource.mediaUrl);
        return Column(
          children: [
            const SizedBox(height: 24),
            StreamBuilder<PlayerState>(
              stream: _audioPlayer!.playerStateStream,
              builder: (ctx, snap) {
                final playing = snap.data?.playing ?? false;
                return Semantics(
                  button: true,
                  label: playing ? 'Pausar audio' : 'Reproducir audio',
                  child: IconButton(
                    icon: Icon(playing ? Icons.pause : Icons.play_arrow),
                    iconSize: 48,
                    onPressed: () =>
                        playing ? _audioPlayer!.pause() : _audioPlayer!.play(),
                  ),
                );
              },
            ),
          ],
        );
      case ResourceType.video:
        _videoController ??= VideoPlayerController.network(resource.mediaUrl)
          ..initialize().then((_) => setState(() {}));
        if (!_videoController!.value.isInitialized) {
          return const Center(child: CircularProgressIndicator());
        }
        _chewie ??= ChewieController(
          videoPlayerController: _videoController!,
          autoPlay: false,
          aspectRatio: _videoController!.value.aspectRatio,
        );
        return Chewie(controller: _chewie!);
    }
  }
}
