# Accessibility Auditor – Figma Plugin

A professional-grade Figma plugin for auditing text accessibility and contrast ratios in your designs. Built with TypeScript, React (Preact), and Tailwind CSS using the `create-figma-plugin` architecture.

![Accessibility Auditor](https://img.shields.io/badge/WCAG-2.1-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)

## ✨ Features

### 🔍 Comprehensive Scanning Engine
- **Recursive layer scanning** – Analyzes all text layers within your selection or the entire page
- **Library font support** – Uses `figma.getStyleById` to accurately identify fonts, even from linked libraries
- **Complete font extraction** – Captures `fontFamily`, `fontSize`, `fontWeight`, and `lineHeight`

### 📐 Reliable Contrast Calculation
- **WCAG 2.1 compliant** – Implements the official W3C contrast ratio algorithm
- **Smart background detection** – Calculates contrast against:
  - Immediate parent frame fills
  - Sibling layers positioned behind the text
  - Page/canvas background as fallback
- **Alpha channel support** – Handles semi-transparent colors with proper alpha compositing

### 🎨 Modern UI (React + Tailwind CSS)
- **Clean dashboard** – Lists all text layers with status indicators
- **Powerful filtering** – Filter by "Errors Only" (Contrast < 4.5:1), Warnings, or Passed
- **Search functionality** – Find layers by name, text content, font, or parent
- **One-click navigation** – Click any layer to zoom to it in Figma

### 🛡️ Reliability Features
- **Re-scan button** – Refresh data after design changes
- **Missing font detection** – Shows warning icons for uninstalled fonts
- **Graceful error handling** – Clear feedback for edge cases

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v22 or later
- [Figma Desktop App](https://figma.com/downloads/)

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the plugin**
   ```bash
   npm run build
   ```
   
   For development with hot reload:
   ```bash
   npm run watch
   ```

4. **Import into Figma**
   - Open the Figma desktop app
   - Go to **Plugins** → **Development** → **Import plugin from manifest...**
   - Select the generated `manifest.json` file

### Usage

1. **Select layers** in your Figma document (or leave empty to scan the entire page)
2. **Run the plugin** from the Plugins menu
3. **Review the results** – errors appear at the top with red indicators
4. **Click any layer** to navigate directly to it in your design
5. **Use filters** to focus on specific issue types
6. **Re-scan** after making changes to refresh the analysis

## 📊 WCAG Compliance Levels

| Level | Normal Text | Large Text* |
|-------|-------------|-------------|
| **AAA** | ≥ 7.0:1 | ≥ 4.5:1 |
| **AA** | ≥ 4.5:1 | ≥ 3.0:1 |
| **FAIL** | < 4.5:1 | < 3.0:1 |

*Large text is defined as 18pt (24px) or larger, or 14pt (18.67px) bold or larger.

## 🏗️ Project Structure

```
figma-accessibility-auditor/
├── src/
│   ├── main.ts          # Plugin logic (Figma main thread)
│   ├── ui.tsx           # React/Preact UI component
│   ├── scanner.ts       # Scanning engine
│   ├── contrast.ts      # WCAG contrast calculations
│   ├── components.tsx   # Reusable UI components
│   ├── icons.tsx        # SVG icon components
│   ├── types.ts         # TypeScript type definitions
│   └── styles.css       # Tailwind CSS + custom styles
├── package.json         # Dependencies & plugin config
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── README.md            # This file
```

## 🔧 Configuration

The plugin is configured in `package.json` under the `figma-plugin` key:

```json
{
  "figma-plugin": {
    "editorType": ["figma"],
    "name": "Accessibility Auditor",
    "main": "src/main.ts",
    "ui": "src/ui.tsx"
  }
}
```

## 🧪 How Contrast is Calculated

The plugin implements the official [WCAG 2.1 contrast ratio formula](https://www.w3.org/WAI/GL/wiki/Contrast_ratio):

1. **Normalize RGB values** (0-255 → 0-1)
2. **Linearize using sRGB gamma correction**:
   ```
   v ≤ 0.04045 → v / 12.92
   v > 0.04045 → ((v + 0.055) / 1.055)^2.4
   ```
3. **Calculate relative luminance**:
   ```
   L = 0.2126 × R + 0.7152 × G + 0.0722 × B
   ```
4. **Compute contrast ratio**:
   ```
   CR = (L_lighter + 0.05) / (L_darker + 0.05)
   ```

## 📦 Dependencies

### Runtime
- `@create-figma-plugin/ui` – Preact component library matching Figma's design
- `@create-figma-plugin/utilities` – Messaging utilities for main/UI communication
- `preact` – Lightweight React alternative

### Development
- `@create-figma-plugin/build` – esbuild-powered fast bundler
- `tailwindcss` – Utility-first CSS framework
- `typescript` – Type safety

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License – feel free to use this in your projects.

## 🔗 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Create Figma Plugin Docs](https://yuanqing.github.io/create-figma-plugin/)
- [Figma Plugin API](https://figma.com/plugin-docs/)
- [Understanding Contrast Ratio](https://www.w3.org/WAI/GL/wiki/Contrast_ratio)

---
