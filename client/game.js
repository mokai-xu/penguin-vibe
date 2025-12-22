class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.iceberg = null;
        this.localPenguin = null;
        this.emojiSystem = null;
        this.customizationData = null; // Store customization for results screen
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Game loop
        this.lastTime = 0;
        this.running = false;
        
        // Resize debouncing
        this.resizeTimeout = null;
        
        // Encouragement messages (loaded from secrets file)
        this.encouragements = {
            all: [],
            noEmoji: [],
            negative: [],
            positive: []
        };
        this.loadEncouragements();
        
        // Wait for customization
        window.addEventListener('customizationComplete', (e) => {
            this.startGame(e.detail);
        });
    }

    async loadEncouragements() {
        try {
            const response = await fetch('/assets/secrets.txt');
            const text = await response.text();
            this.parseEncouragements(text);
        } catch (error) {
            console.error('Failed to load encouragements, using defaults:', error);
            // Fallback to default encouragements if file can't be loaded
            this.setDefaultEncouragements();
        }
    }

    parseEncouragements(text) {
        const lines = text.split('\n');
        let currentSection = null;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                const section = trimmed.slice(1, -1);
                if (section === 'ALL_ENCOURAGEMENTS') {
                    currentSection = 'all';
                } else if (section === 'NO_EMOJI_MESSAGES') {
                    currentSection = 'noEmoji';
                } else if (section === 'NEGATIVE_MESSAGES') {
                    currentSection = 'negative';
                } else if (section === 'POSITIVE_MESSAGES') {
                    currentSection = 'positive';
                } else {
                    currentSection = null;
                }
            } else if (currentSection && trimmed) {
                this.encouragements[currentSection].push(trimmed);
            }
        }
        
        // If no encouragements loaded, use defaults
        if (this.encouragements.all.length === 0) {
            this.setDefaultEncouragements();
        }
    }

    setDefaultEncouragements() {
        this.encouragements = {
            all: [
                "Remember, every emotion you feel is valid and important. You're doing great!",
                "Taking time to express yourself is a sign of strength. Keep being authentic!",
                "Your feelings matter, and expressing them is a beautiful act of self-care."
            ],
            noEmoji: [
                "Sometimes the best thing we can do is just be present. You're doing enough."
            ],
            negative: [
                "It's okay to have difficult days. Your feelings are valid, and tomorrow is a new opportunity. You're stronger than you know!"
            ],
            positive: [
                "Your positive energy is contagious! Keep spreading that joy and remember to share it with others too."
            ]
        };
    }

    resizeCanvas() {
        // Use requestAnimationFrame to debounce resize events
        if (this.resizeTimeout) {
            cancelAnimationFrame(this.resizeTimeout);
        }
        
        this.resizeTimeout = requestAnimationFrame(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Only resize if dimensions actually changed
            if (this.canvas.width !== width || this.canvas.height !== height) {
                this.canvas.width = width;
                this.canvas.height = height;
                
                // Update iceberg with new dimensions
                if (this.iceberg) {
                    this.iceberg.updateDimensions();
                }
                
                // Reposition local penguin if it's outside bounds
                if (this.localPenguin) {
                    // Keep penguin within canvas bounds
                    this.localPenguin.x = Math.max(
                        this.localPenguin.width / 2,
                        Math.min(width - this.localPenguin.width / 2, this.localPenguin.x)
                    );
                    this.localPenguin.y = Math.max(
                        this.localPenguin.height / 2,
                        Math.min(height - this.localPenguin.height / 2, this.localPenguin.y)
                    );
                }
            }
        });
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Prevent default for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }


    startGame(customization) {
        // Store customization data for results screen
        this.customizationData = customization;
        
        // Load sprite sheet if not already loaded
        // Default path: /assets/penguin-sprites.png
        // Sprite dimensions: 64x64 pixels, 3 frames per row
        if (!Penguin.isSpriteSheetLoaded()) {
            Penguin.loadSpriteSheet('/assets/penguin-sprites.png', 64, 64, 3);
            
            // Wait for sprite sheet to load before starting game
            const checkSpriteLoaded = setInterval(() => {
                if (Penguin.isSpriteSheetLoaded()) {
                    clearInterval(checkSpriteLoaded);
                    this.initializeGame(customization);
                }
            }, 50);
            return;
        }
        
        this.initializeGame(customization);
    }

    initializeGame(customization) {
        // Initialize iceberg
        this.iceberg = new Iceberg(this.canvas);
        
        // Create local penguin (using default color)
        this.localPenguin = new Penguin(
            this.canvas.width / 2,
            this.canvas.height / 2,
            Penguin.defaultColor,
            customization.hat,
            'local',
            true
        );
        
        // Initialize emoji system
        this.emojiSystem = new EmojiSystem();
        
        // Setup end session button
        this.setupEndSessionButton();
        
        // Start game loop
        this.running = true;
        this.gameLoop(0);
    }

    setupEndSessionButton() {
        const endSessionButton = document.getElementById('end-session-button');
        if (endSessionButton) {
            endSessionButton.addEventListener('click', () => {
                this.endSession();
            });
        }
    }

    endSession() {
        // Get emoji statistics
        const stats = this.emojiSystem.getEmojiStats();
        
        // Generate mood summary and encouragement
        const moodSummary = this.generateMoodSummary(stats);
        const encouragement = this.generateEncouragement(stats);
        
        // Display results
        this.showSessionResults(moodSummary, encouragement);
    }

    generateMoodSummary(stats) {
        const { counts, total, unique } = stats;
        
        if (total === 0) {
            return {
                title: "No Emojis Used",
                text: "You didn't use any emojis during this session. That's okay! Sometimes we need quiet moments to process our feelings."
            };
        }

        // Categorize emojis
        const positive = ['happy', 'laughing', 'cool', 'cowboy_face', 'silly', 'surprised', 'smirk'];
        const neutral = ['relieved', 'thinking', 'hot'];
        const negative = ['sad', 'angry', 'tired', 'dizzy', 'clown'];
        
        let positiveCount = 0;
        let neutralCount = 0;
        let negativeCount = 0;
        
        Object.keys(counts).forEach(emoji => {
            const count = counts[emoji];
            if (positive.includes(emoji)) {
                positiveCount += count;
            } else if (neutral.includes(emoji)) {
                neutralCount += count;
            } else if (negative.includes(emoji)) {
                negativeCount += count;
            }
        });

        const mostUsed = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const emojiMap = {
            happy: '😊', sad: '😢', relieved: '😌', silly: '😜', surprised: '😲',
            laughing: '😂', cool: '😎', cowboy_face: '🤠', angry: '😠', clown: '🤡',
            tired: '😩', dizzy: '😵‍💫', thinking: '🤔', hot: '🥵', smirk: '😏'
        };

        let summary = `You expressed yourself ${total} time${total !== 1 ? 's' : ''} using ${unique} different emoji${unique !== 1 ? 's' : ''}. `;
        
        if (positiveCount > negativeCount && positiveCount > neutralCount) {
            summary += `Your most used emoji was ${emojiMap[mostUsed] || mostUsed}, showing a positive and upbeat mood! `;
            summary += `You used ${positiveCount} positive expression${positiveCount !== 1 ? 's' : ''}, which suggests you're feeling good and energetic.`;
        } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
            summary += `You used ${emojiMap[mostUsed] || mostUsed} the most, indicating you might be processing some challenging feelings. `;
            summary += `That's completely valid - expressing difficult emotions is an important part of self-care.`;
        } else {
            summary += `Your emoji usage shows a balanced mix of emotions. `;
            summary += `You used ${emojiMap[mostUsed] || mostUsed} most frequently, reflecting a thoughtful and reflective state of mind.`;
        }

        return {
            title: "Your Mood Summary",
            text: summary
        };
    }

    generateEncouragement(stats) {
        const { counts, total } = stats;
        
        // Select encouragement based on mood
        const positive = ['happy', 'laughing', 'cool', 'cowboy_face', 'silly', 'surprised', 'smirk'];
        const negative = ['sad', 'angry', 'tired', 'dizzy', 'clown'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        Object.keys(counts).forEach(emoji => {
            const count = counts[emoji];
            if (positive.includes(emoji)) {
                positiveCount += count;
            } else if (negative.includes(emoji)) {
                negativeCount += count;
            }
        });

        // Create a unique seed based on timestamp, total emojis, and emoji pattern
        const timestamp = Date.now();
        const emojiPattern = Object.keys(counts).sort().join(',');
        const seed = timestamp + total + emojiPattern.length + positiveCount * 7 + negativeCount * 13;
        
        // Use seed to select encouragement from loaded messages (ensures uniqueness)
        let encouragement;
        const messages = this.encouragements;
        
        if (total === 0) {
            if (messages.noEmoji.length > 0) {
                encouragement = messages.noEmoji[seed % messages.noEmoji.length];
            } else {
                encouragement = "Sometimes the best thing we can do is just be present. You're doing enough.";
            }
        } else if (negativeCount > positiveCount) {
            if (messages.negative.length > 0) {
                encouragement = messages.negative[seed % messages.negative.length];
            } else {
                encouragement = "It's okay to have difficult days. Your feelings are valid, and tomorrow is a new opportunity. You're stronger than you know!";
            }
        } else if (positiveCount > negativeCount) {
            if (messages.positive.length > 0) {
                encouragement = messages.positive[seed % messages.positive.length];
            } else {
                encouragement = "Your positive energy is contagious! Keep spreading that joy and remember to share it with others too.";
            }
        } else {
            // Use seed to select from all encouragements for balanced mood
            if (messages.all.length > 0) {
                encouragement = messages.all[seed % messages.all.length];
            } else {
                encouragement = "Remember, every emotion you feel is valid and important. You're doing great!";
            }
        }

        return encouragement;
    }

    showSessionResults(moodSummary, encouragement) {
        const resultsScreen = document.getElementById('session-results');
        const moodSummaryDiv = document.getElementById('mood-summary');
        const encouragementDiv = document.getElementById('encouragement');
        const closeButton = document.getElementById('close-results-button');
        const penguinCanvas = document.getElementById('results-penguin-canvas');

        // Render penguin with customization
        if (penguinCanvas && this.customizationData) {
            const ctx = penguinCanvas.getContext('2d');
            ctx.clearRect(0, 0, penguinCanvas.width, penguinCanvas.height);
            
            // Wait for sprite sheet to load
            if (Penguin.isSpriteSheetLoaded()) {
                ctx.imageSmoothingEnabled = false;
                ctx.save();
                ctx.translate(penguinCanvas.width / 2, penguinCanvas.height / 2);
                ctx.scale(1.2, 1.2);
                
                const previewPenguin = new Penguin(0, 0, Penguin.defaultColor, this.customizationData.hat, 'results');
                previewPenguin.direction = 'down';
                previewPenguin.animationFrame = 0;
                previewPenguin.render(ctx);
                
                ctx.restore();
            } else {
                // Retry if sprite sheet not loaded yet
                setTimeout(() => this.showSessionResults(moodSummary, encouragement), 100);
                return;
            }
        }

        // Populate content
        moodSummaryDiv.innerHTML = `
            <h3>${moodSummary.title}</h3>
            <p>${moodSummary.text}</p>
        `;

        encouragementDiv.innerHTML = `
            <h3>💝 Your Daily Encouragement</h3>
            <p>${encouragement}</p>
        `;

        // Show results screen
        resultsScreen.style.display = 'flex';

        // Close button handler
        closeButton.onclick = () => {
            resultsScreen.style.display = 'none';
            // Optionally reset the game or redirect
            location.reload(); // Reload to start fresh
        };
    }

    update(deltaTime) {
        // Update iceberg
        if (this.iceberg) {
            this.iceberg.update(deltaTime);
        }
        
        // Handle local penguin movement
        if (this.localPenguin) {
            const speed = 100; // pixels per second
            let dx = 0;
            let dy = 0;
            let direction = 'idle';
            
            if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
                dx = -speed * deltaTime;
                direction = 'left';
            }
            if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
                dx = speed * deltaTime;
                direction = 'right';
            }
            if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
                dy = -speed * deltaTime;
                direction = direction === 'idle' ? 'up' : direction;
            }
            if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
                dy = speed * deltaTime;
                direction = direction === 'idle' ? 'down' : direction;
            }
            
            // Update position
            this.localPenguin.x += dx;
            this.localPenguin.y += dy;
            this.localPenguin.direction = direction;
            
            // Update penguin
            this.localPenguin.update(deltaTime, this.iceberg);
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB'; // Sky blue (ocean)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ocean pattern
        this.drawOcean();
        
        // Draw iceberg
        if (this.iceberg) {
            this.iceberg.render();
        }
        
        // Draw local penguin
        if (this.localPenguin) {
            this.localPenguin.render(this.ctx);
        }
    }

    drawOcean() {
        // Simple wave pattern
        this.ctx.fillStyle = '#4682B4';
        for (let i = 0; i < this.canvas.width; i += 20) {
            const wave = Math.sin(Date.now() * 0.001 + i * 0.01) * 5;
            this.ctx.fillRect(i, this.canvas.height - 50 + wave, 20, 50);
        }
    }

    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Cap deltaTime to prevent large jumps
        const cappedDelta = Math.min(deltaTime, 0.1);
        
        this.update(cappedDelta);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Pre-load sprite sheet
    // You can change the path here if your sprite sheet is in a different location
    res = Penguin.loadSpriteSheet('/assets/penguin-sprites.png', 64, 64, 3);
    console.log(res);
    
    window.game = new Game();
    new Customization();
});

