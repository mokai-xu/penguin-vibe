class EmojiSystem {
    constructor(mode = 'default') {
        this.mode = mode;
        this.emojiButtons = [];
        this.emojiCounts = {}; // Track emoji usage: { emojiType: count }
        this.audioContext = null;
        this.soundEnabled = true; // Sound FX toggle state
        this.initAudio();
        // Setup emojis first, then event listeners
        this.setupEmojis();
        this.setupEventListeners();
        this.setupSoundToggle();
    }
    
    setupEmojis() {
        const emojiContainer = document.querySelector('.emoji-ui');
        if (!emojiContainer) {
            // Retry if container doesn't exist yet (might be hidden)
            // But limit retries to avoid infinite loop
            if (!this._setupRetries) {
                this._setupRetries = 0;
            }
            if (this._setupRetries < 10) {
                this._setupRetries++;
                setTimeout(() => this.setupEmojis(), 100);
            } else {
                console.warn('Emoji container not found after retries');
            }
            return;
        }
        this._setupRetries = 0; // Reset on success
        
        // Clear existing buttons
        emojiContainer.innerHTML = '';
        
        // Define emojis for each mode
        const defaultEmojis = [
            { emoji: 'happy', icon: '😊', title: 'Happy (1)' },
            { emoji: 'sad', icon: '😢', title: 'Sad (2)' },
            { emoji: 'relieved', icon: '😌', title: 'Relieved (3)' },
            { emoji: 'silly', icon: '😜', title: 'Silly (4)' },
            { emoji: 'surprised', icon: '😲', title: 'Surprised (5)' },
            { emoji: 'laughing', icon: '😂', title: 'Laughing (6)' },
            { emoji: 'cool', icon: '😎', title: 'Cool (7)' },
            { emoji: 'cowboy_face', icon: '🤠', title: 'Cowboy (8)' },
            { emoji: 'angry', icon: '😠', title: 'Angry (9)' },
            { emoji: 'clown', icon: '🤡', title: 'Clown (0)' },
            { emoji: 'tired', icon: '😩', title: 'Tired' },
            { emoji: 'dizzy', icon: '😵‍💫', title: 'Dizzy' },
            { emoji: 'thinking', icon: '🤔', title: 'Thinking' },
            { emoji: 'hot', icon: '🥵', title: 'Hot' },
            { emoji: 'smirk', icon: '😏', title: 'Smirk' }
        ];
        
        const holidayEmojis = [
            { emoji: 'party_popper', icon: '🎉', title: 'Party Popper (1)' },
            { emoji: 'gift', icon: '🎁', title: 'Gift (2)' },
            { emoji: 'confetti', icon: '🎊', title: 'Confetti (3)' },
            { emoji: 'christmas_tree', icon: '🎄', title: 'Christmas Tree (4)' },
            { emoji: 'partying', icon: '🥳', title: 'Partying (5)' },
            { emoji: 'balloon', icon: '🎈', title: 'Balloon (6)' },
            { emoji: 'sparkles', icon: '✨', title: 'Sparkles (7)' },
            { emoji: 'birthday_cake', icon: '🎂', title: 'Birthday Cake (8)' },
            { emoji: 'dancing_woman', icon: '💃', title: 'Dancing (9)' },
            { emoji: 'dancing_man', icon: '🕺', title: 'Dancing (0)' }
        ];
        
        const emojis = this.mode === 'holiday' ? holidayEmojis : defaultEmojis;
        
        // Create emoji buttons
        emojis.forEach((emojiData, index) => {
            const button = document.createElement('button');
            button.className = 'emoji-button';
            button.setAttribute('data-emoji', emojiData.emoji);
            button.setAttribute('title', emojiData.title);
            button.textContent = emojiData.icon;
            emojiContainer.appendChild(button);
        });
        
        // Update emojiButtons reference
        this.emojiButtons = Array.from(emojiContainer.querySelectorAll('.emoji-button'));
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
        // Use event delegation for button clicks (works even if buttons are recreated)
        const emojiContainer = document.querySelector('.emoji-ui');
        if (emojiContainer) {
            emojiContainer.addEventListener('click', (e) => {
                const button = e.target.closest('.emoji-button');
                if (button) {
                    const emoji = button.getAttribute('data-emoji');
                    this.sendEmoji(emoji);
                }
            });
        }

        // Keyboard shortcuts (1-9, 0)
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                let index;
                if (e.key === '0') {
                    index = 9; // 0 maps to 10th button (index 9)
                } else {
                    index = parseInt(e.key) - 1; // 1-9 map to indices 0-8
                }
                // Get fresh button list in case it changed
                const buttons = document.querySelectorAll('.emoji-button');
                if (buttons[index]) {
                    const emoji = buttons[index].getAttribute('data-emoji');
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

