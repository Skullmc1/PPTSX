import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

const zip = new JSZip();

// 1. Media
zip.folder("ppt").folder("media").file("image1.png", Buffer.from("fakeimage"));

// 2. Slides
const slide1Xml = `
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title 1"/></p:nvSpPr>
        <p:spPr>
            <a:off x="0" y="0"/>
            <a:ext cx="9144000" cy="1143000"/>
        </p:spPr>
        <p:txBody>
          <a:p><a:r><a:t>Hello World Slide 1</a:t></a:r></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

const slide2Xml = `
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Slide 2 Content</a:t></a:r></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

zip.folder("ppt").folder("slides").file("slide1.xml", slide1Xml);
zip.folder("ppt").folder("slides").file("slide2.xml", slide2Xml);

// 3. Presentation Relationship (.rels)
// Maps rId to file paths
const presentationRels = `
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>
`;
zip.folder("ppt").folder("_rels").file("presentation.xml.rels", presentationRels);

// 4. Presentation Manifest
// Defines the order of slides using rIds
const presentationXml = `
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>
`;
zip.folder("ppt").file("presentation.xml", presentationXml);

// Generate
const content = await zip.generateAsync({ type: "nodebuffer" });
const appDir = path.join(process.cwd(), 'app');

if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir);
}

fs.writeFileSync(path.join(appDir, 'test_pres.pptx'), content);
console.log("Created app/test_pres.pptx with valid structure.");
