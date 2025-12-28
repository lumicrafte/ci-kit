# CI-Kit: Flutter GitHub Workflows

A collection of reusable GitHub workflows and actions for Flutter projects, providing automated CI/CD pipelines for Android builds, testing, and release management.

## Quick Install

Install the workflows in your Flutter repository with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/lumicrafte/ci-kit/main/install.sh | bash
```

Or download and run the installer:

```bash
curl -fsSL https://raw.githubusercontent.com/lumicrafte/ci-kit/main/install.sh -o install.sh
chmod +x install.sh
./install.sh
```

## What's Included

### Workflows

- **ci.yml** - Continuous Integration workflow for automated testing and builds
- **manual-build.yml** - Manual trigger for building Android releases
- **tag-validation.yml** - Validates version tags and ensures proper versioning

### Custom Actions

- **setup-android-signing** - Configures Android app signing with keystore
- **setup-flutter** - Sets up Flutter SDK with caching
- **build-android** - Builds Android APK/AAB with configurable options

## Configuration

After installation, configure these variables in your GitHub repository or organization:

Go to **Settings → Secrets and variables → Actions → Variables** and add:

> **Note:** Variables can be set at the organization level and inherited by all repositories. Individual repositories can override organization-level variables by setting their own values.

### Required Variables (for release builds)

| Variable | Description | Example |
|----------|-------------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore file | *([see below](#setting-up-android-signing))* |
| `ANDROID_KEY_PROPERTIES` | Key properties file content | *([see below](#setting-up-android-signing))* |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLUTTER_VERSION` | Flutter SDK version | `3.35.x` |
| `JAVA_VERSION` | Java JDK version | `17` |

### Setting Up Android Signing

#### 1. Create Base64 Keystore

```bash
base64 -w 0 android/app/upload-keystore.jks > keystore.base64
```

Copy the contents of `keystore.base64` and paste it as the value for `ANDROID_KEYSTORE_BASE64` variable.

#### 2. Create Key Properties

Create a variable named `ANDROID_KEY_PROPERTIES` with this format:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=YOUR_KEY_ALIAS
storeFile=upload-keystore.jks
```

Replace the placeholders with your actual keystore credentials.

## Usage

Once installed and configured, the workflows will automatically:

- Run tests on every push and pull request
- Build Android releases when triggered manually
- Validate version tags to ensure proper semantic versioning

## License

MIT
