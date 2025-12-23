class Customization {
    constructor() {
        this.modeGrid = document.getElementById('mode-grid');
        this.hatGrid = document.getElementById('hat-grid');
        this.hatSection = document.getElementById('hat-section');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.joinButton = document.getElementById('join-button');
        
        this.selectedMode = 'default';
        this.selectedHat = 'none';
        
        // Define hats for each mode
        this.defaultHats = [
            { hat: 'none', emoji: 'None', name: 'None' },
            { hat: 'party', emoji: '🎉', name: 'Party Hat' },
            { hat: 'egg', emoji: '🥚', name: 'Egg' },
            { hat: 'magician', emoji: '🎩', name: 'Magician' },
            { hat: 'bow', emoji: '🎀', name: 'Red Bow' },
            { hat: 'cowboy', emoji: '🤠', name: 'Cowboy' },
            { hat: 'watermelon', emoji: '🍉', name: 'Watermelon' },
            { hat: 'baseball', emoji: '⚾', name: 'Cap' },
            { hat: 'pokemon', emoji: '⚡️', name: 'Pokemon Hat' }
        ];
        
        this.holidayHats = [
            { hat: 'none', emoji: 'None', name: 'None' },
            { hat: 'santa', emoji: '🎅', name: 'Santa Hat' },
            { hat: 'blue_party', emoji: '🎉', name: 'Blue Party Hat' },
            { hat: 'yellow_party', emoji: '🎉', name: 'Yellow Party Hat' },
            { hat: 'reindeer', emoji: '🦌', name: 'Reindeer Ears' },
            { hat: 'beanie', emoji: '🧶', name: 'Winter Beanie' }
        ];
        
        this.clickSound = null;
        this.initClickSound();
        
        this.setupEventListeners();
        this.setupClickSounds();
        this.renderHats();
        this.renderPreview();
        // Set initial background color
        this.updateBackgroundColor();
    }
    
    initClickSound() {
        try {
            this.clickSound = new Audio('/assets/computer_click.mp3');
            this.clickSound.volume = 0.5;
        } catch (e) {
            console.warn('Failed to initialize click sound:', e);
        }
    }
    
    playClickSound() {
        if (this.clickSound) {
            try {
                this.clickSound.currentTime = 0; // Reset to start
                this.clickSound.play().catch(e => {
                    // Ignore play errors (e.g., user hasn't interacted yet)
                });
            } catch (e) {
                // Fail silently
            }
        }
    }

    setupEventListeners() {
        // Mode selection
        this.modeGrid.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                this.playClickSound();
                
                // Remove previous selection
                this.modeGrid.querySelectorAll('.mode-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selection to clicked option
                option.classList.add('selected');
                this.selectedMode = option.getAttribute('data-mode');
                this.selectedHat = 'none'; // Reset hat selection
                
                // Update background color based on mode
                this.updateBackgroundColor();
                
                this.renderHats();
                this.renderPreview();
            });
        });
        
        // Set default mode as selected
        const defaultMode = this.modeGrid.querySelector('[data-mode="default"]');
        if (defaultMode) {
            defaultMode.classList.add('selected');
        }

        // Hat selection
        this.hatGrid.addEventListener('click', (e) => {
            const option = e.target.closest('.hat-option');
            if (option) {
                this.playClickSound();
                
                // Remove previous selection
                this.hatGrid.querySelectorAll('.hat-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selection to clicked option
                option.classList.add('selected');
                this.selectedHat = option.getAttribute('data-hat');
                this.renderPreview();
            }
        });

        // Join button
        this.joinButton.addEventListener('click', () => {
            this.playClickSound();
            this.onJoin();
        });
    }
    
    renderHats() {
        // Clear existing hats
        this.hatGrid.innerHTML = '';
        
        // Get hats for current mode
        const hats = this.selectedMode === 'holiday' ? this.holidayHats : this.defaultHats;
        
        // Render hats
        hats.forEach(hatData => {
            const hatOption = document.createElement('div');
            hatOption.className = 'hat-option';
            hatOption.setAttribute('data-hat', hatData.hat);
            if (hatData.hat === this.selectedHat) {
                hatOption.classList.add('selected');
            }
            
            const preview = document.createElement('div');
            preview.className = 'hat-preview';
            preview.textContent = hatData.emoji;
            hatOption.appendChild(preview);
            
            if (hatData.name !== 'None') {
                const span = document.createElement('span');
                span.textContent = hatData.name;
                hatOption.appendChild(span);
            }
            
            this.hatGrid.appendChild(hatOption);
        });
    }

    setupClickSounds() {
        // Click sounds are now handled directly in setupEventListeners()
        // where we call this.playClickSound() for each button click
        // This method is kept for backward compatibility but no longer needed
    }

    renderPreview() {
        const ctx = this.previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        // Wait for sprite sheet to load if not already loaded
        if (!Penguin.spriteSheet || !Penguin.spriteSheet.isLoaded()) {
            // Retry after a short delay
            setTimeout(() => this.renderPreview(), 100);
            return;
        }
        
        // Pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        
        ctx.save();
        ctx.translate(this.previewCanvas.width / 2, this.previewCanvas.height / 2);
        ctx.scale(1.2, 1.2); // Reduced scale so penguin and hat fit in preview
        
        // Draw preview penguin - set to front view, frame 0 (using default color)
        const previewPenguin = new Penguin(0, 0, Penguin.defaultColor, this.selectedHat, 'preview');
        previewPenguin.direction = 'down'; // Front view (row 0)
        previewPenguin.animationFrame = 0; // Frame 0 (idle/center)
        previewPenguin.render(ctx);
        
        ctx.restore();
    }

    onJoin() {
        const customizationData = {
            mode: this.selectedMode,
            hat: this.selectedHat
        };
        
        // Hide customization screen
        document.getElementById('customization-screen').style.display = 'none';
        
        // Show game container
        document.getElementById('game-container').style.display = 'block';
        
        // Trigger join event (will be handled by game.js)
        window.dispatchEvent(new CustomEvent('customizationComplete', {
            detail: customizationData
        }));
    }

    updateBackgroundColor() {
        const customizationScreen = document.getElementById('customization-screen');
        if (customizationScreen) {
            if (this.selectedMode === 'holiday') {
                customizationScreen.style.background = 'rgba(45, 80, 22, 0.95)'; // Pine green
            } else {
                customizationScreen.style.background = '#FFB6C1'; // Pink
            }
        }
    }

    getCustomization() {
        return {
            mode: this.selectedMode,
            hat: this.selectedHat
        };
    }
}

