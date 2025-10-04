import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nphies_app_linc/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const NphiesApp());

    // Verify that the app title is present.
    expect(find.text('NPHIES Healthcare Application'), findsOneWidget);
    expect(find.text('LINC Edition'), findsOneWidget);
  });
}
