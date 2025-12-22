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
        
        // Background music
        this.backgroundMusic = null;
        this.musicEnabled = true; // Default to ON

        // UI click sound
        this.uiClickSound = null;
        
        // Camera system for open world
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            followSpeed: 0.1 // Smooth camera follow (0-1, higher = faster)
        };
        
        // World boundaries (open world size)
        this.worldBounds = {
            minX: -2000,
            minY: -2000,
            maxX: 2000,
            maxY: 2000
        };
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Mobile controller
        this.mobileControllerActive = false;
        this.controllerDirection = { x: 0, y: 0 };
        this.setupMobileController();
        
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
                
                // Penguin position is now in world space, no need to constrain to canvas
                // World boundaries handle constraints
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

    setupMobileController() {
        const controller = document.getElementById('mobile-controller');
        const stick = document.getElementById('controller-stick');
        
        if (!controller || !stick) return;
        
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
        
        if (isMobile) {
            controller.classList.add('active');
            this.mobileControllerActive = true;
        }
        
        const base = controller.querySelector('.controller-base');
        if (!base) return;
        
        const getBaseCenter = () => {
            const baseRect = base.getBoundingClientRect();
            return {
                x: baseRect.left + baseRect.width / 2,
                y: baseRect.top + baseRect.height / 2,
                maxDistance: baseRect.width / 2 - 25 // Max distance stick can move (radius - stick radius)
            };
        };
        
        let isDragging = false;
        let currentTouchId = null;
        
        const updateStickPosition = (clientX, clientY) => {
            const center = getBaseCenter();
            const dx = clientX - center.x;
            const dy = clientY - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let stickX = dx;
            let stickY = dy;
            
            // Constrain stick to base circle
            if (distance > center.maxDistance) {
                stickX = (dx / distance) * center.maxDistance;
                stickY = (dy / distance) * center.maxDistance;
            }
            
            stick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
            
            // Calculate normalized direction (-1 to 1)
            const normalizedX = distance > 0 ? stickX / center.maxDistance : 0;
            const normalizedY = distance > 0 ? stickY / center.maxDistance : 0;
            
            this.controllerDirection = { x: normalizedX, y: normalizedY };
        };
        
        const resetStick = () => {
            stick.style.transform = 'translate(-50%, -50%)';
            stick.classList.remove('dragging');
            this.controllerDirection = { x: 0, y: 0 };
            isDragging = false;
            currentTouchId = null;
        };
        
        // Touch events
        const handleTouchStart = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            currentTouchId = touch.identifier;
            isDragging = true;
            stick.classList.add('dragging');
            
            updateStickPosition(touch.clientX, touch.clientY);
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = Array.from(e.touches).find(t => t.identifier === currentTouchId);
            if (!touch) return;
            
            updateStickPosition(touch.clientX, touch.clientY);
        };
        
        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = Array.from(e.changedTouches).find(t => t.identifier === currentTouchId);
            if (touch) {
                resetStick();
            }
        };
        
        const handleTouchCancel = (e) => {
            e.preventDefault();
            resetStick();
        };
        
        // Mouse events (for testing on desktop)
        const handleMouseDown = (e) => {
            if (isMobile) return; // Only use mouse on non-mobile for testing
            e.preventDefault();
            isDragging = true;
            stick.classList.add('dragging');
            
            updateStickPosition(e.clientX, e.clientY);
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging || isMobile) return;
            e.preventDefault();
            updateStickPosition(e.clientX, e.clientY);
        };
        
        const handleMouseUp = (e) => {
            if (!isDragging || isMobile) return;
            e.preventDefault();
            resetStick();
        };
        
        // Add event listeners
        base.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchcancel', handleTouchCancel, { passive: false });
        
        // Mouse events for desktop testing
        if (!isMobile) {
            base.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
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
        // Initialize iceberg in world space (centered at world origin)
        this.iceberg = new Iceberg(this.canvas, 0, 0);
        
        // Create local penguin at world origin (will be centered on screen via camera)
        this.localPenguin = new Penguin(
            0, // World X (camera will center on this)
            0, // World Y (camera will center on this)
            Penguin.defaultColor,
            customization.hat,
            'local',
            true
        );
        
        // Initialize camera to center on penguin
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        
        // Initialize emoji system
        this.emojiSystem = new EmojiSystem();

        // Initialize movement sound (uses Sound FX toggle)
        this.initMoveSound();
        
        // Setup background music
        this.setupBackgroundMusic();
        
        // Setup end session button
        this.setupEndSessionButton();
        
        // Setup instructions close button
        this.setupInstructionsClose();
        
        // Setup instructions modal
        this.setupInstructionsModal();
        
        // Start game loop
        this.running = true;
        this.gameLoop(0);
    }

    initUiClickSound() {
        if (this.uiClickSound) return;
        try {
            this.uiClickSound = new Audio('/assets/computer_click.mp3');
            this.uiClickSound.volume = 0.4;
        } catch (e) {
            console.warn('Failed to initialize UI click sound:', e);
        }
    }

    playUiClickSound() {
        if (!this.uiClickSound) {
            this.initUiClickSound();
        }
        if (!this.uiClickSound) return;

        try {
            this.uiClickSound.currentTime = 0;
            this.uiClickSound.play().catch(() => {
                // Ignore play errors (e.g., autoplay policies)
            });
        } catch (e) {
            // Fail silently
        }
    }

    initMoveSound() {
        if (this.movementSound) return;
        try {
            this.movementSound = new Audio('/assets/ssd.mp3');
            this.movementSound.loop = true; // ensure loop
            this.movementSound.volume = 0.9; // louder so it’s audible
            this.isMovementSoundPlaying = false;
        } catch (e) {
            console.warn('Failed to initialize movement sound:', e);
        }
    }

    playMovementSound() {
        if (!this.movementSound) {
            this.initMoveSound();
        }
        if (!this.movementSound) return;

        // Respect Sound FX toggle (emoji system controls soundEnabled)
        if (this.emojiSystem && this.emojiSystem.soundEnabled === false) {
            this.stopMovementSound();
            return;
        }

        if (this.isMovementSoundPlaying) return;

        try {
            // Do not reset currentTime when looping; just start if not playing
            this.movementSound.play().then(() => {
                this.isMovementSoundPlaying = true;
            }).catch(() => {
                // Ignore play errors (e.g., autoplay policies)
            });
        } catch (e) {
            // Fail silently
        }
    }

    stopMovementSound() {
        if (!this.movementSound) return;
        try {
            this.movementSound.pause();
            this.isMovementSoundPlaying = false;
        } catch (e) {
            // Fail silently
        }
    }

    setupBackgroundMusic() {
        // Create audio element for background music
        this.backgroundMusic = new Audio('/assets/lofi v4 sadder.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.4; // Set volume to 50%
        
        // Handle audio loading errors
        this.backgroundMusic.addEventListener('error', (e) => {
            console.warn('Failed to load background music:', e);
        });
        
        // Setup music toggle button
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                this.toggleMusic();
            });
        }
        
        // If music is enabled by default, try to start playing now
        if (this.musicEnabled) {
            this.backgroundMusic.play().catch(error => {
                console.warn('Could not auto-play background music:', error);
            });
        }
        
        // Update button appearance (reflect current state)
        this.updateMusicToggleAppearance();
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
            // Play music
            this.backgroundMusic.play().catch(error => {
                console.warn('Could not play background music:', error);
                // If autoplay is blocked, user will need to interact first
            });
        } else {
            // Pause music
            this.backgroundMusic.pause();
        }
        
        this.updateMusicToggleAppearance();
    }

    updateMusicToggleAppearance() {
        const musicToggle = document.getElementById('music-toggle');
        if (!musicToggle) return;
        
        if (this.musicEnabled) {
            musicToggle.textContent = '🎵';
            musicToggle.title = 'BGM';
            musicToggle.classList.remove('music-off');
            musicToggle.classList.add('music-on');
        } else {
            musicToggle.textContent = '🎵';
            musicToggle.title = 'BGM';
            musicToggle.classList.remove('music-on');
            musicToggle.classList.add('music-off');
        }
    }

    setupEndSessionButton() {
        const endSessionButton = document.getElementById('end-session-button');
        if (endSessionButton) {
            endSessionButton.addEventListener('click', () => {
                // UI click sound
                this.playUiClickSound();
                // Pause background music when ending session
                if (this.backgroundMusic) {
                    this.backgroundMusic.pause();
                }
                this.endSession();
            });
        }
    }

    setupInstructionsClose() {
        const instructionsClose = document.getElementById('instructions-close');
        const instructions = document.getElementById('instructions');
        if (instructionsClose && instructions) {
            instructionsClose.addEventListener('click', () => {
                // UI click sound
                this.playUiClickSound();
                // Hide instructions
                instructions.classList.add('hidden');
            });
        }
    }

    setupInstructionsModal() {
        const instructionsButton = document.getElementById('instructions-button');
        const instructionsModal = document.getElementById('instructions-modal');
        const modalClose = document.getElementById('instructions-modal-close');
        const modalCloseButton = document.getElementById('close-instructions-modal-button');
        
        if (instructionsButton && instructionsModal) {
            // Open modal
            instructionsButton.addEventListener('click', () => {
                // UI click sound
                this.playUiClickSound();
                // Show modal
                instructionsModal.style.display = 'flex';
            });
            
            // Close modal handlers
            const closeModal = () => {
                // UI click sound
                this.playUiClickSound();
                // Hide modal
                instructionsModal.style.display = 'none';
            };
            
            if (modalClose) {
                modalClose.addEventListener('click', closeModal);
            }
            
            if (modalCloseButton) {
                modalCloseButton.addEventListener('click', closeModal);
            }
            
            // Close modal when clicking outside
            instructionsModal.addEventListener('click', (e) => {
                if (e.target === instructionsModal) {
                    closeModal();
                }
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
            // UI click sound
            this.playUiClickSound();
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
            
            // Check for mobile controller input
            const controllerThreshold = 0.1; // Minimum input to register movement
            const hasControllerInput = this.mobileControllerActive && 
                (Math.abs(this.controllerDirection.x) > controllerThreshold || 
                 Math.abs(this.controllerDirection.y) > controllerThreshold);
            
            if (hasControllerInput) {
                // Use controller input
                dx = this.controllerDirection.x * speed * deltaTime;
                dy = this.controllerDirection.y * speed * deltaTime;
                
                // Determine direction based on controller input
                if (Math.abs(this.controllerDirection.x) > Math.abs(this.controllerDirection.y)) {
                    direction = this.controllerDirection.x > 0 ? 'right' : 'left';
                } else if (Math.abs(this.controllerDirection.y) > controllerThreshold) {
                    direction = this.controllerDirection.y > 0 ? 'down' : 'up';
                }
            } else {
                // Use keyboard input
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
            }
            
            // Calculate new position in world space
            let newX = this.localPenguin.x + dx;
            let newY = this.localPenguin.y + dy;
            
            // Constrain to world boundaries (walls)
            const penguinRadius = this.localPenguin.width / 2;
            newX = Math.max(this.worldBounds.minX + penguinRadius, 
                          Math.min(this.worldBounds.maxX - penguinRadius, newX));
            newY = Math.max(this.worldBounds.minY + penguinRadius, 
                          Math.min(this.worldBounds.maxY - penguinRadius, newY));
            
            // Update position
            this.localPenguin.x = newX;
            this.localPenguin.y = newY;
            this.localPenguin.direction = direction;
            
            // Update camera to follow penguin (smoothly)
            this.camera.targetX = this.localPenguin.x;
            this.camera.targetY = this.localPenguin.y;
            
            // Smooth camera interpolation
            const cameraLerp = this.camera.followSpeed;
            this.camera.x += (this.camera.targetX - this.camera.x) * cameraLerp;
            this.camera.y += (this.camera.targetY - this.camera.y) * cameraLerp;

            // Movement sound: play while moving, stop when idle
            const isMoving = direction !== 'idle';
            if (isMoving) {
                this.playMovementSound();
            } else {
                this.stopMovementSound();
            }
            
            // Update penguin
            this.localPenguin.update(deltaTime, this.iceberg);
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB'; // Sky blue (ocean)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform (translate to center penguin on screen)
        this.ctx.save();
        const cameraOffsetX = this.canvas.width / 2 - this.camera.x;
        const cameraOffsetY = this.canvas.height / 2 - this.camera.y;
        this.ctx.translate(cameraOffsetX, cameraOffsetY);
        
        // Draw ocean pattern (in world space)
        this.drawOcean();
        
        // Draw iceberg (in world space)
        if (this.iceberg) {
            this.iceberg.render(this.ctx);
        }
        
        // Draw local penguin (in world space)
        if (this.localPenguin) {
            this.localPenguin.render(this.ctx);
        }
        
        // Restore transform
        this.ctx.restore();
    }

    drawOcean() {
        // Draw ocean pattern across the visible world area
        // Calculate visible area based on camera (in world coordinates)
        const visibleLeft = this.camera.x - this.canvas.width / 2 - 100; // Add padding
        const visibleRight = this.camera.x + this.canvas.width / 2 + 100;
        const visibleTop = this.camera.y - this.canvas.height / 2 - 100;
        const visibleBottom = this.camera.y + this.canvas.height / 2 + 100;
        
        // Draw waves across visible area
        this.ctx.fillStyle = '#4682B4';
        const waveStart = Math.floor(visibleLeft / 20) * 20;
        const waveEnd = Math.ceil(visibleRight / 20) * 20;
        
        // Ocean level - draw at bottom of visible area or world bounds
        const oceanLevel = Math.min(visibleBottom - 50, this.worldBounds.maxY - 50);
        const oceanHeight = 100; // Height of ocean waves
        
        for (let i = waveStart; i <= waveEnd; i += 20) {
            const wave = Math.sin(Date.now() * 0.001 + i * 0.01) * 5;
            this.ctx.fillRect(i, oceanLevel + wave, 20, oceanHeight);
        }
        
        // Also draw ocean at top if visible
        const topOceanLevel = Math.max(visibleTop + 50, this.worldBounds.minY + 50);
        if (visibleTop < topOceanLevel) {
            for (let i = waveStart; i <= waveEnd; i += 20) {
                const wave = Math.sin(Date.now() * 0.001 + i * 0.01) * 5;
                this.ctx.fillRect(i, topOceanLevel + wave, 20, oceanHeight);
            }
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

