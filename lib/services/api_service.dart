import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

/// API Service for handling HTTP requests to NPHIES backend
class ApiService {
  final String baseUrl;
  final http.Client client;

  ApiService({
    String? baseUrl,
    http.Client? client,
  })  : baseUrl = baseUrl ?? AppConstants.apiBaseUrl,
        client = client ?? http.Client();

  /// Get request
  Future<dynamic> get(String endpoint, {Map<String, String>? headers}) async {
    try {
      final response = await client
          .get(
            Uri.parse('$baseUrl/$endpoint'),
            headers: headers,
          )
          .timeout(Duration(milliseconds: AppConstants.connectionTimeout));
      return _handleResponse(response);
    } catch (e) {
      throw Exception('GET request failed: $e');
    }
  }

  /// Post request
  Future<dynamic> post(String endpoint,
      {Map<String, String>? headers, dynamic body}) async {
    try {
      final response = await client
          .post(
            Uri.parse('$baseUrl/$endpoint'),
            headers: headers ?? {'Content-Type': 'application/json'},
            body: json.encode(body),
          )
          .timeout(Duration(milliseconds: AppConstants.connectionTimeout));
      return _handleResponse(response);
    } catch (e) {
      throw Exception('POST request failed: $e');
    }
  }

  /// Handle HTTP response
  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return json.decode(response.body);
    } else {
      throw Exception(
          'HTTP ${response.statusCode}: ${response.reasonPhrase}');
    }
  }

  /// Dispose resources
  void dispose() {
    client.close();
  }
}
