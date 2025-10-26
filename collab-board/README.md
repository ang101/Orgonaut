# Collaborative Board - AI + Human Collaboration

A modern, interactive whiteboard application similar to Miro where AI agents (powered by Claude) and humans can collaborate using moveable sticky notes that can be grouped and organized by themes.

## Features

### Core Functionality
- **Infinite Canvas**: Pan and zoom with mouse controls
  - Click and drag to pan around the canvas
  - Scroll to zoom in/out
  - Reset view button to return to origin

### Sticky Notes
- **Create Notes**: Add sticky notes in 6 different colors (yellow, pink, blue, green, orange, purple)
- **Drag and Drop**: Move notes anywhere on the canvas
- **Edit Content**: Double-click any note to edit its content
- **Themes**: Organize notes by themes (General, Ideas, Todo, Important, Questions, or create custom themes)
- **Author Tracking**: Notes show whether they were created by a human or AI

### AI Collaboration with Claude
- **AI-Generated Notes**: Ask Claude to create notes based on prompts
  - Generate single or multiple notes at once (up to 10)
  - Context-aware: Claude considers existing notes on the board
- **Auto-Organize**: Let Claude analyze all notes and automatically group them by themes
- **Smart Grouping**: AI-powered theme detection and organization

### Grouping & Organization
- **Visual Groups**: Create colored groups to organize related notes
- **Drag Groups**: Move entire groups around the canvas
- **Theme-Based Organization**: Filter and organize by themes
- **Persistent Groups**: Groups maintain their note associations

### Data Persistence
- **Local Storage**: All notes, groups, and themes are automatically saved to browser storage
- **Auto-Save**: Changes are saved immediately

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Claude API key from [Anthropic Console](https://console.anthropic.com/)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd collab-board
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to `http://localhost:5173`

### Configuring Claude API

1. Get your API key from [https://console.anthropic.com/](https://console.anthropic.com/)
2. In the application, click the "Set API Key" button in the toolbar
3. Enter your API key and click "Save"

**Security Note**: This demo uses `dangerouslyAllowBrowser: true` for simplicity. In production, implement a backend proxy to protect your API key.

## Usage Guide

### Creating Notes

**Manual Notes**:
1. Select a color from the color palette
2. Choose a theme from the dropdown
3. Click "+ New Note" button
4. Double-click the note to edit its content

**AI-Generated Notes**:
1. Set the number of notes to generate (1-10)
2. Type a prompt in the AI input field (e.g., "Generate ideas for a mobile app")
3. Click "Ask Claude" or press Enter
4. Claude will create notes based on your prompt

### Moving Notes
- Click and drag any note to move it around the canvas
- Notes can be placed anywhere on the infinite canvas

### Creating Groups
1. Click "Auto-Organize" to let Claude analyze your notes and create theme-based groups automatically
2. Groups are created with colored borders and labels

### Managing Themes
1. Select from existing themes: General, Ideas, Todo, Important, Questions
2. Click the "+" button next to the theme dropdown to create a custom theme
3. Enter a name and click "Add"

### Canvas Navigation
- **Pan**: Click and drag on empty canvas space
- **Zoom**: Use mouse scroll wheel
- **Reset**: Click "Reset View" to return to origin

## Project Structure

```
collab-board/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx          # Main canvas with pan/zoom
│   │   ├── StickyNote.tsx      # Individual note component
│   │   ├── GroupBox.tsx        # Group container component
│   │   └── Toolbar.tsx         # Top toolbar with controls
│   ├── services/
│   │   └── claude.ts           # Claude AI integration
│   ├── types.ts                # TypeScript type definitions
│   ├── store.ts                # Zustand state management
│   ├── App.tsx                 # Main app component
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Technologies Used

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Zustand**: State management
- **Anthropic Claude API**: AI collaboration
- **Local Storage API**: Data persistence

## Example Use Cases

1. **Brainstorming Session**:
   - Ask Claude: "Generate 5 creative marketing ideas for a coffee shop"
   - Manually add your own ideas
   - Use "Auto-Organize" to group related concepts

2. **Project Planning**:
   - Create notes for different project tasks
   - Assign themes: Ideas, Todo, Important, Questions
   - Group related tasks together
   - Ask Claude: "What are potential risks for this project?"

3. **Learning & Notes**:
   - Create notes as you study a topic
   - Ask Claude to clarify concepts
   - Organize by themes like Concepts, Examples, Questions

## Keyboard Shortcuts

- **Double-click note**: Edit content
- **Escape**: Exit edit mode (reverts changes)
- **Enter** in AI prompt: Generate notes

## Browser Compatibility

Works best in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

**Notes not saving?**
- Check browser console for localStorage errors
- Ensure browser allows localStorage

**Claude not responding?**
- Verify API key is correctly entered
- Check browser console for API errors
- Ensure you have credits in your Anthropic account

**Canvas not panning/zooming?**
- Try the "Reset View" button
- Refresh the page

## Future Enhancements

Potential features for future versions:
- Real-time collaboration with multiple users
- Export board as image/PDF
- Import/export board data
- Connector lines between notes
- Rich text formatting
- Image attachments
- Search functionality
- Undo/redo support
- Custom note shapes
- Board templates

## License

MIT License - Feel free to use and modify for your projects!

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## Credits

Built with Claude AI assistance using:
- React and TypeScript
- Anthropic Claude API
- Modern web technologies

---

**Enjoy collaborating with AI!** 🎨🤖
