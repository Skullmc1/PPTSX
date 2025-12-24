import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import express from 'express';
import { Compiler } from './compiler.js';

export function startDevServer() {
  const cwd = process.cwd();
  const appDir = path.join(cwd, 'app');
  const distDir = path.join(cwd, '.pptsx/dist');

  // 1. Ensure 'app' directory exists
  if (!fs.existsSync(appDir)) {
    console.log(`Creating 'app' directory...`);
    fs.mkdirSync(appDir);
    console.log(`Please place your .pptx files in the 'app' folder and restart.`);
  }

  // 2. Start the watcher
  console.log(`Watching ${appDir} for changes...`);
  const watcher = chokidar.watch(appDir, {
    ignored: (p) => path.basename(p).startsWith('.'), 
    persistent: true
  });

  const runCompiler = async (filePath) => {
    if (path.extname(filePath) !== '.pptx') return;
    const compiler = new Compiler(filePath, distDir);
    await compiler.compile();
  };

  watcher
    .on('add', path => {
        console.log(`File ${path} has been added`);
        runCompiler(path);
    })
    .on('change', path => {
        console.log(`File ${path} has been changed`);
        runCompiler(path);
    })
    .on('unlink', path => console.log(`File ${path} has been removed`));

  // 3. Start the Express server
  const app = express();
  const port = 3000;

  // Serve the compiled assets
  app.use(express.static(distDir));

  app.get('/', (req, res) => {
    res.send('<h1>PPTSX Framework</h1><p>Waiting for presentation compilation...</p><p>Check .pptsx/dist/ for output.</p>');
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
