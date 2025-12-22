class Network {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onPlayerMoved = null;
        this.onPlayerEmoji = null;
        this.onGameState = null;
    }

    connect(serverUrl = null) {
        // Auto-detect server URL if not provided
        if (!serverUrl) {
            // Check for config (set via Vercel environment variable)
            serverUrl = window.CONFIG?.SERVER_URL || null;
            
            if (!serverUrl) {
                // Auto-detect for local development
                const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
                const hostname = window.location.hostname;
                const port = window.location.port || (protocol === 'https:' ? '443' : '80');
                serverUrl = `${protocol}//${hostname}${port !== '80' && port !== '443' ? ':' + port : ''}`;
            }
        }
        this.socket = io(serverUrl);
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });

        this.socket.on('gameState', (data) => {
            if (this.onGameState) {
                this.onGameState(data);
            }
        });

        this.socket.on('playerJoined', (data) => {
            if (this.onPlayerJoined) {
                this.onPlayerJoined(data);
            }
        });

        this.socket.on('playerLeft', (data) => {
            if (this.onPlayerLeft) {
                this.onPlayerLeft(data);
            }
        });

        this.socket.on('playerMoved', (data) => {
            if (this.onPlayerMoved) {
                this.onPlayerMoved(data);
            }
        });

        this.socket.on('playerEmoji', (data) => {
            if (this.onPlayerEmoji) {
                this.onPlayerEmoji(data);
            }
        });
    }

    joinGame(color, hat) {
        if (this.socket && this.connected) {
            this.socket.emit('joinGame', { hat }); // Color removed, using default
        }
    }

    sendMove(x, y, direction) {
        if (this.socket && this.connected) {
            this.socket.emit('move', { x, y, direction });
        }
    }

    sendEmoji(emoji) {
        if (this.socket && this.connected) {
            this.socket.emit('emoji', { emoji });
        }
    }

    isConnected() {
        return this.connected;
    }

    getSocketId() {
        return this.socket ? this.socket.id : null;
    }
}

