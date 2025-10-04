# NPHIES App LINC

A Flutter application for the National Platform for Health Information Exchange (NPHIES) - LINC Edition.

## Overview

This application provides a mobile interface for healthcare providers to interact with the NPHIES platform in Saudi Arabia. It enables secure access to health information exchange services and supports FHIR R4 standards.

## Features

- Healthcare provider authentication
- FHIR R4 resource management
- Claims submission and tracking
- Patient information management
- Secure data transmission

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Dart SDK (>=3.0.0)
- Android Studio / Xcode for mobile development

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Fadil369/nphies_app_linc.git
   cd nphies_app_linc
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run the application:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
  ├── main.dart           # Application entry point
  ├── models/             # Data models
  ├── services/           # API and business logic services
  ├── providers/          # State management providers
  ├── screens/            # UI screens
  └── widgets/            # Reusable widgets

android/                  # Android-specific code
ios/                      # iOS-specific code
web/                      # Web-specific code
test/                     # Unit and widget tests
assets/                   # Images, fonts, and other assets
```

## Development

### Running Tests

```bash
flutter test
```

### Building

For Android:
```bash
flutter build apk
```

For iOS:
```bash
flutter build ios
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Mohamed El Fadil MD - Project Owner

## Acknowledgments

- NPHIES Platform Team
- Saudi Arabian Ministry of Health
- FHIR Community