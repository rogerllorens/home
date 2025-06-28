import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'adapters.g.dart';

@HiveType(typeId: 2)
class UserProfile extends HiveObject {
  @HiveField(0)
  String name;
  @HiveField(1)
  String email;
  @HiveField(2)
  String? photoPath;
  UserProfile({this.name = '', this.email = '', this.photoPath});
}

class UserModel extends ChangeNotifier {
  static const _idKey = 'current_user';

  String? _userId;
  late Box<UserProfile> _box;
  UserProfile _profile = UserProfile();

  String? get userId => _userId;
  String get name => _profile.name;
  String get email => _profile.email;
  String? get avatarUrl => _profile.photoPath;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _userId = prefs.getString(_idKey);
    _box = await Hive.openBox<UserProfile>('profileBox');
    _profile = _box.get('profile') ?? UserProfile();
  }

  Future<void> login(String id) async {
    _userId = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_idKey, id);
    notifyListeners();
  }

  Future<void> update({String? name, String? email, String? avatarPath}) async {
    if (name != null) _profile.name = name;
    if (email != null) _profile.email = email;
    if (avatarPath != null) _profile.photoPath = avatarPath;
    await _box.put('profile', _profile);
    notifyListeners();
  }

  Future<void> logout() async {
    _userId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_idKey);
    await _box.delete('profile');
    notifyListeners();
  }
}
