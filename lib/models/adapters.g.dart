// GENERATED CODE - DO NOT MODIFY BY HAND

import 'package:hive/hive.dart';
import 'challenge_model.dart';
import 'program_model.dart';
import 'leader_program_model.dart';
import 'user_model.dart';

class ChallengeProgressAdapter extends TypeAdapter<ChallengeProgress> {
  @override
  final int typeId = 1;

  @override
  ChallengeProgress read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{};
    for (var i = 0; i < numOfFields; i++) {
      fields[reader.readByte()] = reader.read();
    }
    return ChallengeProgress(
      challengeId: fields[0] as String,
      completed: fields[1] as int,
    );
  }

  @override
  void write(BinaryWriter writer, ChallengeProgress obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.challengeId)
      ..writeByte(1)
      ..write(obj.completed);
  }
}

class ModuleProgressAdapter extends TypeAdapter<ModuleProgress> {
  @override
  final int typeId = 3;

  @override
  ModuleProgress read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{};
    for (var i = 0; i < numOfFields; i++) {
      fields[reader.readByte()] = reader.read();
    }
    return ModuleProgress(
      programId: fields[0] as String,
      moduleId: fields[1] as String,
      completed: fields[2] as bool,
      completedAt: fields[3] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, ModuleProgress obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.programId)
      ..writeByte(1)
      ..write(obj.moduleId)
      ..writeByte(2)
      ..write(obj.completed)
      ..writeByte(3)
      ..write(obj.completedAt);
  }
}

class LeaderModuleProgressAdapter extends TypeAdapter<LeaderModuleProgress> {
  @override
  final int typeId = 4;

  @override
  LeaderModuleProgress read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{};
    for (var i = 0; i < numOfFields; i++) {
      fields[reader.readByte()] = reader.read();
    }
    return LeaderModuleProgress(
      moduleId: fields[0] as String,
      completed: fields[1] as bool,
      completedAt: fields[2] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, LeaderModuleProgress obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.moduleId)
      ..writeByte(1)
      ..write(obj.completed)
      ..writeByte(2)
      ..write(obj.completedAt);
  }
}

class UserProfileAdapter extends TypeAdapter<UserProfile> {
  @override
  final int typeId = 2;

  @override
  UserProfile read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{};
    for (var i = 0; i < numOfFields; i++) {
      fields[reader.readByte()] = reader.read();
    }
    return UserProfile(
      name: fields[0] as String,
      email: fields[1] as String,
      photoPath: fields[2] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, UserProfile obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.email)
      ..writeByte(2)
      ..write(obj.photoPath);
  }
}
