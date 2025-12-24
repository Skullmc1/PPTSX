import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // 4. Parse Slide Structure
    const slides = await this.getSlidesInOrder(zip);
    console.log(`Found ${slides.length} slides in order.`);

    // 5. Generate HTML
    await this.generateHtml(zip, slides);
    
    console.log(`Compilation complete for ${path.basename(this.filePath)}`);
  }

  async loadXml(zip, xmlPath) {
    const file = zip.file(xmlPath);
    if (!file) return null;
    const xmlStr = await file.async("string");
    return this.parser.parse(xmlStr);
  }

  async getSlidesInOrder(zip) {
    // 1. Parse Presentation Rels to map rId -> filename
    const relsObj = await this.loadXml(zip, "ppt/_rels/presentation.xml.rels");
    const relsMap = {};
    
    if (relsObj && relsObj.Relationships && relsObj.Relationships.Relationship) {
        let rels = relsObj.Relationships.Relationship;
        if (!Array.isArray(rels)) rels = [rels];
        rels.forEach(r => {
             relsMap[r['@_Id']] = r['@_Target'];
        });
    }

    // 2. Parse Presentation Manifest to get order
    const presObj = await this.loadXml(zip, "ppt/presentation.xml");
    if (!presObj || !presObj['p:presentation'] || !presObj['p:presentation']['p:sldIdLst']) {
        console.warn("Could not find slide list in presentation.xml");
        return [];
    }

    const slideIds = presObj['p:presentation']['p:sldIdLst']['p:sldId'];
    const sortedSlides = [];
    const list = Array.isArray(slideIds) ? slideIds : [slideIds];
    
    for(const sId of list) {
        const rId = sId['@_r:id']; // e.g. "rId1"
        const target = relsMap[rId]; // e.g. "slides/slide1.xml"
        if (target) {
            sortedSlides.push(path.join('ppt', target).replace(/\\/g, '/')); 
        }
    }
    return sortedSlides;
  }

  async extractMedia(zip) {
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
    }
  }

  async generateHtml(zip, slidePaths) {
    const shellPath = path.join(__dirname, 'templates', 'shell.html');
    let shellHtml = fs.readFileSync(shellPath, 'utf-8');
    
    let allSlidesHtml = '';

    for (const slidePath of slidePaths) {
        const slideXml = await this.loadXml(zip, slidePath);
        if (!slideXml) continue;

        // Parse slide rels
        // e.g. ppt/slides/slide1.xml -> ppt/slides/_rels/slide1.xml.rels
        const parsedPath = path.parse(slidePath);
        const relsPath = path.join(parsedPath.dir, '_rels', parsedPath.base + '.rels').replace(/\\/g, '/');
        const relsXml = await this.loadXml(zip, relsPath);
        
        const relsMap = {}; // rId -> target
        if (relsXml && relsXml.Relationships && relsXml.Relationships.Relationship) {
             let rels = relsXml.Relationships.Relationship;
             if (!Array.isArray(rels)) rels = [rels];
             rels.forEach(r => relsMap[r['@_Id']] = r['@_Target']);
        }

        // Generate Slide HTML
        // Assuming 16:9 aspect ratio standard: 960x540 pixels for display (scaled from EMUs)
        // 1px = 9525 EMUs
        const slideHtml = this.renderSlide(slideXml, relsMap);
        allSlidesHtml += slideHtml;
    }

    const finalHtml = shellHtml.replace('<!-- SLIDES_INJECTED_HERE -->', allSlidesHtml);
    fs.writeFileSync(path.join(this.outputDir, 'index.html'), finalHtml);

    // Copy client.js
    const clientJsPath = path.join(__dirname, 'templates', 'client.js');
    const clientJsContent = fs.readFileSync(clientJsPath, 'utf-8');
    fs.writeFileSync(path.join(this.outputDir, 'client.js'), clientJsContent);
  }

  renderSlide(slideXml, relsMap) {
    // Basic extraction
    let html = '<div class="slide" style="width: 960px; height: 540px;">\n';
    
    if (slideXml['p:sld'] && slideXml['p:sld']['p:cSld'] && slideXml['p:sld']['p:cSld']['p:spTree']) {
        const spTree = slideXml['p:sld']['p:cSld']['p:spTree'];
        const elements = [];
        
        // Shape
        if (spTree['p:sp']) {
            if (Array.isArray(spTree['p:sp'])) elements.push(...spTree['p:sp'].map(e => ({type: 'sp', data: e})));
            else elements.push({type: 'sp', data: spTree['p:sp']});
        }
        
        // Pictures
        if (spTree['p:pic']) {
             if (Array.isArray(spTree['p:pic'])) elements.push(...spTree['p:pic'].map(e => ({type: 'pic', data: e})));
             else elements.push({type: 'pic', data: spTree['p:pic']});
        }

        // Process elements
        elements.forEach(el => {
            html += this.renderElement(el, relsMap);
        });
    }

    html += '</div>\n';
    return html;
  }

  renderElement(el, relsMap) {
      const { type, data } = el;
      let style = '';
      let content = '';

      // Positioning
      // p:spPr -> a:xfrm -> a:off (x, y), a:ext (cx, cy)
      const xfrm = data['p:spPr'] ? data['p:spPr']['a:xfrm'] : null;
      if (xfrm) {
          const off = xfrm['a:off'];
          const ext = xfrm['a:ext'];
          if (off && ext) {
              const x = parseInt(off['@_x']) / 9525;
              const y = parseInt(off['@_y']) / 9525;
              const w = parseInt(ext['@_cx']) / 9525;
              const h = parseInt(ext['@_cy']) / 9525;
              style += `left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; `;
          }
      }

      if (type === 'sp') {
          // Text Body
          if (data['p:txBody']) {
              const paragraphs = data['p:txBody']['a:p'];
              const pList = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
              
              pList.forEach(p => {
                  if (p['a:r']) {
                      const runs = Array.isArray(p['a:r']) ? p['a:r'] : [p['a:r']];
                      runs.forEach(r => {
                          if (r['a:t']) {
                              content += `<span>${r['a:t']}</span>`;
                          }
                      });
                  }
                  content += '<br/>';
              });
              return `<div class="slide-element" style="${style}">${content}</div>\n`;
          }
      } else if (type === 'pic') {
          // Image
          // p:blipFill -> a:blip -> r:embed
          const blip = data['p:blipFill'] && data['p:blipFill']['a:blip'];
          if (blip) {
              const rId = blip['@_r:embed'];
              const target = relsMap[rId];
              if (target) {
                  // Target is usually "../media/image1.png" relative to slide, or "media/image1.png"
                  // We need to resolve it to "media/image1.png" in the dist folder
                  const fileName = path.basename(target);
                  return `<img class="slide-element" src="media/${fileName}" style="${style}" />\n`;
              }
          }
      }
      return '';
  }
}
