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
    this.themeColors = {};
    this.slideWidth = 960; // Default fallback
    this.slideHeight = 540; // Default fallback
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

    // 3.5 Parse Theme (for colors)
    await this.parseTheme(zip);

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

  async parseTheme(zip) {
      const themeXml = await this.loadXml(zip, "ppt/theme/theme1.xml");
      if (themeXml) {
          this.extractThemeColors(themeXml);
      }
  }

  extractThemeColors(themeXml) {
      if (!themeXml['a:theme'] || !themeXml['a:theme']['a:themeElements'] || !themeXml['a:theme']['a:themeElements']['a:clrScheme']) return;
      
      const clrScheme = themeXml['a:theme']['a:themeElements']['a:clrScheme'];
      const mapColor = (node) => {
          if (node['a:srgbClr']) return node['a:srgbClr']['@_val'];
          if (node['a:sysClr']) return node['a:sysClr']['@_lastClr'];
          return '000000'; // Fallback
      };

      this.themeColors = {
          'dk1': mapColor(clrScheme['a:dk1']),
          'lt1': mapColor(clrScheme['a:lt1']),
          'dk2': mapColor(clrScheme['a:dk2']),
          'lt2': mapColor(clrScheme['a:lt2']),
          'accent1': mapColor(clrScheme['a:accent1']),
          'accent2': mapColor(clrScheme['a:accent2']),
          'accent3': mapColor(clrScheme['a:accent3']),
          'accent4': mapColor(clrScheme['a:accent4']),
          'accent5': mapColor(clrScheme['a:accent5']),
          'accent6': mapColor(clrScheme['a:accent6']),
          'hlink': mapColor(clrScheme['a:hlink']),
          'folHlink': mapColor(clrScheme['a:folHlink']),
      };
      console.log('Theme colors loaded:', Object.keys(this.themeColors));
  }

  resolveColor(colorNode) {
      if (!colorNode) return null;
      if (colorNode['a:srgbClr']) return colorNode['a:srgbClr']['@_val'];
      if (colorNode['a:schemeClr']) {
          const val = colorNode['a:schemeClr']['@_val'];
          return this.themeColors[val] || '000000';
      }
      return '000000';
  }

  async getSlidesInOrder(zip) {
    const relsObj = await this.loadXml(zip, "ppt/_rels/presentation.xml.rels");
    const relsMap = {};
    
    if (relsObj && relsObj.Relationships && relsObj.Relationships.Relationship) {
        let rels = relsObj.Relationships.Relationship;
        if (!Array.isArray(rels)) rels = [rels];
        rels.forEach(r => {
             relsMap[r['@_Id']] = r['@_Target'];
        });
    }

    const presObj = await this.loadXml(zip, "ppt/presentation.xml");
    if (!presObj || !presObj['p:presentation']) {
        console.warn("Could not find presentation.xml");
        return [];
    }

    if (presObj['p:presentation']['p:sldSz']) {
        const sldSz = presObj['p:presentation']['p:sldSz'];
        this.slideWidth = Math.round(parseInt(sldSz['@_cx']) / 9525);
        this.slideHeight = Math.round(parseInt(sldSz['@_cy']) / 9525);
    }

    if (!presObj['p:presentation']['p:sldIdLst']) {
        return [];
    }

    const slideIds = presObj['p:presentation']['p:sldIdLst']['p:sldId'];
    const sortedSlides = [];
    const list = Array.isArray(slideIds) ? slideIds : [slideIds];
    
    for(const sId of list) {
        const rId = sId['@_r:id'];
        const target = relsMap[rId];
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
    
    // 1. Metadata Injection
    const appDir = path.join(process.cwd(), 'app');
    const metadataPath = path.join(appDir, 'metadata.js');
    
    let title = "PPTSX Presentation";
    let metaTags = '';

    if (fs.existsSync(metadataPath)) {
        try {
            const metadataUrl =  'file:///' + metadataPath.replace(/\\/g, '/');
            const metadataModule = await import(metadataUrl);
            const metadata = metadataModule.default;

            if (metadata.title) title = metadata.title;
            if (metadata.description) metaTags += `<meta name="description" content="${metadata.description}">\n`;
            if (metadata.author) metaTags += `<meta name="author" content="${metadata.author}">\n`;
        } catch (err) {
            console.warn(`Failed to load metadata.js: ${err.message}`);
        }
    }
    
    shellHtml = shellHtml.replace('<title>PPTSX Presentation</title>', `<title>${title}</title>\n${metaTags}`);

    // 2. Favicon Injection
    const faviconPath = path.join(appDir, 'favicon.png');
    let headInjection = '';

    if (fs.existsSync(faviconPath)) {
        fs.copyFileSync(faviconPath, path.join(this.outputDir, 'favicon.png'));
        headInjection += '<link rel="icon" href="favicon.png" type="image/png">\n';
    }
    shellHtml = shellHtml.replace('</head>', `${headInjection}</head>`);
    
    let allSlidesHtml = '';

    for (const slidePath of slidePaths) {
        const slideXml = await this.loadXml(zip, slidePath);
        if (!slideXml) continue;

        const parsedPath = path.parse(slidePath);
        const relsPath = path.join(parsedPath.dir, '_rels', parsedPath.base + '.rels').replace(/\\/g, '/');
        const relsXml = await this.loadXml(zip, relsPath);
        
        const relsMap = {};
        if (relsXml && relsXml.Relationships && relsXml.Relationships.Relationship) {
             let rels = relsXml.Relationships.Relationship;
             if (!Array.isArray(rels)) rels = [rels];
             rels.forEach(r => relsMap[r['@_Id']] = r['@_Target']);
        }

        const slideHtml = this.renderSlide(slideXml, relsMap);
        allSlidesHtml += slideHtml;
    }

    const finalHtml = shellHtml.replace('<!-- SLIDES_INJECTED_HERE -->', allSlidesHtml);
    fs.writeFileSync(path.join(this.outputDir, 'index.html'), finalHtml);

    const clientJsPath = path.join(__dirname, 'templates', 'client.js');
    const clientJsContent = fs.readFileSync(clientJsPath, 'utf-8');
    fs.writeFileSync(path.join(this.outputDir, 'client.js'), clientJsContent);
  }

  renderSlide(slideXml, relsMap) {
    let slideStyle = 'width: 960px; height: 540px; ';
    
    if (slideXml['p:sld'] && slideXml['p:sld']['p:cSld'] && slideXml['p:sld']['p:cSld']['p:bg']) {
        const bg = slideXml['p:sld']['p:cSld']['p:bg'];
        if (bg['p:bgPr'] && bg['p:bgPr']['a:solidFill']) {
            const hex = this.resolveColor(bg['p:bgPr']['a:solidFill']);
            if (hex) slideStyle += `background-color: #${hex}; `;
        }
        // TODO: Handle Image Backgrounds (blipFill) in bgPr
    }

    let html = `<div class="slide-wrapper">\n<div class="slide" style="${slideStyle}">\n`;
    
    if (slideXml['p:sld'] && slideXml['p:sld']['p:cSld'] && slideXml['p:sld']['p:cSld']['p:spTree']) {
        const spTree = slideXml['p:sld']['p:cSld']['p:spTree'];
        html += this.processTree(spTree, relsMap);
    }

    html += '</div>\n</div>\n';
    return html;
  }

  processTree(tree, relsMap) {
      let html = '';
      const elements = [];

      if (tree['p:grpSp']) {
           if (Array.isArray(tree['p:grpSp'])) elements.push(...tree['p:grpSp'].map(e => ({type: 'grpSp', data: e})));
           else elements.push({type: 'grpSp', data: tree['p:grpSp']});
      }

      if (tree['p:sp']) {
          if (Array.isArray(tree['p:sp'])) elements.push(...tree['p:sp'].map(e => ({type: 'sp', data: e})));
          else elements.push({type: 'sp', data: tree['p:sp']});
      }
      
      if (tree['p:pic']) {
           if (Array.isArray(tree['p:pic'])) elements.push(...tree['p:pic'].map(e => ({type: 'pic', data: e})));
           else elements.push({type: 'pic', data: tree['p:pic']});
      }

      elements.forEach(el => {
          html += this.renderElement(el, relsMap);
      });
      return html;
  }

  renderElement(el, relsMap) {
      const { type, data } = el;
      
      if (type === 'grpSp') {
          return this.processTree(data, relsMap);
      }

      let style = '';
      let content = '';
      let tagName = 'div';
      let attrs = '';

      // Positioning
      const spPr = data['p:spPr'];
      const xfrm = spPr ? spPr['a:xfrm'] : null;
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

      if (spPr) {
          if (spPr['a:solidFill']) {
              const hex = this.resolveColor(spPr['a:solidFill']);
              if (hex) style += `background-color: #${hex}; `;
          }
          if (spPr['a:ln']) {
              const ln = spPr['a:ln'];
              if (!ln['a:noFill']) {
                  const w = ln['@_w'] ? parseInt(ln['@_w']) / 12700 : 1; 
                  if (ln['a:solidFill']) {
                       const hex = this.resolveColor(ln['a:solidFill']);
                       style += `border: ${w}pt solid #${hex}; `;
                  }
              }
          }
      }

      if (type === 'sp') {
          if (data['p:txBody']) {
              const paragraphs = data['p:txBody']['a:p'];
              const pList = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
              
              let textHtml = '';
              pList.forEach(p => {
                  let pContent = '';
                  let pStyle = 'margin: 0; white-space: pre-wrap; word-wrap: break-word;';
                  
                  if (p['a:r']) {
                      const runs = Array.isArray(p['a:r']) ? p['a:r'] : [p['a:r']];
                      runs.forEach(r => {
                          let runStyle = '';
                          if (r['a:rPr']) {
                              if (r['a:rPr']['@_sz']) {
                                  const pt = parseInt(r['a:rPr']['@_sz']) / 100;
                                  const px = pt * 1.3333;
                                  runStyle += `font-size: ${px.toFixed(2)}px; `;
                              }
                              // Color
                              if (r['a:rPr']['a:solidFill']) {
                                  const hex = this.resolveColor(r['a:rPr']['a:solidFill']);
                                  runStyle += `color: #${hex}; `;
                              }
                              // Typeface
                              if (r['a:rPr']['a:latin']) {
                                  const font = r['a:rPr']['a:latin']['@_typeface'];
                                  runStyle += `font-family: "${font}", sans-serif; `;
                              }
                              if (r['a:rPr']['@_b'] === '1') runStyle += 'font-weight: bold; ';
                              if (r['a:rPr']['@_i'] === '1') runStyle += 'font-style: italic; ';
                              if (r['a:rPr']['@_u'] === 'sng') runStyle += 'text-decoration: underline; ';
                          }

                          if (r['a:t']) {
                              pContent += `<span style="${runStyle}">${r['a:t']}</span>`;
                          }
                      });
                  }
                  
                  // Handle empty paragraphs (newlines)
                  if (!pContent) pContent = '&nbsp;';
                  
                  textHtml += `<div style="${pStyle}">${pContent}</div>`;
              });
              content = textHtml;
          }
      } else if (type === 'pic') {
          tagName = 'img';
          const blip = data['p:blipFill'] && data['p:blipFill']['a:blip'];
          if (blip) {
              const rId = blip['@_r:embed'];
              const target = relsMap[rId];
              if (target) {
                  const fileName = path.basename(target);
                  attrs += `src="media/${fileName}" `;
              }
          }
      }
      
      return `<${tagName} class="slide-element" style="${style}" ${attrs}>${content}</${tagName}>\n`;
  }
}
