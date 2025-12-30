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
- **validate-playstore-secrets** - Validates Play Store configuration (secrets and variables)

## Configuration

After installation, configure these variables in your GitHub repository or organization:

Go to **Settings → Secrets and variables → Actions → Variables** and add:

> **Note:** Variables can be set at the organization level and inherited by all repositories. Individual repositories can override organization-level variables by setting their own values.

### Required Variables (for release builds)

| Variable | Description | Example |
|----------|-------------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore file | *([see below](#setting-up-android-signing))* |
| `ANDROID_KEY_PROPERTIES` | Key properties file content | *([see below](#setting-up-android-signing))* |
| `PLAY_STORE_PACKAGE_NAME` | Your app's package name (for Play Store publishing) | `com.example.myapp` |

### Required Secrets (for Play Store publishing)

| Secret | Description | Example |
|--------|-------------|---------|
| `PLAY_STORE_SERVICE_ACCOUNT` | Service account JSON from Google Play Console | *([see below](#setting-up-play-store-publishing))* |

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

#### 1. Create Service Account in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **IAM & Admin → Service Accounts**
4. Click **Create Service Account**
5. Name it (e.g., "GitHub Actions Publisher")
6. Click **Create and Continue**
7. Skip granting roles (permissions handled in Play Console)
8. Click **Done**
9. Click on the created service account → **Keys** tab
10. **Add Key → Create new key → JSON**
11. Download the JSON file (keep it secure!)
12. Note the service account email (looks like `name@project-id.iam.gserviceaccount.com`)

#### 2. Grant Permissions in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Users and permissions** (left sidebar)
3. Click **Invite new users**
4. Enter the **service account email** from step 1
5. **Option A - Create Permission Group (Recommended):**
   - Click **Create and manage permission groups**
   - Click **Create permission group**
   - Name it (e.g., "API Publishers")
   - In **Account permissions** tab, select:
     - ✅ Release to production, exclude devices, and use Play App Signing
     - ✅ Release apps to testing tracks
     - ✅ Manage store presence
   - In **App permissions** tab, select your app and grant the same permissions
   - Click **Create**
   - Go back to invite user, assign the permission group

   **Option B - Direct Permissions:**
   - Select permissions manually in both Account and App tabs
   - Grant the same permissions listed above

6. Click **Invite user** / **Send invite**

#### 3. Configure Secrets and Variables

**GitHub Repository → Settings → Secrets and variables → Actions:**

**Secrets tab:**
- `PLAY_STORE_SERVICE_ACCOUNT`: Paste the entire content of the downloaded JSON file from step 1

**Variables tab:**
- `PLAY_STORE_PACKAGE_NAME`: Your app's package name (e.g., `com.example.app`)

## Usage

### Publishing to Play Store

**Publish new build:**
1. **Build**: Go to **Actions → Manual Build**
   - Click **Run workflow**
   - Select "Build Android App Bundle Release"
   - Click **Run workflow**
   - Wait for build to complete
   - Copy the workflow run URL from your browser (e.g., `https://github.com/owner/repo/actions/runs/123456`)

2. **Publish**: Go to **Actions → Publish to Play Store**
   - Click **Run workflow**
   - Paste the **build run URL** (from step 1)
   - Select **track** (internal, alpha, beta, or production)
   - Select **release status**:
     - `draft` - Save release for manual review (use for unpublished/draft apps)
     - `completed` - Publish immediately (default)
     - `inProgress` - Start staged rollout
     - `halted` - Pause an existing rollout
   - Optional: Add release notes and configure rollout percentage
   - Click **Run workflow**

**Important for first-time releases:**
- If your app is not yet published, use `release_status: draft`
- After the first manual publish through Play Console, use `release_status: completed`

**Promote between tracks:**
- **Actions → Promote Play Store Release** → Select from/to tracks
- Keeps existing release notes unless you provide new ones

**Available tracks:** internal → alpha → beta → production

## License

MIT
