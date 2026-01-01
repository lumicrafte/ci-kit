const core = require('@actions/core');
const glob = require('@actions/glob');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * Parse service account JSON from input (supports plain JSON or base64)
 */
function parseServiceAccount(input) {
  try {
    return JSON.parse(input);
  } catch (error) {
    // Try base64 decode
    try {
      const decoded = Buffer.from(input, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (decodeError) {
      throw new Error('Failed to parse service account JSON. Must be valid JSON or base64-encoded JSON.');
    }
  }
}

/**
 * Process release notes from whatsnew directory
 */
async function processReleaseNotes(whatsNewDir) {
  if (!whatsNewDir) {
    return [];
  }

  const releaseNotes = [];
  const globber = await glob.create(`${whatsNewDir}/whatsnew-*`);
  const files = await globber.glob();

  for (const file of files) {
    const locale = path.basename(file).replace('whatsnew-', '');
    const text = fs.readFileSync(file, 'utf8').trim();

    if (text) {
      releaseNotes.push({
        language: locale,
        text: text
      });
      core.info(`Added release notes for locale: ${locale}`);
    }
  }

  return releaseNotes;
}

/**
 * Main action logic
 */
async function run() {
  let editId = null;
  let androidPublisher = null;
  let packageName = null;

  try {
    // Get inputs
    const serviceAccountInput = core.getInput('service-account-json', { required: true });
    packageName = core.getInput('package-name', { required: true });
    const releaseFiles = core.getInput('release-files', { required: false });
    const track = core.getInput('track', { required: true });
    const status = core.getInput('status', { required: false }) || 'completed';
    const rolloutPercentageInput = core.getInput('rollout-percentage', { required: false });
    const inAppUpdatePriority = parseInt(core.getInput('in-app-update-priority', { required: false }) || '0');
    const whatsNewDirectory = core.getInput('whats-new-directory', { required: false });
    const promoteTrack = core.getInput('promote-track', { required: false });
    const promoteReleaseCode = core.getInput('promote-release-code', { required: false });

    core.info('Starting Google Play publishing process...');

    // Determine operation mode
    const isPromoteMode = !!promoteTrack;
    const isUploadMode = !!releaseFiles;

    if (!isPromoteMode && !isUploadMode) {
      throw new Error('Must provide either release-files (for upload) or promote-track (for promotion)');
    }

    // Parse and validate service account
    core.info('Parsing service account credentials...');
    const serviceAccount = parseServiceAccount(serviceAccountInput);

    // Validate and convert rollout percentage to fraction
    let userFraction = undefined;
    if (rolloutPercentageInput) {
      const percentage = parseInt(rolloutPercentageInput);
      if (isNaN(percentage) || percentage < 5 || percentage > 100) {
        throw new Error(`rollout-percentage must be a number between 5 and 100, got: ${rolloutPercentageInput}`);
      }
      userFraction = percentage / 100;
      core.info(`Staged rollout: ${percentage}%`);
    }

    // Validate in-app update priority
    if (inAppUpdatePriority < 0 || inAppUpdatePriority > 5) {
      throw new Error(`in-app-update-priority must be between 0 and 5, got: ${inAppUpdatePriority}`);
    }

    // Authenticate with Google Play API
    core.info('Authenticating with Google Play API...');
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });

    androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: auth
    });

    // Create edit (will fail with 404 if app doesn't exist)
    core.info(`Creating edit for package: ${packageName}`);
    let editResponse;
    try {
      editResponse = await androidPublisher.edits.insert({
        packageName: packageName,
        requestBody: {}
      });
    } catch (editError) {
      // Provide helpful error for missing app
      if (editError.response && editError.response.status === 404) {
        throw new Error(
          `App not found in Play Console!\n\n` +
          `Package name: ${packageName}\n\n` +
          `The app must be created manually in Play Console first:\n` +
          `1. Go to https://play.google.com/console\n` +
          `2. Click "Create app"\n` +
          `3. Fill in app details with package name: ${packageName}\n` +
          `4. Complete the required setup (content rating, store presence, etc.)\n` +
          `5. Then try publishing again with this workflow\n\n` +
          `Note: The Google Play API cannot create new apps - only manage existing ones.`
        );
      }
      throw editError;
    }

    editId = editResponse.data.id;
    core.info(`Edit created: ${editId}`);
    core.setOutput('edit-id', editId);

    let versionCode;

    // Upload or promote logic
    if (isUploadMode) {
      core.info(`Upload mode: ${releaseFiles}`);

      // Check if file exists
      if (!fs.existsSync(releaseFiles)) {
        throw new Error(`Release file not found: ${releaseFiles}`);
      }

      const fileExt = path.extname(releaseFiles).toLowerCase();
      const fileStats = fs.statSync(releaseFiles);
      core.info(`File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

      if (fileExt === '.aab') {
        core.info('Uploading App Bundle (.aab)...');
        const uploadResponse = await androidPublisher.edits.bundles.upload({
          packageName: packageName,
          editId: editId,
          media: {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(releaseFiles)
          }
        });
        versionCode = uploadResponse.data.versionCode;
        core.info(`Bundle uploaded successfully. Version code: ${versionCode}`);
      } else if (fileExt === '.apk') {
        core.info('Uploading APK (.apk)...');
        const uploadResponse = await androidPublisher.edits.apks.upload({
          packageName: packageName,
          editId: editId,
          media: {
            mimeType: 'application/vnd.android.package-archive',
            body: fs.createReadStream(releaseFiles)
          }
        });
        versionCode = uploadResponse.data.versionCode;
        core.info(`APK uploaded successfully. Version code: ${versionCode}`);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}. Must be .aab or .apk`);
      }
    } else if (isPromoteMode) {
      core.info(`Promote mode: ${promoteTrack} → ${track}`);

      // Get version code from source track
      if (promoteReleaseCode) {
        versionCode = parseInt(promoteReleaseCode);
        core.info(`Using specified version code: ${versionCode}`);
      } else {
        // Get latest version from source track
        core.info(`Getting latest version from ${promoteTrack} track...`);
        const sourceTrackResponse = await androidPublisher.edits.tracks.get({
          packageName: packageName,
          editId: editId,
          track: promoteTrack
        });

        const sourceReleases = sourceTrackResponse.data.releases || [];
        if (sourceReleases.length === 0) {
          throw new Error(`No releases found on ${promoteTrack} track`);
        }

        // Get the latest release
        const latestRelease = sourceReleases[0];
        if (!latestRelease.versionCodes || latestRelease.versionCodes.length === 0) {
          throw new Error(`No version codes found in latest release on ${promoteTrack} track`);
        }

        versionCode = Math.max(...latestRelease.versionCodes.map(vc => parseInt(vc)));
        core.info(`Latest version code from ${promoteTrack}: ${versionCode}`);
      }
    }

    core.setOutput('version-code', versionCode.toString());

    // Process release notes
    const releaseNotes = await processReleaseNotes(whatsNewDirectory);
    if (releaseNotes.length > 0) {
      core.info(`Processed ${releaseNotes.length} release note(s)`);
    }

    // Build release object
    const release = {
      versionCodes: [versionCode.toString()],
      status: status
    };

    if (userFraction !== undefined) {
      release.userFraction = userFraction;
      // When using staged rollout, status should be inProgress
      if (status === 'completed') {
        release.status = 'inProgress';
        core.info('Changed status to inProgress for staged rollout');
      }
    }

    if (inAppUpdatePriority > 0) {
      release.inAppUpdatePriority = inAppUpdatePriority;
      core.info(`In-app update priority: ${inAppUpdatePriority}`);
    }

    if (releaseNotes.length > 0) {
      release.releaseNotes = releaseNotes;
    }

    // Update track
    core.info(`Updating ${track} track...`);
    await androidPublisher.edits.tracks.update({
      packageName: packageName,
      editId: editId,
      track: track,
      requestBody: {
        track: track,
        releases: [release]
      }
    });

    core.info(`Track ${track} updated successfully`);

    // Commit the edit
    core.info('Committing changes...');
    await androidPublisher.edits.commit({
      packageName: packageName,
      editId: editId
    });

    core.info('Changes committed successfully!');

    // Success summary
    core.info('');
    core.info('═══════════════════════════════════════');
    core.info('  SUCCESSFULLY PUBLISHED TO PLAY STORE');
    core.info('═══════════════════════════════════════');
    core.info(`Package: ${packageName}`);
    core.info(`Track: ${track}`);
    core.info(`Version Code: ${versionCode}`);
    core.info(`Status: ${release.status}`);
    if (rolloutPercentageInput) {
      core.info(`Rollout: ${rolloutPercentageInput}%`);
    }
    if (inAppUpdatePriority > 0) {
      core.info(`Update Priority: ${inAppUpdatePriority}`);
    }
    core.info('═══════════════════════════════════════');

  } catch (error) {
    // If we have an edit ID and the commit failed, try to abandon the edit
    if (editId && androidPublisher && packageName) {
      try {
        core.info('Attempting to clean up failed edit...');
        await androidPublisher.edits.delete({
          packageName: packageName,
          editId: editId
        });
        core.info('Edit cleaned up');
      } catch (cleanupError) {
        core.warning(`Failed to clean up edit: ${cleanupError.message}`);
      }
    }

    // Format error message with better context
    let errorMessage = error.message;
    let errorCode = null;

    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error) {
        errorMessage = errorData.error.message || errorMessage;
        errorCode = errorData.error.code;

        if (errorData.error.errors && errorData.error.errors.length > 0) {
          errorMessage += '\n\nDetails:\n';
          errorData.error.errors.forEach(err => {
            errorMessage += `- ${err.message}\n`;
          });
        }
      }
    }

    // Provide helpful context for common errors
    if (errorCode === 404 || errorMessage.includes('not found') || errorMessage.includes('404')) {
      errorMessage += '\n\n💡 Common cause: The app may not exist in Play Console yet.\n';
      errorMessage += 'Apps must be created manually at https://play.google.com/console before using this action.';
    } else if (errorCode === 401 || errorCode === 403 || errorMessage.includes('permission')) {
      errorMessage += '\n\n💡 Common causes:\n';
      errorMessage += '- Service account may not have proper permissions in Play Console\n';
      errorMessage += '- Service account JSON may be invalid or expired\n';
      errorMessage += '- Package name may not match the app in Play Console';
    } else if (errorMessage.includes('version') && errorMessage.includes('already')) {
      errorMessage += '\n\n💡 This version code already exists on this track.\n';
      errorMessage += 'Increment the version code in your app and rebuild.';
    }

    core.setFailed(`Google Play publishing failed: ${errorMessage}`);
  }
}

// Run the action
run();
