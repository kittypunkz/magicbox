#!/usr/bin/env node

/**
 * Sync version from root package.json to all project files
 * Run this before building: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Read root package.json
const rootPackage = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
);
const version = rootPackage.version;

console.log(`🔄 Syncing version ${version} to all files...\n`);

const updates = [];

// 1. Update backend/package.json
const backendPkgPath = path.join(rootDir, 'backend', 'package.json');
const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
if (backendPkg.version !== version) {
  backendPkg.version = version;
  fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2) + '\n');
  updates.push('✅ backend/package.json');
}

// 2. Update frontend/package.json
const frontendPkgPath = path.join(rootDir, 'frontend', 'package.json');
const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
if (frontendPkg.version !== version) {
  frontendPkg.version = version;
  fs.writeFileSync(frontendPkgPath, JSON.stringify(frontendPkg, null, 2) + '\n');
  updates.push('✅ frontend/package.json');
}

// 3. Update backend/src/index.ts
const backendIndexPath = path.join(rootDir, 'backend', 'src', 'index.ts');
let backendIndex = fs.readFileSync(backendIndexPath, 'utf8');
const versionRegex = /version:\s*'[^']+'/;
if (versionRegex.test(backendIndex)) {
  const newBackendIndex = backendIndex.replace(versionRegex, `version: '${version}'`);
  if (newBackendIndex !== backendIndex) {
    fs.writeFileSync(backendIndexPath, newBackendIndex);
    updates.push('✅ backend/src/index.ts');
  }
}

// 4. Update frontend/src/components/Sidebar.tsx
const sidebarPath = path.join(rootDir, 'frontend', 'src', 'components', 'Sidebar.tsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf8');
const sidebarVersionRegex = /v\d+\.\d+\.\d+/;
if (sidebarVersionRegex.test(sidebar)) {
  const newSidebar = sidebar.replace(sidebarVersionRegex, `v${version}`);
  if (newSidebar !== sidebar) {
    fs.writeFileSync(sidebarPath, newSidebar);
    updates.push('✅ frontend/src/components/Sidebar.tsx');
  }
}

if (updates.length === 0) {
  console.log('✨ All files already at version', version);
} else {
  console.log('Updated files:');
  updates.forEach(u => console.log('  ', u));
  console.log(`\n🎉 Version ${version} synced successfully!`);
}
