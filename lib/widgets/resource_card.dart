import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/resource_model.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ResourceCard extends StatelessWidget {
  final Resource resource;
  final VoidCallback onTap;
  const ResourceCard({super.key, required this.resource, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: resource.title,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CachedNetworkImage(
                imageUrl: resource.mediaUrl,
                fit: BoxFit.cover,
                height: 120,
                width: double.infinity,
                placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                errorWidget: (_, __, ___) => const Icon(Icons.error),
                semanticLabel: resource.title,
              ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Chip(label: Text(describeEnum(resource.type))),
                    Text(resource.title,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(resource.description,
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
