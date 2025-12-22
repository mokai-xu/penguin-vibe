class EmojiSystem {
    constructor(network) {
        this.network = network;
        this.emojiButtons = document.querySelectorAll('.emoji-button');
        this.emojiCounts = {}; // Track emoji usage: { emojiType: count }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Button clicks
        this.emojiButtons.forEach(button => {
            button.addEventListener('click', () => {
                const emoji = button.getAttribute('data-emoji');
                this.sendEmoji(emoji);
            });
        });

        // Keyboard shortcuts (1-9, 0)
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                let index;
                if (e.key === '0') {
                    index = 9; // 0 maps to 10th button (index 9)
                } else {
                    index = parseInt(e.key) - 1; // 1-9 map to indices 0-8
                }
                if (this.emojiButtons[index]) {
                    const emoji = this.emojiButtons[index].getAttribute('data-emoji');
                    this.sendEmoji(emoji);
                }
            }
        });
    }

    sendEmoji(emoji) {
        // Track emoji usage
        if (!this.emojiCounts[emoji]) {
            this.emojiCounts[emoji] = 0;
        }
        this.emojiCounts[emoji]++;
        
        if (this.network && this.network.isConnected()) {
            this.network.sendEmoji(emoji);
        }
    }

    getEmojiStats() {
        return {
            counts: { ...this.emojiCounts },
            total: Object.values(this.emojiCounts).reduce((sum, count) => sum + count, 0),
            unique: Object.keys(this.emojiCounts).length
        };
    }
}

