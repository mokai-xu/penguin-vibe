class Customization {
    constructor() {
        this.hatGrid = document.getElementById('hat-grid');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.joinButton = document.getElementById('join-button');
        
        this.selectedHat = 'none';
        
        this.setupEventListeners();
        this.renderPreview();
    }

    setupEventListeners() {
        // Hat selection
        this.hatGrid.querySelectorAll('.hat-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selection
                this.hatGrid.querySelectorAll('.hat-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selection to clicked option
                option.classList.add('selected');
                this.selectedHat = option.getAttribute('data-hat');
                this.renderPreview();
            });
        });

        // Join button
        this.joinButton.addEventListener('click', () => {
            this.onJoin();
        });
    }

    renderPreview() {
        const ctx = this.previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        // Wait for sprite sheet to load if not already loaded
        if (!Penguin.isSpriteSheetLoaded()) {
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

    getCustomization() {
        return {
            hat: this.selectedHat
        };
    }
}

