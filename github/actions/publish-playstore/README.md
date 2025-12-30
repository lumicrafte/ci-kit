# Publish to Google Play Store - Custom Action

A custom GitHub Action for publishing Android applications to Google Play Store using the official Google Play Developer API.

## Features

- Upload AAB or APK files to Google Play Store
- Publish to different tracks (internal, alpha, beta, production)
- Promote releases between tracks
- Staged rollouts with configurable percentages
- Multi-language release notes support
- In-app update priority settings
- Full error handling and detailed logging
- Built with official Google APIs (googleapis)

## Advantages Over Third-Party Actions

- **Full Transparency**: All code is visible and auditable
- **No Third-Party Dependencies**: Direct use of Google's official APIs
- **Better Error Messages**: Customized error handling and logging
- **Easier Debugging**: Can add debug logs and modify behavior as needed
- **Official Support**: Uses Google's maintained libraries
- **Future-Proof**: Easy to add new API features as they're released

## Prerequisites

### Google Play Console Setup

1. **Create a Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Play Android Developer API
   - Navigate to IAM & Admin → Service Accounts
   - Create a new service account
   - Generate and download a JSON key file

2. **Grant Permissions in Google Play Console:**
   - Open [Google Play Console](https://play.google.com/console)
   - Go to Users & Permissions
   - Add the service account email
   - Grant appropriate permissions (at least "Release to production")

3. **Configure GitHub Secrets:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add `PLAY_STORE_SERVICE_ACCOUNT`: The JSON key file content (can be plain JSON or base64 encoded)
   - Add `PLAY_STORE_PACKAGE_NAME`: Your app's package name (e.g., `com.example.app`)

## Usage

### Upload and Publish

Upload an AAB or APK file to a specific track:

```yaml
- name: Publish to Play Store
  uses: ./.github/actions/publish-playstore
  with:
    service-account-json: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
    package-name: ${{ secrets.PLAY_STORE_PACKAGE_NAME }}
    release-files: app-release.aab
    track: internal
    status: completed
```

### Staged Rollout

Publish with a staged rollout percentage:

```yaml
- name: Publish to Production (10% rollout)
  uses: ./.github/actions/publish-playstore
  with:
    service-account-json: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
    package-name: ${{ secrets.PLAY_STORE_PACKAGE_NAME }}
    release-files: app-release.aab
    track: production
    status: completed
    rollout-percentage: 10  # 10% rollout
    in-app-update-priority: 5
```

### Promote Between Tracks

Promote an existing release from one track to another:

```yaml
- name: Promote from Beta to Production
  uses: ./.github/actions/publish-playstore
  with:
    service-account-json: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
    package-name: ${{ secrets.PLAY_STORE_PACKAGE_NAME }}
    track: production
    promote-track: beta
    status: completed
```

### With Release Notes

Include multi-language release notes:

```yaml
- name: Process release notes
  uses: ./.github/actions/process-release-notes
  with:
    release-notes: '<en-US>Bug fixes and improvements</en-US><es-ES>Correcciones de errores</es-ES>'

- name: Publish with Release Notes
  uses: ./.github/actions/publish-playstore
  with:
    service-account-json: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
    package-name: ${{ secrets.PLAY_STORE_PACKAGE_NAME }}
    release-files: app-release.aab
    track: production
    whats-new-directory: whatsnew
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `service-account-json` | Yes | - | Service account JSON (plain text or base64 encoded) |
| `package-name` | Yes | - | Android package name (e.g., `com.example.app`) |
| `release-files` | No | - | Path to AAB or APK file to upload |
| `track` | Yes | - | Target track: `internal`, `alpha`, `beta`, or `production` |
| `status` | No | `completed` | Release status: `draft`, `completed`, or `inProgress` |
| `rollout-percentage` | No | - | Staged rollout percentage (5-100, e.g., `10` for 10% rollout) |
| `in-app-update-priority` | No | `0` | In-app update priority (0-5, where 5 is highest) |
| `whats-new-directory` | No | - | Directory containing `whatsnew-{locale}` files |
| `promote-track` | No | - | Source track to promote from (for promotion operations) |
| `promote-release-code` | No | - | Specific version code to promote (uses latest if not specified) |

## Outputs

| Output | Description |
|--------|-------------|
| `version-code` | The version code that was published or promoted |
| `edit-id` | The Google Play edit ID used for this operation |

## How It Works

1. **Authentication**: Authenticates with Google Play API using the service account
2. **Create Edit**: Creates a new edit session (a draft of changes)
3. **Upload/Promote**:
   - **Upload Mode**: Uploads the AAB/APK file if `release-files` is provided
   - **Promote Mode**: Gets version code from source track if `promote-track` is provided
4. **Process Release Notes**: Reads release notes from files if `whats-new-directory` is provided
5. **Update Track**: Assigns the version to the specified track with all settings
6. **Commit**: Commits the edit to make changes live on Google Play

## Error Handling

The action includes comprehensive error handling:

- Validates all inputs before making API calls
- Provides detailed error messages with context
- Automatically cleans up failed edits
- Logs API error details for debugging
- Fails fast with clear error messages


## Common Issues

### Service Account Permission Errors

**Error**: "The caller does not have permission"

**Solution**: Ensure the service account email is added to Google Play Console with appropriate permissions.

### Version Code Already Exists

**Error**: "APK with version code X already exists"

**Solution**: This version was already published to this track. Either increment the version code or promote the existing version.

### File Not Found

**Error**: "Release file not found"

**Solution**: Ensure the `release-files` path is correct and the file exists in the workflow workspace.

### Invalid Rollout Percentage

**Error**: "rollout-percentage must be a number between 5 and 100"

**Solution**: The rollout-percentage input expects an integer between 5 and 100 (e.g., `10` for 10%, not `0.1`).

## API Documentation

This action uses the [Google Play Developer API v3](https://developers.google.com/android-publisher).

Key API endpoints used:
- `edits.insert` - Create edit session
- `edits.bundles.upload` - Upload AAB files
- `edits.apks.upload` - Upload APK files
- `edits.tracks.update` - Assign version to track
- `edits.tracks.get` - Get track information (for promotions)
- `edits.commit` - Commit changes

## Development

### Prerequisites

- Node.js 20 or higher
- npm (comes with Node.js)

### Initial Setup

1. **Clone the repository and navigate to the action directory:**
   ```bash
   cd github/actions/publish-playstore
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This installs:
   - Runtime dependencies: `googleapis`, `google-auth-library`, `@actions/core`, `@actions/glob`
   - Dev dependencies: `@vercel/ncc` (for bundling)

### Development Workflow

1. **Make changes to the source code:**
   - Edit `src/index.js` with your changes
   - The source file contains all the logic for authentication, uploading, and publishing

2. **Build the action:**
   ```bash
   npm run build
   ```

   This command:
   - Runs `ncc build src/index.js -o dist --minify`
   - Bundles all Node.js code and dependencies into a single `dist/index.js` file
   - Minifies the output for optimal size
   - Takes ~20-30 seconds to complete

3. **Verify the build:**
   ```bash
   ls -lh dist/index.js
   ```

   The bundled file should be around 11-12 MB (includes all Google API dependencies)

4. **Test your changes:**
   - Commit both `src/index.js` and `dist/index.js` to your repository
   - Create a test workflow that uses your modified action
   - Run the workflow to verify functionality

5. **Important: Always rebuild before committing!**
   ```bash
   npm run build
   git add src/ dist/
   git commit -m "Description of changes"
   ```

### File Structure

```
github/actions/publish-playstore/
├── action.yml           # Action metadata and interface
├── src/
│   └── index.js        # Source code (edit this file)
├── dist/
│   └── index.js        # Compiled bundle (auto-generated, commit this)
├── package.json        # Dependencies and build scripts
├── package-lock.json   # Locked dependencies
├── node_modules/        # Installed packages (not committed)
├── .gitignore          # Ignores node_modules
└── README.md           # This file
```

### Understanding the Code

**src/index.js** contains:

1. **Input parsing** (lines 60-71):
   - Reads all action inputs using `@actions/core`
   - Validates service account JSON (supports plain or base64)
   - Determines operation mode (upload vs promote)

2. **Authentication** (lines 84-110):
   - Uses Google's `google-auth-library` to authenticate with service account
   - Creates authenticated `androidpublisher` API client

3. **Edit management** (lines 112-120):
   - Creates a new edit session with Google Play API
   - All changes are made within this edit
   - Edit must be committed to go live

4. **Upload logic** (lines 130-170):
   - Handles both AAB and APK uploads
   - Uses streaming for efficient file upload
   - Extracts version code from upload response

5. **Promote logic** (lines 172-200):
   - Fetches version codes from source track
   - Uses existing version code (no re-upload needed)

6. **Track update** (lines 220-245):
   - Builds release object with all settings
   - Updates the target track with the release
   - Handles rollout percentage, priority, and release notes

7. **Error handling** (lines 272-300):
   - Catches all errors with detailed messages
   - Cleans up failed edits automatically
   - Uses `@actions/core.setFailed()` for workflow failures

### Testing Checklist

Before deploying to production, test these scenarios:

**Upload Tests:**
- [ ] Upload AAB to internal track
- [ ] Upload APK to internal track
- [ ] Upload with release notes (single locale)
- [ ] Upload with release notes (multiple locales)
- [ ] Upload with staged rollout (10%, 50%, 100%)
- [ ] Upload with in-app update priority set

**Promotion Tests:**
- [ ] Promote from internal → alpha
- [ ] Promote from alpha → beta
- [ ] Promote from beta → production
- [ ] Promote specific version code
- [ ] Promote with updated release notes
- [ ] Promote with staged rollout to production

**Error Handling Tests:**
- [ ] Invalid service account credentials
- [ ] Missing AAB/APK file
- [ ] File already exists on track
- [ ] Invalid package name
- [ ] Invalid rollout percentage (< 5 or > 100)
- [ ] Invalid in-app update priority (< 0 or > 5)

### Debugging Tips

1. **Enable debug logging:**
   - In your workflow, add: `ACTIONS_STEP_DEBUG: true` to the environment
   - This shows detailed logs from `@actions/core`

2. **Check Google Play Console:**
   - Failed edits won't show in the console
   - Successful commits may take 1-2 hours to appear
   - Check the "Release management" section for your track

3. **Common error messages:**
   - "Edit already committed" → Edit was committed successfully but workflow failed after
   - "Package not found" → Wrong package name or service account lacks permissions
   - "Invalid APK" → File corruption during upload

4. **API response debugging:**
   - Google API errors are caught and logged with full details
   - Check workflow logs for API error messages

### Why Use ncc Bundling?

The action uses `@vercel/ncc` to bundle code for several reasons:

1. **Performance**: No `npm install` needed during workflow execution
2. **Reliability**: All dependencies are included, no network issues
3. **Size**: Single optimized file instead of thousands of node_modules files
4. **Simplicity**: GitHub Actions can directly execute the bundled file

The trade-off is that `dist/index.js` must be committed to the repository and rebuilt after any code changes.

## License

MIT
