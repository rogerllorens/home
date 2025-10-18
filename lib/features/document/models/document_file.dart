import 'dart:typed_data';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';

enum DocumentType { pdf, word, excel, powerpoint, text, image }

enum AnnotationTool { highlight, underline, strikeThrough, note, freehand, signature }

enum DocumentSpace { recent, favorite, signed, sharedWithMe, protected }

class DocumentFile {
  const DocumentFile({
    required this.id,
    required this.name,
    required this.path,
    required this.type,
    required this.modifiedAt,
    required this.size,
    this.thumbnail,
    this.isFavorite = false,
    this.isProtected = false,
    this.spaces = const {},
  });

  final String id;
  final String name;
  final String path;
  final DocumentType type;
  final DateTime modifiedAt;
  final int size;
  final Uint8List? thumbnail;
  final bool isFavorite;
  final bool isProtected;
  final Set<DocumentSpace> spaces;

  DocumentFile copyWith({
    String? name,
    String? path,
    DocumentType? type,
    DateTime? modifiedAt,
    int? size,
    Uint8List? thumbnail,
    bool? isFavorite,
    bool? isProtected,
    Set<DocumentSpace>? spaces,
  }) {
    return DocumentFile(
      id: id,
      name: name ?? this.name,
      path: path ?? this.path,
      type: type ?? this.type,
      modifiedAt: modifiedAt ?? this.modifiedAt,
      size: size ?? this.size,
      thumbnail: thumbnail ?? this.thumbnail,
      isFavorite: isFavorite ?? this.isFavorite,
      isProtected: isProtected ?? this.isProtected,
      spaces: spaces ?? this.spaces,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is DocumentFile &&
            other.id == id &&
            other.name == name &&
            other.path == path &&
            other.type == type &&
            other.modifiedAt == modifiedAt &&
            other.size == size &&
            const ListEquality<int>().equals(other.thumbnail, thumbnail) &&
            other.isFavorite == isFavorite &&
            other.isProtected == isProtected &&
            setEquals(other.spaces, spaces);
  }

  @override
  int get hashCode => Object.hash(
        id,
        name,
        path,
        type,
        modifiedAt,
        size,
        thumbnail?.hashCode,
        isFavorite,
        isProtected,
        spaces.length,
      );
}
