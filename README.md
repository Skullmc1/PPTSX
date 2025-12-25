# PPTSX - PowerPoint to Static Website Framework

**PPTSX** is a modern framework that converts PowerPoint presentations (`.pptx` files) into interactive, responsive static websites. It's designed for developers, designers, and content creators who want to leverage PowerPoint's powerful design tools while delivering content as a web experience.

## 🎯 Example Files Included

PPTSX comes with working example files to help you understand how it works:

- **Main Example**: `app/index.pptx` - "Welcome to PPTSX!" slide with blue theme
- **About Example**: `app/about/index.pptx` - "About PPTSX" slide with green theme

These examples demonstrate the core features and serve as templates for your own presentations.

## 🚀 Features

- **PowerPoint to Web**: Convert `.pptx` files to responsive HTML/CSS/JS websites
- **Live Development**: Watch for changes and auto-compile during development
- **Multi-page Support**: Organize your site with multiple PowerPoint files
- **Theme Support**: Extract and use PowerPoint theme colors
- **Media Handling**: Automatically extract and optimize images from presentations
- **Responsive Design**: Slides scale beautifully on any device
- **Custom Metadata**: Add titles, descriptions, and author information
- **Custom Favicons**: Set your own favicon for branding

## 📦 Installation

```bash
npm install -g pptsx
```

## 🚀 npm Publishing

This project includes a GitHub Actions workflow for automated npm publishing.

### Publishing a New Version

1. **Update the version** in `package.json`:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. **Commit and tag** the version:
   ```bash
   git add package.json
   git commit -m "Bump version to X.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   ```

3. **GitHub Actions** will automatically:
   - Run tests (if any)
   - Build the project
   - Publish to npm
   - Create a GitHub release

### Requirements

- **NPM_TOKEN**: Set up in GitHub Secrets with npm publish permissions
- **GITHUB_TOKEN**: Automatically provided by GitHub Actions

### Workflow Details

The workflow includes:
- **Basic validation**: Checks package.json structure and bin configuration
- **CLI testing**: Verifies the CLI can be invoked without errors
- **Graceful handling**: Continues even if build/test scripts are missing

### Manual Publishing

If you need to publish manually:
```bash
npm login
npm publish
```

### Testing the Workflow Locally

You can test the validation steps locally:
```bash
# Test package.json validation
node -e "const pkg = require('./package.json'); console.log('✓ Package valid:', pkg.name, pkg.version)"

# Test CLI help
node bin/pptsx.js --help
# or
node bin/pptsx.js -h
# or
node bin/pptsx.js help
```

## 🛠️ Quick Start

### 1. Create a new PPTSX project

```bash
mkdir my-presentation-site
cd my-presentation-site
npm init -y
npm install pptsx
```

### 2. Set up your project structure

```bash
pptsx
```

This creates an `app/` directory with the basic structure.

### 3. Explore the example files

PPTSX comes with example PowerPoint files to help you get started:

- `app/index.pptx` - Main welcome slide with instructions
- `app/about/index.pptx` - Example about page

These examples demonstrate:
- Theme color support (blue and green backgrounds)
- Text formatting (bold titles, regular subtitles)
- Proper slide structure

### 4. Replace with your own content

Replace the example files with your own PowerPoint presentations:

```
app/
├── index.pptx          # Main presentation (homepage) - REPLACE THIS
├── about/
│   └── index.pptx     # About page - REPLACE THIS
├── favicon.png        # Optional custom favicon
└── metadata.js        # Optional metadata
```

### 4. Start development server

```bash
pptsx dev
```

This starts a development server at `http://localhost:3000` that watches for changes and auto-compiles your PowerPoint files.

### 5. Build for production

```bash
pptsx build
```

This compiles all your PowerPoint files to static HTML in the `.pptsx/dist/` directory.

## 🎨 Project Structure

```
my-project/
├── app/                # Your source files
│   ├── index.pptx      # Main presentation (required)
│   ├── about/          # Sub-pages (optional)
│   │   └── index.pptx  # About page presentation
│   ├── favicon.png     # Custom favicon (optional)
│   └── metadata.js     # Site metadata (optional)
├── .pptsx/             # Build output (auto-generated)
│   └── dist/           # Compiled website
└── package.json
```

## 📝 Metadata Configuration

Create a `metadata.js` file in your `app/` directory to customize your site:

```javascript
export default {
  title: "My Awesome Presentation",
  description: "A presentation about amazing things",
  author: "Your Name",
};
```

## 🖼️ Custom Favicon

Set a custom favicon for your site:

```bash
pptsx icon path/to/your-icon.png
```

This copies the icon to `app/favicon.png` and uses it in your compiled site.

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `pptsx dev` | Start development server with live reloading |
| `pptsx build` | Build production-ready static site |
| `pptsx icon <path>` | Set custom favicon |

## 💡 How It Works

PPTSX works by:

1. **Unzipping** the PowerPoint file (`.pptx` is actually a ZIP archive)
2. **Parsing** the XML structure to extract slides, text, shapes, and images
3. **Extracting** theme colors and slide dimensions
4. **Converting** PowerPoint elements to HTML/CSS equivalents
5. **Generating** responsive web pages with proper scaling
6. **Handling** media files (images) and placing them in the correct locations

## 🎯 Supported PowerPoint Features

- **Slides**: Multiple slides with proper ordering
- **Text**: Formatted text with fonts, colors, sizes, and styles
- **Shapes**: Rectangles and other shapes with fills and borders
- **Images**: Picture elements with proper positioning
- **Themes**: Color schemes from PowerPoint themes
- **Layout**: Precise positioning and sizing
- **Responsive**: Automatic scaling for different screen sizes

## 📁 Output Structure

The compiled site is generated in `.pptsx/dist/` with:

```
.pptsx/dist/
├── index.html          # Main HTML file
├── client.js           # Responsive scaling logic
├── favicon.png        # Favicon (if provided)
├── media/             # Extracted images
└── about/             # Sub-pages (if any)
    └── index.html
```

## 🌐 Deployment

The output is static HTML/CSS/JS, so you can deploy it anywhere:

- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any static hosting service

## 🐛 Limitations

PPTSX is currently in early development. Some PowerPoint features are not yet supported:

- Animations and transitions
- Complex shapes and diagrams
- Tables and charts
- Audio and video
- Slide notes and comments
- Master slides and layouts

## 🤖 GitHub Actions Workflow

The project includes a `.github/workflows/publish.yml` file that automates the publishing process:

- **Trigger**: Pushes to version tags (e.g., `v1.0.0`)
- **Platform**: Windows (since this project was developed on Windows)
- **Steps**:
  1. Checkout repository
  2. Setup Node.js 20
  3. Install dependencies
  4. Run build script
  5. Run tests
  6. Publish to npm
  7. Create GitHub release

## 🤝 Contributing

Contributions are welcome! Please open issues for bugs or feature requests, and submit pull requests for improvements.

## 📄 License

ISC License

## 📬 Contact

For questions or support, please open an issue on the GitHub repository.

---

**PPTSX** - Turning presentations into websites, one slide at a time! 🎉