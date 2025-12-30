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

### Install Specific Version

Download the installer and install a specific version by providing a tag or branch name:

```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/lumicrafte/ci-kit/main/install.sh -o install.sh
chmod +x install.sh

# Install specific version tag
./install.sh v1.0.0

# Or install from a specific branch
./install.sh develop
```

Or in one command:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/lumicrafte/ci-kit/main/install.sh | bash -s v1.0.0
```

### Updating Workflows

To update to the latest version, download and run the installer again:

```bash
curl -fsSL https://raw.githubusercontent.com/lumicrafte/ci-kit/main/install.sh | bash
```

Or to update to a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/lumicrafte/ci-kit/main/install.sh | bash -s v1.0.0
```

If you already have `install.sh` downloaded, you can simply run:

```bash
./install.sh           # Latest version
./install.sh v1.0.0    # Specific version
```

## What's Included

### Workflows

- **ci.yml** - Continuous Integration workflow for automated testing and builds
- **manual-build.yml** - Manual trigger for building Android releases
- **publish-playstore.yml** - Publish app bundles to Google Play Store tracks
- **promote-playstore.yml** - Promote releases between Play Store tracks
- **tag-validation.yml** - Validates version tags and ensures proper versioning

### Custom Actions

- **setup-android-signing** - Configures Android app signing with keystore
- **setup-flutter** - Sets up Flutter SDK with caching
- **build-android** - Builds Android APK/AAB with configurable options
- **process-release-notes** - Processes multilingual release notes for Play Store
- **validate-playstore-secrets** - Validates Play Store secrets configuration

## Configuration

After installation, configure these variables in your GitHub repository or organization:

Go to **Settings → Secrets and variables → Actions → Variables** and add:

> **Note:** Variables can be set at the organization level and inherited by all repositories. Individual repositories can override organization-level variables by setting their own values.

### Required Variables (for release builds)

| Variable | Description | Example |
|----------|-------------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore file | *([see below](#setting-up-android-signing))* |
| `ANDROID_KEY_PROPERTIES` | Key properties file content | *([see below](#setting-up-android-signing))* |

### Required Secrets (for Play Store publishing)

| Secret | Description | Example |
|--------|-------------|---------|
| `PLAY_STORE_SERVICE_ACCOUNT` | Service account JSON from Google Play Console | *([see below](#setting-up-play-store-publishing))* |
| `PLAY_STORE_PACKAGE_NAME` | Your app's package name | `com.example.myapp` |

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

### Setting Up Play Store Publishing

#### 1. Create Service Account

1. [Google Play Console](https://play.google.com/console) → **Setup → API access**
2. **Create new service account** → Follow link to Google Cloud Console
3. Create service account, download JSON key
4. Back in Play Console → Grant access → Set permissions: **Release apps to production**

#### 2. Configure Secrets

**Settings → Secrets and variables → Actions → Secrets:**

- `PLAY_STORE_SERVICE_ACCOUNT`: Service account JSON content
- `PLAY_STORE_PACKAGE_NAME`: Your package name (e.g., `com.example.app`)

## Usage

### Publishing to Play Store

**Publish new build:**
1. Build: **Actions → Manual Build** → Select "Build Android App Bundle Release"
2. Publish: **Actions → Publish to Play Store** → Paste artifact name → Select track

**Promote between tracks:**
- **Actions → Promote Play Store Release** → Select from/to tracks
- Keeps existing release notes unless you provide new ones

**Tracks:** internal → alpha → beta → production

## License

MIT
