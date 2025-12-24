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
    // Only compile index.pptx files
    if (path.basename(filePath) !== 'index.pptx') {
        // Optional: Log that we are ignoring non-index files
        // console.log(`Ignoring ${path.basename(filePath)} (not index.pptx)`);
        return;
    }

    // Determine relative path to maintain structure
    // e.g. app/contact/index.pptx -> relativeDir = "contact"
    const relativeDir = path.dirname(path.relative(appDir, filePath));
    const targetDir = path.join(distDir, relativeDir);

    const compiler = new Compiler(filePath, targetDir);
    await compiler.compile();
  };

  watcher
    .on('add', path => {
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

  // Fallback for root if no index.html exists yet
  app.get('/', (req, res, next) => {
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
        next();
    } else {
        res.send('<h1>PPTSX Framework</h1><p>Waiting for app/index.pptx to be compiled...</p>');
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
