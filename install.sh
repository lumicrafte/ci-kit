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

# Check if .github directory exists
if [ ! -d ".github" ]; then
    echo -e "${YELLOW}Creating .github directory...${NC}"
    mkdir -p .github
fi

echo -e "${GREEN}Installing GitHub workflows and actions...${NC}"
echo ""

# Create directories
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

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the workflows in .github/workflows/"
echo "2. Configure required variables in your GitHub repository:"
echo "   Go to: Settings → Secrets and variables → Actions → Variables"
echo ""
echo "   Required variables (for release builds):"
echo "   - ANDROID_KEYSTORE_BASE64 (base64 encoded keystore file)"
echo "   - ANDROID_KEY_PROPERTIES (key properties file content)"
echo ""
echo "   Optional variables:"
echo "   - FLUTTER_VERSION (default: 3.35.x)"
echo "   - JAVA_VERSION (default: 17)"
echo ""
echo "3. Commit and push the changes:"
echo "   git add .github/"
echo "   git commit -m 'Add GitHub workflows for Flutter CI/CD'"
echo "   git push"
echo ""
echo "For detailed configuration instructions, see:"
echo "https://github.com/lumicrafte/ci-kit#configuration"
