#!/bin/bash
# Version bump script for MagicBox
# Usage: ./bump-version.sh [patch|minor|major]

set -e

TYPE=${1:-patch}

echo "🔖 Bumping version ($TYPE)..."

# Run npm version in root (updates root package.json + creates git tag)
npm version $TYPE --no-git-tag-version

# Get new version
VERSION=$(node -p "require('./package.json').version")
echo "📌 New version: $VERSION"

# Update frontend package.json
cd frontend
npm version $VERSION --no-git-tag-version
cd ..

# Update backend package.json
cd backend
npm version $VERSION --no-git-tag-version
cd ..

# Update backend version string in source
sed -i "s/version: '.*'/version: '$VERSION'/" backend/src/index.ts

# Git commit and tag
git add -A
git commit -m "chore: bump version to v$VERSION"
git tag "v$VERSION"

echo "✅ Version bumped to v$VERSION"
echo "📌 Run 'git push && git push --tags' to publish"
