# Penguin Vibe 🐧

Customize your penguin and explore an open world! Pick from **Default** mode on an iceberg or **Holiday** mode with evergreen trees! Express yourself with emojis and generate a mood summary at the end.

All art was either generated with a game engine, AI (Pixellab) or custom made (Pixelart).

Lofi beats created by @2kaimusic :) All other sounds curated from royalty free libraries.


## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mokai-xu/penguin-vibe.git
cd penguin-vibe
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

### Running the Game

1. Open your browser and navigate to `http://localhost:3000`
2. Customize your penguin by choosing a color and hat
3. Click "Join the Iceberg!" to start playing
4. Use arrow keys to move around
5. Click emoji buttons or press keys 1-5 to express yourself

## Project Structure

```
penguin-vibe/
├── client/              # Client-side code
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   ├── game.js         # Main game logic
│   ├── spriteSheet.js  # Sprite sheet loader
│   ├── penguin.js      # Penguin class
│   ├── iceberg.js      # Iceberg class
│   ├── network.js      # WebSocket client
│   ├── customization.js # Customization UI
│   └── emoji.js        # Emoji system
├── server/              # Server-side code
│   ├── server.js       # Express + Socket.io server
│   ├── gameState.js    # Game state management
│   └── package.json    # Server dependencies
├── assets/              # Game assets
│   ├── penguin-sprites.png # Penguin sprite sheet (required)
│   └── hats/           # Hat sprite assets (optional)
└── README.md           # This file
```

## Sprite Sheet Format

The penguin sprite sheet (`assets/penguin-sprites.png`) should be organized as follows:

- **Dimensions**: Each sprite frame should be 64x64 pixels
- **Layout**: 4 rows × 3 columns grid
  - **Row 0**: Down/Front view (3 waddling frames)
  - **Row 1**: Up/Back view (3 waddling frames)
  - **Row 2**: Left side view (3 waddling frames)
  - **Row 3**: Right side view (3 waddling frames)
- **Animation**: Each direction has 3 frames for waddling animation
  - Frame 0: Idle/center position
  - Frame 1: Waddle left/forward
  - Frame 2: Waddle right/backward
- **Colors**: 
  - Body color should be light pastel blue/gray (customizable)
  - White belly (preserved during color customization)
  - Dark gray/black outline and features
  - Orange beak
  - Dark gray hood/back

If you need to use different sprite dimensions, update the `Penguin.loadSpriteSheet()` call in `game.js` with the correct width, height, and frames per row.

## Controls

- **Arrow Keys** or **WASD**: Move your penguin
- **1-5 Keys**: Quick emoji shortcuts
- **Emoji Buttons**: Click to show emojis

## Future Enhancements

- Multiplayer support
- More emoji options
- Penguin names/usernames
- Multiple icebergs/rooms
- Collectible items
- Sound effects
- Particle effects

## License

MIT License

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
