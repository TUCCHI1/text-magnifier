# Reading Spotlight

[日本語](README_ja.md)

A Chrome extension that helps you focus on text by creating a customizable spotlight overlay that follows your mouse cursor.

Based on academic research:

- [Visual Crowding](https://link.springer.com/article/10.3758/s13414-023-02787-1) - Attention, Perception & Psychophysics (2023)
- [Visual Stress / Irlen Syndrome](https://irlen.com/colored-overlays/) - Colored overlay research

## Features

### Core Features

- Spotlight overlay that follows mouse movement
- Cursor hidden while spotlight is active (spotlight center = mouse position)
- Customizable spotlight size (width and height)
- Multiple color options (yellow, blue, green, peach, gray, aqua, rainbow)
- Adjustable dim opacity for surrounding areas
- Soft edge option to reduce visual stress (research-based)
- Enable/disable toggle
- Keyboard shortcut for quick toggle (customizable)

### Reading Mode

- Fixed Y position for focused line reading
- Only X position follows the mouse
- Reduces eye strain from return sweeps (based on eye-tracking research)

### Rainbow Mode

- Dynamic color that changes based on mouse X position
- Adds visual engagement while reading

### Pro Features

- Custom color picker for personalized overlay colors

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

| Command               | Description                           |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start development mode with watch     |
| `npm run build`       | Build for production                  |
| `npm run check`       | Run typecheck, lint, and format check |
| `npm run test`        | Run E2E tests                         |
| `npm run format`      | Format code with Prettier             |
| `npm run screenshots` | Generate Chrome Web Store screenshots |

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
├── scripts/
│   └── screenshots.ts
├── store/
│   ├── demo.html
│   ├── description_en.txt
│   ├── description_ja.txt
│   └── screenshots/
├── tests/
│   └── spotlight.spec.ts
└── dist/
```

## License

MIT License - see [LICENSE](LICENSE) for details.
