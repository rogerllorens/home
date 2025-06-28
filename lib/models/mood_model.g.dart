// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mood_model.dart';

class MoodEntryAdapter extends TypeAdapter<MoodEntry> {
  @override
  final int typeId = 0;

  @override
  MoodEntry read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{};
    for (var i = 0; i < numOfFields; i++) {
      fields[reader.readByte()] = reader.read();
    }
    return MoodEntry(
      mood: fields[0] as int,
      time: fields[1] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, MoodEntry obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.mood)
      ..writeByte(1)
      ..write(obj.time);
  }
}
