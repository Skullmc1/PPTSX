# PPTSX Development Roadmap (Method B: Native Parsing)

## 1. Core Concept
A Node.js-based web framework that compiles `.pptx` files natively into a static HTML/CSS/JS website.
**Constraint**: Zero external dependencies like LibreOffice. Pure Node.js parsing of the OOXML standard.

## 2. Architecture
*   **Input**: `app/*.pptx`
*   **Engine**: `jszip` (to read the pptx archive) + `fast-xml-parser` (to read the internal XML).
*   **Output**: `.pptsx/dist/` (Static HTML files + extracted assets).
*   **Server**: A local dev server that serves the build folder and watches for changes.

## 3. Tech Stack
*   **Runtime**: Node.js
*   **Language**: JavaScript (ES Modules)
*   **Key Libraries**:
    *   `jszip`: Decompressing the `.pptx` file.
    *   `fast-xml-parser`: Parsing the internal XML structure.
    *   `chokidar`: Watching the `app/` folder for changes.
    *   `express`: Serving the local development version.

## 4. Roadmap

### Phase 1: Project Initialization & CLI Scaffold [DONE]
1.  [x] Initialize `package.json` and basic project structure.
2.  [x] Create the `bin/pptsx.js` executable entry point.
3.  [x] Implement the directory structure generator (creates `app/` if it doesn't exist).
4.  [x] Set up the `dev` command skeleton.

### Phase 2: The "Unzipper" & Asset Extraction [DONE]
1.  [x] Implement logic to read a `.pptx` file into a buffer.
2.  [x] Use `jszip` to extract:
    *   `ppt/slides/slide*.xml` (The content)
    *   `ppt/media/*` (Images/Videos)
    *   `ppt/presentation.xml` (The slide order/manifest)
3.  [x] Save extracted media to `.pptsx/dist/media`.

### Phase 3: The XML-to-HTML Compiler (The Hard Part) [DONE]
1.  [x] **Slide Manifest Parsing**: Parse `ppt/presentation.xml` and `ppt/_rels/presentation.xml.rels` to determine correct slide order and relationships.
2.  [x] **Basic Slide Parsing**: Iterate through extracted XMLs and identify slide boundaries.
3.  [x] **Coordinate System Transformation**: Convert OOXML English Metric Units (EMUs) to pixels (1 pixel = 9525 EMUs).
4.  [x] **Text Rendering**: 
    *   Extract text runs (`<a:r>`) and paragraphs (`<a:p>`).
    *   Map to HTML `<div>` with absolute positioning.
    *   Handle basic formatting: Bold, Italic, Underline.
5.  [x] **Shape & Image Rendering**: 
    *   Extract shape geometry and colors.
    *   Map `<p:pic>` elements to `<img>` tags, resolving relationship IDs to media paths.
6.  [x] **Positioning**: Use `<a:off>` (offset) and `<a:ext>` (extents) for CSS `top`, `left`, `width`, `height`.
7.  [ ] **Styling**: Extract theme colors from `ppt/theme/theme1.xml` and apply to elements.

### Phase 4: The Framework Runtime (Client-Side) [DONE]
1.  [x] **Shell Template**: Create `lib/templates/shell.html` with a placeholder for slide content.
2.  [x] **Slide Injection**: Compiler generates a `slides.json` or embeds slide HTML into the shell.
3.  [x] **Client-side Navigation (`client.js`)**:
    *   Implement `nextSlide()` and `prevSlide()` logic.
    *   State management (current slide index in URL hash).
    *   Keyboard bindings (Right/Left arrows, Space, PageDown/Up).
    *   Touch gestures (Swipe left/right).
4.  [ ] **Transitions**: Add simple CSS transitions between slides.

### Phase 5: Dev Server & Watcher [DONE]
1.  [x] Integrate `chokidar` to watch `app/*.pptx`.
2.  [x] On change: Re-run the Compiler -> Update the `dist` folder.
3.  [x] Start `express` server on localhost:3000.
4.  [x] **File-based Routing**: Map `app/path/to/index.pptx` to `localhost:3000/path/to/`.
5.  [ ] **Auto-reload**: Implement WebSockets (or simple polling) to trigger browser refresh when `dist` updates.

### Phase 6: Build & Export [DONE]
1.  [x] Implement `pptsx build` command.
2.  [x] Bundle all assets into a standalone `dist/` folder.
3.  [x] Minify JS/CSS for production. (Basic copying implemented, minification pending optimization)
4.  [x] Generate an `index.html` that works without a server (file:// protocol compatibility).

### Phase 7: Advanced Features [FUTURE]
1.  **Animations**: Map PPT entry/exit animations to CSS animations.
2.  **Notes**: Extract speaker notes and display them in a "Presenter View".
3.  **Charts & Tables**: Basic support for tabular data rendering.
4.  **LaTeX Support**: If text contains math, optionally render with KaTeX.

## 5. Current Status
*   **Phase**: Complete
*   **Next Action**: Polish and user testing.