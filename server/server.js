const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameState = require('./gameState');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const gameState = new GameState();

// Serve static files from client directory
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Also serve assets directory
const assetsPath = path.join(__dirname, '../assets');
app.use('/assets', express.static(assetsPath));

// Serve index.html for all routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('joinGame', (data) => {
        const { hat } = data;
        
        // Random starting position (center of typical screen)
        const centerX = 400;
        const centerY = 300;
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        
        // Add player to game state (using default color)
        gameState.addPlayer(socket.id, {
            color: '#A8D5E2', // Default color
            hat: hat || 'none',
            x: centerX + offsetX,
            y: centerY + offsetY
        });

        // Send current game state to the new player
        socket.emit('gameState', {
            players: gameState.getAllPlayers()
        });

        // Notify other players about the new player
        socket.broadcast.emit('playerJoined', {
            id: socket.id,
            color: '#A8D5E2', // Default color
            hat: hat || 'none',
            x: gameState.getPlayer(socket.id).x,
            y: gameState.getPlayer(socket.id).y,
            direction: 'idle'
        });
    });

    socket.on('move', (data) => {
        const { x, y, direction } = data;
        
        // Update player position
        gameState.updatePlayerPosition(socket.id, x, y, direction);

        // Broadcast to other players
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            x,
            y,
            direction
        });
    });

    socket.on('emoji', (data) => {
        const { emoji } = data;
        
        // Update player emoji
        gameState.updatePlayerEmoji(socket.id, emoji);

        // Broadcast to all players including sender
        io.emit('playerEmoji', {
            id: socket.id,
            emoji
        });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Remove player from game state
        gameState.removePlayer(socket.id);

        // Notify other players
        socket.broadcast.emit('playerLeft', {
            id: socket.id
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

