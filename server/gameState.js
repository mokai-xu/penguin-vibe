class GameState {
    constructor() {
        this.players = new Map(); // playerId -> player data
    }

    addPlayer(playerId, playerData) {
        this.players.set(playerId, {
            id: playerId,
            color: playerData.color,
            hat: playerData.hat,
            x: playerData.x || 400,
            y: playerData.y || 300,
            direction: playerData.direction || 'idle',
            emoji: null,
            emojiTimestamp: null
        });
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    updatePlayerPosition(playerId, x, y, direction) {
        const player = this.players.get(playerId);
        if (player) {
            player.x = x;
            player.y = y;
            player.direction = direction;
        }
    }

    updatePlayerEmoji(playerId, emoji) {
        const player = this.players.get(playerId);
        if (player) {
            player.emoji = emoji;
            player.emojiTimestamp = Date.now();
        }
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getPlayerCount() {
        return this.players.size;
    }
}

module.exports = GameState;

