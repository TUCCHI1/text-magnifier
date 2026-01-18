# Reading Spotlight

[日本語](README_ja.md)

A Chrome extension that helps you focus on text by creating a customizable spotlight overlay that follows your mouse cursor.

Based on research from CHI 2023 on reading aids and focus enhancement.

## Features

- Spotlight overlay that follows mouse movement
- Customizable spotlight size (width and height)
- Multiple color options (yellow, blue, green, peach, gray, aqua)
- Adjustable dim opacity for surrounding areas
- Smooth cursor tracking with optimized performance
- Enable/disable toggle
- Keyboard shortcut for quick toggle (customizable)

## Installation

### From Chrome Web Store

Coming soon.

### Manual Installation (Developer Mode)

1. Clone this repository:

   ```bash
   git clone https://github.com/TUCCHI1/text-magnifier.git
   cd text-magnifier
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Usage

1. Click the extension icon in the toolbar to open settings
2. Toggle the extension on/off
3. Adjust the spotlight width and height
4. Choose your preferred highlight color
5. Set the dim opacity for the surrounding area

The spotlight will automatically follow your mouse cursor on any webpage.

### Keyboard Shortcut

- **Windows/Linux**: `Ctrl+Shift+S`
- **Mac**: `Cmd+Shift+S`

To customize the shortcut, go to `chrome://extensions/shortcuts`.

## Development

### Prerequisites

- Node.js >= 24.0.0
- npm >= 11.0.0

### Scripts

| Command          | Description                           |
| ---------------- | ------------------------------------- |
| `npm run dev`    | Start development mode with watch     |
| `npm run build`  | Build for production                  |
| `npm run check`  | Run typecheck, lint, and format check |
| `npm run test`   | Run E2E tests                         |
| `npm run format` | Format code with Prettier             |

### Project Structure

```
├── src/
│   ├── entrypoints/
│   │   ├── background.ts
│   │   ├── content.ts
│   │   └── popup/
│   │       ├── main.ts
│   │       └── index.html
│   ├── lib/
│   │   └── spotlight.ts
│   └── public/
│       ├── manifest.json
│       └── icons/
├── tests/
│   ├── fixtures/
│   └── spotlight.spec.ts
└── dist/
```

## License

MIT License - see [LICENSE](LICENSE) for details.
