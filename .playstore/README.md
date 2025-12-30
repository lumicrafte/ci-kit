# Play Store Assets Directory

This directory contains all assets and metadata for your Google Play Store listing.

## Directory Structure

```
.playstore/
├── metadata.yaml              # App details (category, contact, privacy policy)
├── app-info.yaml              # Multi-locale app info (title, descriptions)
├── graphics/
│   ├── icon.png               # 512x512 app icon
│   ├── feature-graphic.png    # 1024x500 feature graphic
│   └── promo-graphic.png      # 180x120 promo graphic (optional)
└── screenshots/
    ├── en-US/                 # English (US) locale
    │   ├── phone/             # 2-8 phone screenshots
    │   ├── tablet/            # Tablet screenshots (optional)
    │   └── wear/              # Wear screenshots (optional)
    └── es-ES/                 # Spanish (Spain) locale
        └── phone/             # 2-8 phone screenshots
```

## Files Explained

### metadata.yaml
Contains app-level metadata that applies globally:
- App category
- Contact information (website, email, phone)
- Privacy policy URL
- Default language

**See:** [metadata.yaml](metadata.yaml)

### app-info.yaml
Contains localized content that appears on the Play Store:
- App title (max 30 characters)
- Short description (max 80 characters)
- Full description (max 4000 characters)
- Promotional video URL (optional)

Supports multiple locales (en-US, es-ES, fr-FR, etc.)

**See:** [app-info.yaml](app-info.yaml)

### graphics/
Visual assets displayed on your Play Store listing:
- **icon.png**: 512x512 app icon
- **feature-graphic.png**: 1024x500 banner image
- **promo-graphic.png**: 180x120 promotional graphic (optional)

### screenshots/
Screenshots organized by locale and device type:
- Create a directory for each locale (en-US, es-ES, etc.)
- Within each locale, create directories for device types:
  - **phone/** (required): 2-8 phone screenshots
  - **tablet/** (optional): 2-8 tablet screenshots
  - **wear/** (optional): Wear OS screenshots

## Usage

### 1. Populate This Directory

Fill in the YAML files and add your graphics/screenshots according to the structure above.

### 2. Run the Update Workflow

Go to **Actions → Update Play Store Listing** in your GitHub repository:

1. Select what to update:
   - ☑️ Update app details (metadata.yaml)
   - ☑️ Update app info (app-info.yaml)
   - ☑️ Update icon
   - ☑️ Update feature graphic
   - ☑️ Update screenshots

2. Optional: Specify locales (e.g., `en-US,es-ES`) or leave empty for all

3. Optional: Enable dry run to validate without publishing

4. Click **Run workflow**

## Tips

### Character Limits
- **Title**: 30 characters max
- **Short Description**: 80 characters max
- **Full Description**: 4000 characters max

The validation workflow will check these limits before uploading.

### Image Requirements
- **Icon**: 512x512 PNG (32-bit with alpha)
- **Feature Graphic**: 1024x500 PNG or JPG
- **Screenshots**: 320-3840px, PNG or JPG, max 8MB

### Multi-Locale Support
Add as many locales as needed. Common locale codes:
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `es-ES` - Spanish (Spain)
- `es-MX` - Spanish (Mexico)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `it-IT` - Italian (Italy)
- `pt-BR` - Portuguese (Brazil)
- `ja-JP` - Japanese (Japan)
- `ko-KR` - Korean (South Korea)
- `zh-CN` - Chinese (Simplified)
- `ar` - Arabic
- `hi-IN` - Hindi (India)

### Dry Run First
Always run with "dry run" enabled first to validate your files:
- Checks YAML syntax
- Validates character limits
- Verifies image dimensions
- Ensures file formats are correct

### Version Control
Keep this directory in git to:
- Track listing changes over time
- Review changes in pull requests
- Rollback if needed
- Collaborate with team members

### Partial Updates
You don't need to update everything at once:
- Update only Spanish descriptions
- Add new screenshots for one locale
- Change contact info only
- Update graphics independently

### Security Note
This directory contains **public** information only. Never add:
- Service account credentials
- API keys
- Keystore files
- Private data

All sensitive data should be in GitHub Secrets/Variables.

## Example Workflow

1. **Update app description:**
   - Edit `app-info.yaml`
   - Commit changes
   - Run workflow with "Update app info" checked

2. **Add new locale:**
   - Add locale to `app-info.yaml`
   - Create `screenshots/fr-FR/phone/` directory
   - Add French screenshots
   - Run workflow with specific locale: `fr-FR`

3. **Refresh all graphics:**
   - Replace files in `graphics/` and `screenshots/`
   - Run workflow with all graphics options checked

## Troubleshooting

**"metadata.yaml not found"**
- Ensure file is in `.playstore/` directory
- Check spelling and lowercase

**"Title too long"**
- Check character limit (30 chars)
- Count includes spaces and special characters

**"Icon must be 512x512"**
- Verify dimensions with `identify icon.png`
- Resize if needed

**"Locale not found"**
- Ensure locale code matches exactly (case-sensitive)
- Check `app-info.yaml` has the locale defined

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Store Listing Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Graphic Asset Specs](https://support.google.com/googleplay/android-developer/answer/9866159)

---

**Note:** This is a sample directory structure. Replace all placeholder content with your actual app assets before using the update-playstore-listing workflow.
