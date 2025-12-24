import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export class Compiler {
  constructor(filePath, outputDir) {
    this.filePath = filePath;
    this.outputDir = outputDir;
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  async compile() {
    console.log(`Compiling ${this.filePath}...`);
    
    // 1. Read File
    let data;
    try {
      data = await fs.promises.readFile(this.filePath);
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
      return;
    }

    // 2. Unzip
    let zip;
    try {
      zip = await JSZip.loadAsync(data);
    } catch (err) {
      console.error(`Error invalid pptx (zip): ${err.message}`);
      return;
    }

    // Ensure output directories exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 3. Extract Media
    await this.extractMedia(zip);

    // 4. Parse Slides (Basic Check)
    await this.parseSlides(zip);
    
    console.log(`Compilation complete for ${path.basename(this.filePath)}`);
  }

  async extractMedia(zip) {
    // ppt/media/ contains images, videos, etc.
    // Note: JSZip folders might not be explicitly strictly iterable in some versions, 
    // but regex matching on files is robust.
    const mediaFiles = Object.keys(zip.files).filter(path => path.startsWith("ppt/media/") && !zip.files[path].dir);
    
    if (mediaFiles.length === 0) return;

    const outputMediaDir = path.join(this.outputDir, 'media');
    if (!fs.existsSync(outputMediaDir)) {
      fs.mkdirSync(outputMediaDir, { recursive: true });
    }

    for (const relativePath of mediaFiles) {
        const file = zip.files[relativePath];
        const content = await file.async("nodebuffer");
        const fileName = path.basename(relativePath);
        await fs.promises.writeFile(path.join(outputMediaDir, fileName), content);
        // console.log(`Extracted media: ${fileName}`);
    }
  }

  async parseSlides(zip) {
    // Check for presentation.xml to see slide order (future)
    // For now, let's just list the slides found.
    const slideFiles = Object.keys(zip.files).filter(path => path.match(/^ppt\/slides\/slide\d+\.xml$/));
    
    console.log(`Found ${slideFiles.length} slides.`);
    
    for (const slidePath of slideFiles) {
        const slideXmlStr = await zip.files[slidePath].async("string");
        const slideObj = this.parser.parse(slideXmlStr);
        // Just verify we can parse it
        // console.log(`Parsed ${slidePath}`);
    }
  }
}
