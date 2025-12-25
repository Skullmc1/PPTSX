import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PPTX generator using JSZip
async function createExamplePptx(outputPath, title, subtitle, backgroundColor = 'FFFFFF') {
    const zip = new JSZip();
    
    // 1. Create [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml" />
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml" />
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml" />
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml" />
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml" />
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml" />
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);
    
    // 2. Create _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml" />
</Relationships>`;
    zip.folder("_rels").file(".rels", rels);
    
    // 3. Create ppt/presentation.xml
    const presentation = `<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1" />
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2" />
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500" />
</p:presentation>`;
    
    // 4. Create ppt/_rels/presentation.xml.rels
    const presRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml" />
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml" />
</Relationships>`;
    
    // 5. Create ppt/slides/slide1.xml
    const slide = `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill>
          <a:srgbClr val="${backgroundColor}" />
        </a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name="" />
        <p:cNvGrpSpPr />
        <p:nvPr />
      </p:nvGrpSpPr>
      <p:grpSpPr />
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title" />
          <p:cNvSpPr />
          <p:nvPr />
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="1000000" y="500000" />
            <a:ext cx="8000000" cy="1000000" />
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr />
          <a:lstStyle />
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="4400" b="1" />
              <a:t>${title}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Subtitle" />
          <p:cNvSpPr />
          <p:nvPr />
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="1000000" y="1500000" />
            <a:ext cx="8000000" cy="500000" />
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr />
          <a:lstStyle />
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2800" />
              <a:t>${subtitle}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
    
    // 6. Create ppt/slideLayouts/slideLayout1.xml
    const slideLayout = `<?xml version="1.0" encoding="UTF-8"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="title">
  <p:cSld name="Title Slide">
    <p:bg>
      <p:bgRef idx="1000">
        <a:schemeClr val="bg1" />
      </p:bgRef>
    </p:bg>
  </p:cSld>
</p:sldLayout>`;
    
    // 7. Create ppt/slideMasters/slideMaster1.xml
    const slideMaster = `<?xml version="1.0" encoding="UTF-8"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg>
      <p:bgPr />
      <p:bgRef idx="1000">
        <a:schemeClr val="bg1" />
      </p:bgRef>
    </p:bg>
  </p:cSld>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1" />
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lvl1pPr>
        <a:defRPr sz="4400" b="1" />
      </a:lvl1pPr>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lvl1pPr>
        <a:defRPr sz="2800" />
      </a:lvl1pPr>
    </p:bodyStyle>
  </p:txStyles>
</p:sldMaster>`;
    
    // 8. Create ppt/slideMasters/_rels/slideMaster1.xml.rels
    const masterRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml" />
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml" />
</Relationships>`;
    
    // 9. Create ppt/theme/theme1.xml
    const theme = `<?xml version="1.0" encoding="UTF-8"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1>
        <a:sysClr val="windowText" lastClr="000000" />
      </a:dk1>
      <a:lt1>
        <a:sysClr val="window" lastClr="FFFFFF" />
      </a:lt1>
      <a:dk2>
        <a:srgbClr val="1F497D" />
      </a:dk2>
      <a:lt2>
        <a:srgbClr val="EEECE1" />
      </a:lt2>
      <a:accent1>
        <a:srgbClr val="4F81BD" />
      </a:accent1>
      <a:accent2>
        <a:srgbClr val="C0504D" />
      </a:accent2>
      <a:accent3>
        <a:srgbClr val="9BBB59" />
      </a:accent3>
      <a:accent4>
        <a:srgbClr val="8064A2" />
      </a:accent4>
      <a:accent5>
        <a:srgbClr val="4BACC6" />
      </a:accent5>
      <a:accent6>
        <a:srgbClr val="F79646" />
      </a:accent6>
      <a:hlink>
        <a:srgbClr val="0000FF" />
      </a:hlink>
      <a:folHlink>
        <a:srgbClr val="800080" />
      </a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont>
        <a:latin typeface="Calibri" />
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri" />
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill>
          <a:schemeClr val="phClr" />
        </a:solidFill>
      </a:fillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;
    
    // Build the PPTX structure
    const pptFolder = zip.folder("ppt");
    pptFolder.file("presentation.xml", presentation);
    pptFolder.folder("_rels").file("presentation.xml.rels", presRels);
    pptFolder.folder("slides").file("slide1.xml", slide);
    pptFolder.folder("slideLayouts").file("slideLayout1.xml", slideLayout);
    const mastersFolder = pptFolder.folder("slideMasters");
    mastersFolder.file("slideMaster1.xml", slideMaster);
    mastersFolder.folder("_rels").file("slideMaster1.xml.rels", masterRels);
    pptFolder.folder("theme").file("theme1.xml", theme);
    
    // Generate the PPTX file
    const content = await zip.generateAsync({ type: "nodebuffer" });
    fs.writeFileSync(outputPath, content);
    console.log(`Created example PPTX: ${outputPath}`);
}

// Create example files
async function main() {
    const appDir = path.join(__dirname, '..', 'app');
    
    // Ensure app directory exists
    if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
    }
    
    // Create main example
    await createExamplePptx(
        path.join(appDir, 'index.pptx'),
        'Welcome to PPTSX!',
        'Start by replacing this file with your own PowerPoint presentation.',
        '4F81BD' // Blue background
    );
    
    // Create about example
    const aboutDir = path.join(appDir, 'about');
    if (!fs.existsSync(aboutDir)) {
        fs.mkdirSync(aboutDir, { recursive: true });
    }
    
    await createExamplePptx(
        path.join(aboutDir, 'index.pptx'),
        'About PPTSX',
        'PPTSX converts PowerPoint presentations to responsive websites.',
        '9BBB59' // Green background
    );
    
    console.log('Example PPTX files created successfully!');
}

main().catch(console.error);