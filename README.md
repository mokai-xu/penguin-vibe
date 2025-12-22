# Penguin Vibe 🐧

A multiplayer interactive web game where you can waddle around as a cute chibi penguin on a floating iceberg! Customize your penguin with colors and quirky hats, then join other players to explore together and communicate with emojis.

## Features

- 🎨 **Customization**: Choose your penguin's color and pick from 8 quirky hats (party hat, egg, fedora, magician hat, red bow, cowboy hat, watermelon hat, baseball cap)
- 🌊 **Floating Iceberg**: Beautiful animated iceberg that gently bobs in the ocean
- 👥 **Multiplayer**: See and interact with other players in real-time
- 😊 **Emoji Communication**: Express yourself with 5 emojis (happy, sad, relieved, silly, surprised)
- 🎮 **Smooth Controls**: Use arrow keys to waddle around with cute animations
- 🎨 **Pixel Art Style**: Chibi pixel art penguins with pixel-perfect rendering

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

## Deployment

### Recommended: Render (Single Platform Deployment)

This project uses Socket.io for real-time multiplayer, which requires persistent WebSocket connections. The server already serves static files, so you can deploy everything on Render in a single deployment.

#### Deploy to Render

**Option 1: Using render.yaml (Recommended)**

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository

2. **Connect to Render**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and configure the service

3. **Deploy**: Click "Apply" and Render will:
   - Build the server dependencies
   - Start the server
   - Serve both the Socket.io server and static files
   - Provide a public URL

**Option 2: Manual Configuration**

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository

2. **Create Web Service**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure**:
   - **Name**: `penguin-vibe` (or your preferred name)
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

4. **Environment Variables** (optional):
   - `NODE_ENV`: `production`
   - `PORT`: Render sets this automatically, but you can set it to `3000` if needed

5. **Deploy**: Click "Create Web Service" and Render will deploy your app

#### How It Works

- The server (`server/server.js`) serves:
  - Static files from `client/` directory
  - Assets from `assets/` directory
  - Socket.io WebSocket server for multiplayer
- The client automatically connects to the same domain (auto-detection in `network.js`)
- Everything runs on a single Render service

#### Alternative Platforms

The server can also be deployed to:
- **Railway**: Set root directory to `server`, auto-detects Node.js
- **Fly.io**: Requires Dockerfile (see Fly.io docs)
- **Heroku**: Traditional platform, requires Procfile
- **DigitalOcean App Platform**: Similar to Render
- **Self-hosted VPS**: Full control, requires server management

Make sure to:
1. Set the `PORT` environment variable (usually auto-set by the platform)
2. Ensure WebSocket support is enabled
3. The server serves static files, so no separate frontend deployment needed

## Technologies Used

- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Backend**: Node.js, Express, Socket.io
- **Real-time Communication**: WebSockets

## Future Enhancements

- Chat system
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
