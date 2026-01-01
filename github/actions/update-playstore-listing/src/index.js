const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * Parse service account JSON from input (supports plain JSON or base64)
 * Extracted from publish-playstore to avoid duplication
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
 * Read text file if it exists
 */
function readTextFile(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8').trim();
  }
  return null;
}

/**
 * Load processed metadata from directory structure
 */
function loadProcessedMetadata(metadataPath) {
  const metadata = {
    details: {},
    listings: {},
    images: {},
    updatedComponents: []
  };

  // Load metadata summary
  const summaryPath = path.join(metadataPath, 'metadata.json');
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    metadata.summary = summary;
  }

  // Load app details (metadata.yaml content)
  const detailsDir = path.join(metadataPath, 'details');
  if (fs.existsSync(detailsDir)) {
    metadata.details.category = readTextFile(path.join(detailsDir, 'category.txt'));
    metadata.details.website = readTextFile(path.join(detailsDir, 'website.txt'));
    metadata.details.email = readTextFile(path.join(detailsDir, 'email.txt'));
    metadata.details.phone = readTextFile(path.join(detailsDir, 'phone.txt'));
    metadata.details.privacyPolicyUrl = readTextFile(path.join(detailsDir, 'privacy_policy_url.txt'));
    metadata.details.defaultLanguage = readTextFile(path.join(detailsDir, 'default_language.txt'));

    // Check if any details exist
    const hasDetails = Object.values(metadata.details).some(v => v !== null);
    if (hasDetails) {
      metadata.updatedComponents.push('app-details');
    }
  }

  // Load app info (app-info.yaml content) - multi-locale
  const listingsDir = path.join(metadataPath, 'listings');
  if (fs.existsSync(listingsDir)) {
    const locales = fs.readdirSync(listingsDir).filter(f =>
      fs.statSync(path.join(listingsDir, f)).isDirectory()
    );

    for (const locale of locales) {
      const localeDir = path.join(listingsDir, locale);
      metadata.listings[locale] = {
        title: readTextFile(path.join(localeDir, 'title.txt')),
        shortDescription: readTextFile(path.join(localeDir, 'short_description.txt')),
        fullDescription: readTextFile(path.join(localeDir, 'full_description.txt')),
        video: readTextFile(path.join(localeDir, 'video.txt'))
      };
    }

    if (locales.length > 0) {
      metadata.updatedComponents.push('app-info');
    }
  }

  // Load images
  const imagesDir = path.join(metadataPath, 'images');
  if (fs.existsSync(imagesDir)) {
    // Icon
    const iconPath = path.join(imagesDir, 'icon.png');
    if (fs.existsSync(iconPath)) {
      metadata.images.icon = iconPath;
      metadata.updatedComponents.push('icon');
    }

    // Feature graphic
    const featureGraphicPath = path.join(imagesDir, 'feature-graphic.png');
    if (fs.existsSync(featureGraphicPath)) {
      metadata.images.featureGraphic = featureGraphicPath;
      metadata.updatedComponents.push('feature-graphic');
    }

    // Screenshots - multi-locale, multi-device
    const screenshotsDir = path.join(imagesDir, 'screenshots');
    if (fs.existsSync(screenshotsDir)) {
      metadata.images.screenshots = {};

      const locales = fs.readdirSync(screenshotsDir).filter(f =>
        fs.statSync(path.join(screenshotsDir, f)).isDirectory()
      );

      for (const locale of locales) {
        metadata.images.screenshots[locale] = {};

        const localeDir = path.join(screenshotsDir, locale);
        const deviceTypes = fs.readdirSync(localeDir).filter(f =>
          fs.statSync(path.join(localeDir, f)).isDirectory()
        );

        for (const deviceType of deviceTypes) {
          const deviceDir = path.join(localeDir, deviceType);
          const screenshots = fs.readdirSync(deviceDir)
            .filter(f => f.match(/\.(png|jpg|jpeg)$/i))
            .sort()
            .map(f => path.join(deviceDir, f));

          if (screenshots.length > 0) {
            metadata.images.screenshots[locale][deviceType] = screenshots;
          }
        }
      }

      if (locales.length > 0) {
        metadata.updatedComponents.push('screenshots');
      }
    }
  }

  return metadata;
}

/**
 * Update app details (category, contact info, privacy policy)
 */
async function updateAppDetails(androidPublisher, editId, packageName, details) {
  core.info('Updating app details...');

  const requestBody = {};

  if (details.category) {
    // Note: Category is set at app creation and rarely changed via API
    core.info(`  Category: ${details.category}`);
  }

  if (details.website) {
    requestBody.contactWebsite = details.website;
    core.info(`  Website: ${details.website}`);
  }

  if (details.email) {
    requestBody.contactEmail = details.email;
    core.info(`  Email: ${details.email}`);
  }

  if (details.phone) {
    requestBody.contactPhone = details.phone;
    core.info(`  Phone: ${details.phone}`);
  }

  if (details.privacyPolicyUrl) {
    requestBody.defaultLanguage = details.defaultLanguage || 'en-US';
    core.info(`  Privacy Policy: ${details.privacyPolicyUrl}`);
    core.info(`  Default Language: ${requestBody.defaultLanguage}`);
  }

  // Update details via API
  if (Object.keys(requestBody).length > 0) {
    await androidPublisher.edits.details.update({
      packageName: packageName,
      editId: editId,
      requestBody: requestBody
    });
    core.info('✓ App details updated');
  } else {
    core.info('⊘ No app details to update');
  }
}

/**
 * Update app info (title, descriptions) for a locale
 */
async function updateListing(androidPublisher, editId, packageName, locale, listing) {
  core.info(`Updating listing for ${locale}...`);

  const requestBody = {
    language: locale
  };

  if (listing.title) {
    requestBody.title = listing.title;
    core.info(`  Title: ${listing.title}`);
  }

  if (listing.shortDescription) {
    requestBody.shortDescription = listing.shortDescription;
    core.info(`  Short description: ${listing.shortDescription.substring(0, 50)}...`);
  }

  if (listing.fullDescription) {
    requestBody.fullDescription = listing.fullDescription;
    const preview = listing.fullDescription.substring(0, 100).replace(/\n/g, ' ');
    core.info(`  Full description: ${preview}...`);
  }

  if (listing.video) {
    requestBody.video = listing.video;
    core.info(`  Video: ${listing.video}`);
  }

  // Update or create listing
  try {
    await androidPublisher.edits.listings.update({
      packageName: packageName,
      editId: editId,
      language: locale,
      requestBody: requestBody
    });
    core.info(`✓ Listing updated for ${locale}`);
  } catch (error) {
    if (error.code === 404) {
      // Listing doesn't exist, create it
      core.info(`  Creating new listing for ${locale}...`);
      await androidPublisher.edits.listings.insert({
        packageName: packageName,
        editId: editId,
        requestBody: requestBody
      });
      core.info(`✓ Listing created for ${locale}`);
    } else {
      throw error;
    }
  }
}

/**
 * Upload image to Play Store
 */
async function uploadImage(androidPublisher, editId, packageName, imageType, imagePath, locale = null) {
  const imageTypeMap = {
    'icon': 'icon',
    'featureGraphic': 'featureGraphic',
    'promoGraphic': 'promoGraphic'
  };

  const uploadType = imageTypeMap[imageType];
  if (!uploadType) {
    throw new Error(`Unknown image type: ${imageType}`);
  }

  core.info(`Uploading ${imageType}${locale ? ` for ${locale}` : ''}...`);

  // Delete existing image first (if any)
  try {
    if (locale) {
      await androidPublisher.edits.images.deleteall({
        packageName: packageName,
        editId: editId,
        language: locale,
        imageType: uploadType
      });
    } else {
      // Icon and feature graphic are language-independent in newer API versions
      // For localized listings, use the default locale
      const defaultLocale = 'en-US';
      await androidPublisher.edits.images.deleteall({
        packageName: packageName,
        editId: editId,
        language: defaultLocale,
        imageType: uploadType
      });
    }
  } catch (error) {
    // Ignore errors if image doesn't exist
    if (error.code !== 404) {
      core.warning(`Failed to delete existing ${imageType}: ${error.message}`);
    }
  }

  // Upload new image
  const uploadLocale = locale || 'en-US';
  await androidPublisher.edits.images.upload({
    packageName: packageName,
    editId: editId,
    language: uploadLocale,
    imageType: uploadType,
    media: {
      mimeType: 'image/png',
      body: fs.createReadStream(imagePath)
    }
  });

  core.info(`✓ ${imageType} uploaded`);
}

/**
 * Upload screenshots for a locale and device type
 */
async function uploadScreenshots(androidPublisher, editId, packageName, locale, deviceType, screenshotPaths) {
  const deviceTypeMap = {
    'phone': 'phoneScreenshots',
    'tablet': 'sevenInchScreenshots',
    'wear': 'wearScreenshots'
  };

  const imageType = deviceTypeMap[deviceType];
  if (!imageType) {
    throw new Error(`Unknown device type: ${deviceType}`);
  }

  core.info(`Uploading ${screenshotPaths.length} ${deviceType} screenshot(s) for ${locale}...`);

  // Delete existing screenshots first
  try {
    await androidPublisher.edits.images.deleteall({
      packageName: packageName,
      editId: editId,
      language: locale,
      imageType: imageType
    });
  } catch (error) {
    // Ignore errors if screenshots don't exist
    if (error.code !== 404) {
      core.warning(`Failed to delete existing ${deviceType} screenshots: ${error.message}`);
    }
  }

  // Upload new screenshots
  for (let i = 0; i < screenshotPaths.length; i++) {
    const screenshotPath = screenshotPaths[i];
    const ext = path.extname(screenshotPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    await androidPublisher.edits.images.upload({
      packageName: packageName,
      editId: editId,
      language: locale,
      imageType: imageType,
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(screenshotPath)
      }
    });

    core.info(`  ✓ Uploaded screenshot ${i + 1}/${screenshotPaths.length}`);
  }

  core.info(`✓ All ${deviceType} screenshots uploaded for ${locale}`);
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
    const metadataPath = core.getInput('metadata-path', { required: true });
    const dryRun = core.getInput('dry-run', { required: false }) === 'true';

    core.info('Starting Play Store listing update...');
    if (dryRun) {
      core.info('🔍 DRY RUN MODE - No changes will be published');
    }

    // Parse and validate service account
    core.info('Parsing service account credentials...');
    const serviceAccount = parseServiceAccount(serviceAccountInput);

    // Load processed metadata
    core.info('Loading processed metadata...');
    const metadata = loadProcessedMetadata(metadataPath);

    if (metadata.updatedComponents.length === 0) {
      core.warning('No components to update. Metadata directory appears to be empty.');
      return;
    }

    core.info(`Components to update: ${metadata.updatedComponents.join(', ')}`);

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

    // Create edit
    core.info(`Creating edit for package: ${packageName}`);
    const editResponse = await androidPublisher.edits.insert({
      packageName: packageName,
      requestBody: {}
    });

    editId = editResponse.data.id;
    core.info(`Edit created: ${editId}`);
    core.setOutput('edit-id', editId);

    // Update app details
    if (Object.keys(metadata.details).length > 0 && Object.values(metadata.details).some(v => v !== null)) {
      await updateAppDetails(androidPublisher, editId, packageName, metadata.details);
    }

    // Update listings (app info)
    for (const [locale, listing] of Object.entries(metadata.listings)) {
      // Check if listing has any content
      if (Object.values(listing).some(v => v !== null)) {
        await updateListing(androidPublisher, editId, packageName, locale, listing);
      }
    }

    // Upload images
    if (metadata.images.icon) {
      await uploadImage(androidPublisher, editId, packageName, 'icon', metadata.images.icon);
    }

    if (metadata.images.featureGraphic) {
      await uploadImage(androidPublisher, editId, packageName, 'featureGraphic', metadata.images.featureGraphic);
    }

    // Upload screenshots
    if (metadata.images.screenshots) {
      for (const [locale, deviceTypes] of Object.entries(metadata.images.screenshots)) {
        for (const [deviceType, screenshots] of Object.entries(deviceTypes)) {
          await uploadScreenshots(androidPublisher, editId, packageName, locale, deviceType, screenshots);
        }
      }
    }

    if (dryRun) {
      // In dry run mode, validate the edit but don't commit
      core.info('');
      core.info('🔍 DRY RUN COMPLETE - Validating edit...');

      // Validate by getting the edit (this will fail if there are validation errors)
      await androidPublisher.edits.get({
        packageName: packageName,
        editId: editId
      });

      core.info('✓ Validation successful - all changes are valid');
      core.info('⚠️ Changes were NOT published (dry run mode)');

      // Delete the edit instead of committing
      await androidPublisher.edits.delete({
        packageName: packageName,
        editId: editId
      });

      core.info('✓ Edit cleaned up');
    } else {
      // Commit the edit to publish changes
      core.info('Committing changes...');

      // Use changesNotSentForReview=true to allow listing updates on draft apps
      // This prevents the "Only releases with status draft may be created on draft app" error
      // Apps with only internal testing releases are still considered "draft apps"
      await androidPublisher.edits.commit({
        packageName: packageName,
        editId: editId,
        changesNotSentForReview: true
      });

      core.info('Changes committed successfully!');
      core.info('Note: Changes saved but not sent for review (will be visible immediately)');
    }

    // Set output
    core.setOutput('updated-components', JSON.stringify(metadata.updatedComponents));

    // Success summary
    core.info('');
    core.info('═══════════════════════════════════════');
    if (dryRun) {
      core.info('  DRY RUN VALIDATION SUCCESSFUL');
    } else {
      core.info('  LISTING UPDATED SUCCESSFULLY');
    }
    core.info('═══════════════════════════════════════');
    core.info(`Package: ${packageName}`);
    core.info(`Updated: ${metadata.updatedComponents.join(', ')}`);
    if (Object.keys(metadata.listings).length > 0) {
      core.info(`Locales: ${Object.keys(metadata.listings).join(', ')}`);
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

    // Format error message
    let errorMessage = error.message;

    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.error) {
        errorMessage = errorData.error.message || errorMessage;
        if (errorData.error.errors && errorData.error.errors.length > 0) {
          errorMessage += '\n\nDetails:\n';
          errorData.error.errors.forEach(err => {
            errorMessage += `- ${err.message}\n`;
          });
        }
      }
    }

    core.setFailed(`Play Store listing update failed: ${errorMessage}`);
  }
}

// Run the action
run();
