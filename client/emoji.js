class EmojiSystem {
    constructor() {
        this.emojiButtons = document.querySelectorAll('.emoji-button');
        this.emojiCounts = {}; // Track emoji usage: { emojiType: count }
        this.audioContext = null;
        this.soundEnabled = true; // Sound FX toggle state
        this.initAudio();
        this.setupEventListeners();
        this.setupSoundToggle();
    }

    initAudio() {
        // Initialize Web Audio API context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    async playClickSound() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        try {
            // Resume audio context if suspended (required for autoplay policies)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create a short "pop" sound effect
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // High frequency for a click/pop sound
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            // Quick attack and decay for a click sound (30% of original volume: 0.3 * 0.3 = 0.09)
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.09, now + 0.001); // Quick attack (30% of 0.3)
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05); // Quick decay
            
            oscillator.start(now);
            oscillator.stop(now + 0.05);
        } catch (e) {
            // Silently fail if audio context is not available
        }
    }

    setupSoundToggle() {
        const soundToggle = document.getElementById('sound-toggle');
        if (!soundToggle) return;
        
        // Update button appearance based on state
        this.updateSoundToggleAppearance();
        
        soundToggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            this.updateSoundToggleAppearance();
        });
    }

    updateSoundToggleAppearance() {
        const soundToggle = document.getElementById('sound-toggle');
        if (!soundToggle) return;
        
        if (this.soundEnabled) {
            soundToggle.textContent = '🔊';
            soundToggle.title = 'Sound FX';
            soundToggle.classList.remove('sound-off');
            soundToggle.classList.add('sound-on');
        } else {
            soundToggle.textContent = '🔇';
            soundToggle.title = 'Sound FX';
            soundToggle.classList.remove('sound-on');
            soundToggle.classList.add('sound-off');
        }
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
        // Play click sound effect
        this.playClickSound();
        
        // Track emoji usage
        if (!this.emojiCounts[emoji]) {
            this.emojiCounts[emoji] = 0;
        }
        this.emojiCounts[emoji]++;
        
        // Set emoji on local penguin
        if (window.game && window.game.localPenguin) {
            window.game.localPenguin.setEmoji(emoji);
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

