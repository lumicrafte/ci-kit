#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository information
REPO_URL="https://github.com/lumicrafte/ci-kit.git"
DEFAULT_BRANCH="main"
VERSION="${1:-$DEFAULT_BRANCH}"  # Use first argument as version/tag, default to main

echo -e "${GREEN}Flutter GitHub Workflows Installer${NC}"
echo "======================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git first.${NC}"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository. Please run this script from the root of your git repository.${NC}"
    exit 1
fi

# Create temporary directory for cloning
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${BLUE}📥 Downloading workflows from ci-kit...${NC}"
if [ "$VERSION" != "$DEFAULT_BRANCH" ]; then
    echo -e "${BLUE}Version: ${VERSION}${NC}"
fi
echo ""

# Shallow clone the repository
if git clone --depth 1 --branch "$VERSION" "$REPO_URL" "$TEMP_DIR" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully cloned ci-kit${NC}"
else
    echo -e "${RED}Error: Failed to clone repository or version '$VERSION' not found.${NC}"
    echo -e "${YELLOW}Tip: Use './install.sh' for latest, or './install.sh v1.0.0' for specific version${NC}"
    exit 1
fi

# Check if .github directory exists in the cloned repo
if [ ! -d "$TEMP_DIR/.github" ]; then
    echo -e "${RED}Error: No .github directory found in ci-kit repository.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Installing workflows and actions...${NC}"

# Create .github directory if it doesn't exist
mkdir -p .github

# Copy workflows and actions
cp -r "$TEMP_DIR/.github"/* .github/

# Count installed files
WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" 2>/dev/null | wc -l)
ACTION_COUNT=$(find .github/actions -name "action.yml" 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo -e "   Installed ${WORKFLOW_COUNT} workflows and ${ACTION_COUNT} actions"
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
