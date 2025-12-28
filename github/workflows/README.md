# GitHub Workflows

### [ci.yml](ci.yml)

**Triggers:** Push/PR to `main`, manual dispatch

**Jobs:**
1. **Analyze** - Code quality checks
   - Format validation (`dart format`)
   - Static analysis (`flutter analyze --fatal-infos`)
   - Tests (placeholder)

2. **Build Android** - Builds signed release APK
   - Runs after analyze passes
   - Requires signing secrets (see Configuration)
   - Uploads artifact (7-day retention)

**Caching:** Flutter SDK, pub dependencies, Gradle

---

### [manual-build.yml](manual-build.yml)

**Trigger:** Manual dispatch only

**Build Options:**
- APK (Debug/Release)
- App Bundle (Debug/Release)
- Build from: current branch, specific commit, or tag
- Custom build name for artifacts

**Jobs:**
- **Prepare** - Determines checkout ref, extracts commit SHA
- **Build Jobs** - Conditional execution based on selections

**Use Case:** On-demand builds for testing, distribution, or specific commits

---

### [tag-validation.yml](tag-validation.yml)

**Trigger:** Tag push (`*`)

**Validation Rules:**
1. **Format** - Must match `X.Y.Z+B` (e.g., `1.0.0+1`)
2. **Pubspec Match** - Tag must equal `version` in pubspec.yaml
3. **No Duplicates** - Tag must be unique
4. **Build Increment** - Build number must be previous + 1
5. **Semantic Versioning** - Proper version bumping
   - MAJOR: `X.0.0` (minor/patch reset to 0)
   - MINOR: `X.Y.0` (patch resets to 0)
   - PATCH: `X.Y.Z` (increment only)

**On Failure:** Automatically deletes invalid tag from remote

---

## Configuration

### Required Secrets/Variables

Set in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Description | Default |
|----------|-------------|---------|
| `FLUTTER_VERSION` | Flutter SDK version | `3.35.x` |
| `JAVA_VERSION` | Java JDK version | `17` |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file | *(required for release)* |
| `ANDROID_KEY_PROPERTIES` | Key properties file content | *(required for release)* |

### Android Signing Setup

**ANDROID_KEY_PROPERTIES** format:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=YOUR_KEY_ALIAS
storeFile=upload-keystore.jks
```

Encode keystore:
```bash
base64 -w 0 upload-keystore.jks > keystore_base64.txt
```

---

## Usage Examples

### Create a Valid Tag
```bash
# Update version in pubspec.yaml first
# version: 1.2.3+4

git tag 1.2.3+4
git push origin 1.2.3+4
```

### Manual Build
1. Go to **Actions → Manual Build → Run workflow**
2. Select build type and source
3. Download artifacts from workflow run

### Check CI Status
All pushes/PRs to `main` trigger CI automatically. Check the Actions tab for results.

---

## Future Enhancements

- iOS builds (requires macOS runner + signing)
- Test coverage reporting
- Automated releases on tag validation success
