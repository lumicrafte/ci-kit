# Update Play Store Listing Action

Custom GitHub Action for updating Google Play Store listing metadata without publishing a new app version.

## Building

```bash
npm install
npm run build
```

This will create the `dist/index.js` file that the action uses.

## Inputs

- `service-account-json`: Service account JSON (plain text or base64 encoded) - **required**
- `package-name`: Android package name (e.g., com.example.app) - **required**
- `metadata-path`: Path to processed metadata directory - default: `.processed-metadata`
- `dry-run`: Validate and preview changes without publishing - default: `false`

## Outputs

- `edit-id`: The Google Play edit ID used for this operation
- `updated-components`: JSON array of components that were updated

## Usage

This action is typically used as part of the `update-playstore-listing.yml` workflow and is not called directly.
