import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../document/models/document_file.dart';

class DocumentGrid extends StatelessWidget {
  const DocumentGrid({super.key, required this.documents});

  final List<DocumentFile> documents;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 3 / 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: documents.length,
      itemBuilder: (context, index) {
        final doc = documents[index];
        return _DocumentCard(document: doc);
      },
    );
  }
}

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({required this.document});

  final DocumentFile document;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: () => context.push('/home/viewer/${document.id}'),
      child: Ink(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: Theme.of(context).colorScheme.surfaceVariant,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: Theme.of(context).colorScheme.background,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _DocumentPreview(thumbnail: document.thumbnail, type: document.type),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                document.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                _getTypeLabel(document.type),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTypeLabel(DocumentType type) {
    switch (type) {
      case DocumentType.pdf:
        return 'PDF';
      case DocumentType.word:
        return 'Word';
      case DocumentType.excel:
        return 'Excel';
      case DocumentType.powerpoint:
        return 'Presentación';
      case DocumentType.text:
        return 'Texto';
      case DocumentType.image:
        return 'Imagen';
    }
  }
}

class _DocumentPreview extends StatelessWidget {
  const _DocumentPreview({required this.thumbnail, required this.type});

  final Uint8List? thumbnail;
  final DocumentType type;

  @override
  Widget build(BuildContext context) {
    if (thumbnail != null) {
      return Image.memory(thumbnail!, fit: BoxFit.cover);
    }

    final iconData = _iconForType(type);

    return Container(
      color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
      child: Center(
        child: Icon(iconData, size: 48, color: Theme.of(context).colorScheme.primary),
      ),
    );
  }

  IconData _iconForType(DocumentType type) {
    switch (type) {
      case DocumentType.pdf:
        return Icons.picture_as_pdf_outlined;
      case DocumentType.word:
        return Icons.text_snippet_outlined;
      case DocumentType.excel:
        return Icons.table_chart_outlined;
      case DocumentType.powerpoint:
        return Icons.slideshow_outlined;
      case DocumentType.text:
        return Icons.description_outlined;
      case DocumentType.image:
        return Icons.image_outlined;
    }
  }
}
