#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Repository information
REPO_URL="https://raw.githubusercontent.com/lumicrafte/ci-kit/main"

echo -e "${GREEN}Flutter GitHub Workflows Installer${NC}"
echo "======================================"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository. Please run this script from the root of your git repository.${NC}"
    exit 1
fi

# Create .github directory structure
mkdir -p .github/workflows
mkdir -p .github/actions/setup-android-signing
mkdir -p .github/actions/setup-flutter
mkdir -p .github/actions/build-android

# Download workflows
echo "📥 Downloading workflows..."
curl -fsSL "${REPO_URL}/github/workflows/ci.yml" -o .github/workflows/ci.yml
echo "  ✓ ci.yml"

curl -fsSL "${REPO_URL}/github/workflows/manual-build.yml" -o .github/workflows/manual-build.yml
echo "  ✓ manual-build.yml"

curl -fsSL "${REPO_URL}/github/workflows/tag-validation.yml" -o .github/workflows/tag-validation.yml
echo "  ✓ tag-validation.yml"

curl -fsSL "${REPO_URL}/github/workflows/publish-playstore.yml" -o .github/workflows/publish-playstore.yml
echo "  ✓ publish-playstore.yml"

curl -fsSL "${REPO_URL}/github/workflows/promote-playstore.yml" -o .github/workflows/promote-playstore.yml
echo "  ✓ promote-playstore.yml"

curl -fsSL "${REPO_URL}/github/workflows/README.md" -o .github/workflows/README.md 2>/dev/null || true
echo "  ✓ README.md"

# Download actions
echo ""
echo "📥 Downloading custom actions..."
curl -fsSL "${REPO_URL}/github/actions/setup-android-signing/action.yml" -o .github/actions/setup-android-signing/action.yml
echo "  ✓ setup-android-signing"

curl -fsSL "${REPO_URL}/github/actions/setup-flutter/action.yml" -o .github/actions/setup-flutter/action.yml
echo "  ✓ setup-flutter"

curl -fsSL "${REPO_URL}/github/actions/build-android/action.yml" -o .github/actions/build-android/action.yml
echo "  ✓ build-android"

mkdir -p .github/actions/process-release-notes
curl -fsSL "${REPO_URL}/github/actions/process-release-notes/action.yml" -o .github/actions/process-release-notes/action.yml
echo "  ✓ process-release-notes"

mkdir -p .github/actions/validate-playstore-secrets
curl -fsSL "${REPO_URL}/github/actions/validate-playstore-secrets/action.yml" -o .github/actions/validate-playstore-secrets/action.yml
echo "  ✓ validate-playstore-secrets"

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""

# Try to detect GitHub repository URL
GITHUB_REPO_URL=""
if command -v git &> /dev/null; then
    # Get remote URL and convert to GitHub web URL
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [[ "$REMOTE_URL" =~ github\.com ]]; then
        # Convert SSH URL to HTTPS if needed
        if [[ "$REMOTE_URL" =~ ^git@ ]]; then
            GITHUB_REPO_URL=$(echo "$REMOTE_URL" | sed 's/^git@github\.com:/https:\/\/github.com\//' | sed 's/\.git$//')
        else
            GITHUB_REPO_URL=$(echo "$REMOTE_URL" | sed 's/\.git$//')
        fi
    fi
fi

# Try to find keystore file
KEYSTORE_PATH="android/app/upload-keystore.jks"
if [ -d "android" ]; then
    # Search for common keystore file patterns
    FOUND_KEYSTORE=$(find android -name "*.jks" -o -name "*.keystore" 2>/dev/null | head -n 1)
    if [ -n "$FOUND_KEYSTORE" ]; then
        KEYSTORE_PATH="$FOUND_KEYSTORE"
    fi
fi

echo "Next steps:"
echo "1. Review the workflows in .github/workflows/"
echo ""
echo "2. Commit and push the changes:"
echo "   git add .github/"
echo "   git commit -m 'Add GitHub workflows for Flutter CI/CD'"
echo "   git push"
echo ""
echo "3. Encode your keystore (for release builds):"
echo ""
echo -e "   ${YELLOW}Run this command:${NC}"
echo -e "   ${GREEN}base64 -w 0 ${KEYSTORE_PATH}${NC}"
echo ""
echo "   Copy the output for the next step."
echo ""
echo "4. Open your repository settings:"
echo ""

if [ -n "$GITHUB_REPO_URL" ]; then
    echo -e "   ${YELLOW}${GITHUB_REPO_URL}/settings/variables/actions${NC}"
else
    echo "   Go to: Settings → Secrets and variables → Actions → Variables"
fi

echo ""
echo "5. Set required variables and secrets:"
echo ""
echo "   Variables (for release builds):"
echo "   - ANDROID_KEYSTORE_BASE64 (paste the base64 output from step 3)"
echo "   - ANDROID_KEY_PROPERTIES (key properties file content)"
echo ""
echo "   Secrets (for Play Store publishing):"
echo "   - PLAY_STORE_SERVICE_ACCOUNT (service account JSON)"
echo "   - PLAY_STORE_PACKAGE_NAME (your app package name)"
echo ""
echo "   Optional variables:"
echo "   - FLUTTER_VERSION (default: 3.35.x)"
echo "   - JAVA_VERSION (default: 17)"
echo ""
echo "For detailed configuration instructions, see:"
echo "https://github.com/lumicrafte/ci-kit#configuration"
