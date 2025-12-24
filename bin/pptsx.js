#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

console.log(`PPTSX CLI - v1.0.0`);

if (!command) {
  console.log('Usage: pptsx [command]');
  console.log('Commands:');
  console.log('  dev    Start the development server');
  console.log('  build  Build the project for production');
  process.exit(1);
}

// Simple routing for now
if (command === 'dev') {
  console.log('Starting development server...');
  import('../lib/dev.js').then(module => module.startDevServer());
} else if (command === 'build') {
  console.log('Building project...');
  // import('../lib/build.js').then(module => module.buildProject());
  console.log('Build command not implemented yet.');
} else {
  console.log(`Unknown command: ${command}`);
}
