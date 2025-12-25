#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Compiler } from '../lib/compiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

console.log(`PPTSX CLI - v1.0.0`);

if (!command || command === '--help' || command === '-h' || command === 'help') {
  console.log('Usage: pptsx [command]');
  console.log('');
  console.log('Commands:');
  console.log('  dev                     Start the development server');
  console.log('  build                   Build the project for production');
  console.log('  icon <path/to/icon.png> Set the favicon for the project');
  console.log('  --help, -h, help        Show this help message');
  // Exit with 0 for help/version info (common practice)
  process.exit(0);
}

// Simple routing for now
if (command === 'dev') {
  console.log('Starting development server...');
  import('../lib/dev.js').then(module => module.startDevServer());
} else if (command === 'build') {
  console.log('Building project...');
  
  const appDir = path.join(process.cwd(), 'app');
  const distDir = path.join(process.cwd(), '.pptsx/dist');
  
  if (!fs.existsSync(appDir)) {
      console.error("Error: 'app' directory not found.");
      process.exit(1);
  }

  // Recursive find index.pptx
  async function buildRecursive(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
              await buildRecursive(fullPath);
          } else if (entry.isFile() && entry.name === 'index.pptx') {
              const relativeDir = path.dirname(path.relative(appDir, fullPath));
              const targetDir = path.join(distDir, relativeDir);
              const compiler = new Compiler(fullPath, targetDir);
              await compiler.compile();
          }
      }
  }

  buildRecursive(appDir).then(() => {
      console.log('Build complete.');
  });

} else if (command === 'icon') {
  const iconPath = args[1];
  if (!iconPath) {
    console.error('Error: Please provide a path to the icon file.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), iconPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Icon file not found at ${resolvedPath}`);
    process.exit(1);
  }

  const appDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir);
  }

  const destPath = path.join(appDir, 'favicon.png');
  fs.copyFileSync(resolvedPath, destPath);
  console.log(`Favicon updated successfully! Copied to ${destPath}`);

} else {
  console.log(`Unknown command: ${command}`);
}
