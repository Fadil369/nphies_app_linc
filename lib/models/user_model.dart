/// User model for NPHIES application
class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? organizationId;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.organizationId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      organizationId: json['organization_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'organization_id': organizationId,
    };
  }
}
