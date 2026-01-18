#!/usr/bin/env node

/**
 * Post-build script to embed logo.png as base64 in manifest.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '..', 'manifest.json');
const logoPath = path.join(__dirname, '..', 'logo.png');

try {
    // Read manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Read logo and convert to base64
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${logoBase64}`;

    // Update manifest with base64 icon
    manifest.icon = dataUri;

    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');

    console.log('✓ Icon embedded in manifest.json');
} catch (error) {
    console.error('✗ Failed to update manifest:', error.message);
    process.exit(1);
}
