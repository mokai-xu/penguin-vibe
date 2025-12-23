class Penguin {
    static spriteSheet = null;
    static defaultColor = '#A8D5E2';
    
    constructor(x, y, color, hat, id, isLocal = false) {
        this.x = x;
        this.y = y;
        this.color = color || Penguin.defaultColor;
        this.hat = hat;
        this.id = id;
        this.isLocal = isLocal;
        
        // Animation
        this.direction = 'idle'; // idle, left, right, up, down
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.2; // seconds per frame for waddling
        
        // Waddling animation
        this.waddleOffset = 0;
        this.waddleSpeed = 0.3;
        
        // Size (will be set from sprite sheet)
        this.width = 64; // Default, will be updated from sprite
        this.height = 64; // Default, will be updated from sprite
        
        // Emoji (array to support multiple simultaneous emojis)
        this.emojis = []; // Array of { type, timestamp, y }
        this.emojiSpeed = 200; // pixels per second upward
        this.emojiFadeDistance = 400; // pixels above penguin to start fading
        
        // Color tinting canvas for customization
        this.tintCanvas = null;
    }
    
    static loadSpriteSheet(imagePath, spriteWidth = 64, spriteHeight = 64, framesPerRow = 3) {
        Penguin.spriteSheet = new SpriteSheet(imagePath, spriteWidth, spriteHeight, framesPerRow);
    }
    
    static isSpriteSheetLoaded() {
        return Penguin.spriteSheet && Penguin.spriteSheet.isLoaded();
    }

    setEmoji(emoji) {
        // Add a new emoji to the array (don't replace existing ones)
        this.emojis.push({
            type: emoji,
            timestamp: Date.now(),
            initialOffset: -50, // Start 50 pixels higher above penguin
            y: -50 // Initial position
        });
    }

    update(deltaTime, iceberg) {
        this.animationTimer += deltaTime;
        
        // Update animation frame (3 frames for waddling, or use frame 0 for idle)
        if (this.direction !== 'idle' && this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 3;
            this.animationTimer = 0;
        } else if (this.direction === 'idle') {
            this.animationFrame = 0; // Idle always uses frame 0
        }
        
        // Penguin position is now in world space, no need to constrain to iceberg
        // World boundaries handle constraints
        
        // Update all emoji positions (move upward)
        const now = Date.now();
        for (let i = this.emojis.length - 1; i >= 0; i--) {
            const emoji = this.emojis[i];
            const age = (now - emoji.timestamp) / 1000; // seconds
            // Start from initial offset and move upward from there
            const initialOffset = emoji.initialOffset !== undefined ? emoji.initialOffset : 0;
            emoji.y = initialOffset - (age * this.emojiSpeed); // Move upward (negative Y)
            
            // Remove emoji when it's far enough above and faded out
            if (emoji.y < -this.emojiFadeDistance - 100) {
                this.emojis.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        
        // Pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        
        // Move to penguin position
        ctx.translate(this.x, this.y);
        
        // Apply waddle offset
        if (this.direction === 'left' || this.direction === 'right') {
            ctx.translate(0, this.waddleOffset);
        }
        
        // Scale for pixel art (scale up the sprite)
        const scale = 2;
        ctx.scale(scale, scale);
        
        // Draw penguin sprite
        if (Penguin.isSpriteSheetLoaded()) {
            this.drawPenguinSprite(ctx);
        } else {
            // Fallback to programmatic drawing if sprite sheet not loaded
            this.drawPenguin(ctx);
        }
        
        // Draw hat if present
        if (this.hat && this.hat !== 'none') {
            this.drawHat(ctx);
        }
        
        ctx.restore();
        
        // Draw all emojis above penguin (in world coordinates)
        this.emojis.forEach(emoji => {
            this.drawEmoji(ctx, this.x, this.y, emoji);
        });
    }
    
    drawPenguinSprite(ctx) {
        if (!Penguin.spriteSheet || !Penguin.spriteSheet.isLoaded()) {
            return;
        }
        
        // Map direction to sprite sheet row
        // 0 = down (front), 1 = up (back), 2 = left, 3 = right
        let row = 0;
        if (this.direction === 'up') {
            row = 1;
        } else if (this.direction === 'left') {
            row = 2;
        } else if (this.direction === 'right') {
            row = 3;
        } else {
            row = 0; // down or idle
        }
        
        // Get the sprite frame (0-2 for animation, 0 for idle)
        const frame = this.direction === 'idle' ? 0 : this.animationFrame;
        
        // Get sprite frame data
        const spriteFrame = Penguin.spriteSheet.getFrame(row, frame);
        if (!spriteFrame) return;
        
        // Draw sprite with color tinting for customization
        this.drawTintedSprite(ctx, spriteFrame);
    }
    
    drawTintedSprite(ctx, spriteFrame) {
        // If using default color, draw sprite directly
        if (this.color === Penguin.defaultColor) {
            ctx.drawImage(
                spriteFrame.image,
                spriteFrame.sx, spriteFrame.sy, spriteFrame.sw, spriteFrame.sh,
                -spriteFrame.sw / 2, -spriteFrame.sh / 2,
                spriteFrame.sw, spriteFrame.sh
            );
            return;
        }
        
        // Create a temporary canvas for color tinting if not exists
        if (!this.tintCanvas) {
            this.tintCanvas = document.createElement('canvas');
            this.tintCanvas.width = spriteFrame.sw;
            this.tintCanvas.height = spriteFrame.sh;
        }
        
        const tintCtx = this.tintCanvas.getContext('2d');
        tintCtx.clearRect(0, 0, this.tintCanvas.width, this.tintCanvas.height);
        
        // Draw original sprite
        tintCtx.drawImage(
            spriteFrame.image,
            spriteFrame.sx, spriteFrame.sy, spriteFrame.sw, spriteFrame.sh,
            0, 0, spriteFrame.sw, spriteFrame.sh
        );
        
        // Get image data for color replacement
        const imageData = tintCtx.getImageData(0, 0, this.tintCanvas.width, this.tintCanvas.height);
        const data = imageData.data;
        
        // Convert custom color to RGB
        const customColor = this.hexToRgb(this.color);
        const defaultColor = this.hexToRgb(Penguin.defaultColor);
        
        // Replace default body color with custom color
        // This preserves white (belly), black (outline/eyes), orange (beak), dark gray (hood)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel matches default body color (with tolerance)
            if (this.colorsMatch(r, g, b, defaultColor.r, defaultColor.g, defaultColor.b, 30)) {
                // Replace with custom color
                data[i] = customColor.r;
                data[i + 1] = customColor.g;
                data[i + 2] = customColor.b;
            }
        }
        
        tintCtx.putImageData(imageData, 0, 0);
        
        // Draw the tinted sprite
        ctx.drawImage(
            this.tintCanvas,
            -spriteFrame.sw / 2, -spriteFrame.sh / 2,
            spriteFrame.sw, spriteFrame.sh
        );
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 168, g: 213, b: 226 }; // Default color
    }
    
    colorsMatch(r1, g1, b1, r2, g2, b2, tolerance) {
        return Math.abs(r1 - r2) < tolerance &&
               Math.abs(g1 - g2) < tolerance &&
               Math.abs(b1 - b2) < tolerance;
    }

    drawPenguin(ctx) {
        // Draw penguin based on direction and animation frame
        // Matching the sprite sheet with proper chibi pixel art style
        
        if (this.direction === 'idle') {
            this.drawFrontView(ctx, 0); // Idle uses first front frame
        } else if (this.direction === 'up') {
            this.drawBackView(ctx, this.animationFrame);
        } else if (this.direction === 'down') {
            this.drawFrontView(ctx, this.animationFrame);
        } else if (this.direction === 'left') {
            this.drawLeftView(ctx, this.animationFrame);
        } else if (this.direction === 'right') {
            this.drawRightView(ctx, this.animationFrame);
        }
    }

    // Front view (down direction) - with white belly
    drawFrontView(ctx, frame) {
        const bodyColor = this.color;
        const hoodColor = '#5A5A5A';
        const bellyColor = '#FFFFFF';
        const outlineColor = '#2C2C2C';
        
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        
        // Head (large chibi head)
        ctx.fillStyle = bodyColor;
        // Head top
        ctx.fillRect(-7, -12, 14, 2);
        ctx.strokeRect(-7, -12, 14, 2);
        // Head sides
        ctx.fillRect(-8, -10, 1, 6);
        ctx.fillRect(7, -10, 1, 6);
        ctx.strokeRect(-8, -10, 1, 6);
        ctx.strokeRect(7, -10, 1, 6);
        // Head main
        ctx.fillRect(-7, -10, 14, 6);
        ctx.strokeRect(-7, -10, 14, 6);
        
        // Hood/back (darker gray covering top and back)
        ctx.fillStyle = hoodColor;
        ctx.fillRect(-8, -12, 16, 8);
        ctx.strokeRect(-8, -12, 16, 8);
        
        // Eyes (square black pixels, 2x2)
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, -9, 2, 2);
        ctx.fillRect(2, -9, 2, 2);
        
        // Beak (orange horizontal rectangle)
        ctx.fillStyle = '#FF8C42';
        ctx.fillRect(-2, -7, 4, 2);
        ctx.strokeRect(-2, -7, 4, 2);
        
        // Body (rounded oval shape)
        ctx.fillStyle = bodyColor;
        // Body main
        ctx.fillRect(-6, -4, 12, 14);
        ctx.strokeRect(-6, -4, 12, 14);
        // Body sides (rounded)
        ctx.fillRect(-7, -2, 1, 10);
        ctx.fillRect(6, -2, 1, 10);
        ctx.strokeRect(-7, -2, 1, 10);
        ctx.strokeRect(6, -2, 1, 10);
        
        // White belly (prominent oval on front)
        ctx.fillStyle = bellyColor;
        ctx.fillRect(-4, 0, 8, 10);
        ctx.strokeRect(-4, 0, 8, 10);
        // Belly sides (rounded)
        ctx.fillRect(-5, 2, 1, 6);
        ctx.fillRect(4, 2, 1, 6);
        ctx.strokeRect(-5, 2, 1, 6);
        ctx.strokeRect(4, 2, 1, 6);
        
        // Wings (darker gray, visible on sides)
        ctx.fillStyle = hoodColor;
        ctx.fillRect(-7, -2, 2, 8);
        ctx.fillRect(5, -2, 2, 8);
        ctx.strokeRect(-7, -2, 2, 8);
        ctx.strokeRect(5, -2, 2, 8);
        
        // Feet (dark gray/black, animate based on frame)
        ctx.fillStyle = '#2C2C2C';
        const footOffset = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
        // Left foot
        ctx.fillRect(-6 + footOffset, 10, 3, 2);
        ctx.strokeRect(-6 + footOffset, 10, 3, 2);
        // Right foot
        ctx.fillRect(3 - footOffset, 10, 3, 2);
        ctx.strokeRect(3 - footOffset, 10, 3, 2);
    }

    // Back view (up direction) - shows hood prominently
    drawBackView(ctx, frame) {
        const bodyColor = this.color;
        const hoodColor = '#5A5A5A';
        const outlineColor = '#2C2C2C';
        
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        
        // Head (large, mostly hood)
        ctx.fillStyle = hoodColor;
        ctx.fillRect(-8, -12, 16, 8);
        ctx.strokeRect(-8, -12, 16, 8);
        // Head sides
        ctx.fillRect(-9, -10, 1, 6);
        ctx.fillRect(8, -10, 1, 6);
        ctx.strokeRect(-9, -10, 1, 6);
        ctx.strokeRect(8, -10, 1, 6);
        
        // Body (rounded)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-6, -4, 12, 14);
        ctx.strokeRect(-6, -4, 12, 14);
        // Body sides
        ctx.fillRect(-7, -2, 1, 10);
        ctx.fillRect(6, -2, 1, 10);
        ctx.strokeRect(-7, -2, 1, 10);
        ctx.strokeRect(6, -2, 1, 10);
        
        // Wings (darker gray, more prominent from back)
        ctx.fillStyle = hoodColor;
        ctx.fillRect(-7, -2, 3, 10);
        ctx.fillRect(4, -2, 3, 10);
        ctx.strokeRect(-7, -2, 3, 10);
        ctx.strokeRect(4, -2, 3, 10);
        
        // Feet (animate)
        ctx.fillStyle = '#2C2C2C';
        const footOffset = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
        ctx.fillRect(-6 + footOffset, 10, 3, 2);
        ctx.fillRect(3 - footOffset, 10, 3, 2);
        ctx.strokeRect(-6 + footOffset, 10, 3, 2);
        ctx.strokeRect(3 - footOffset, 10, 3, 2);
    }

    // Left view (left direction) - shows flipper
    drawLeftView(ctx, frame) {
        const bodyColor = this.color;
        const hoodColor = '#5A5A5A';
        const bellyColor = '#FFFFFF';
        const outlineColor = '#2C2C2C';
        
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        
        // Head
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-7, -12, 12, 8);
        ctx.strokeRect(-7, -12, 12, 8);
        
        // Hood
        ctx.fillStyle = hoodColor;
        ctx.fillRect(-8, -12, 10, 8);
        ctx.strokeRect(-8, -12, 10, 8);
        
        // Eye (single, facing left)
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, -9, 2, 2);
        
        // Beak (side view)
        ctx.fillStyle = '#FF8C42';
        ctx.fillRect(-2, -7, 3, 2);
        ctx.strokeRect(-2, -7, 3, 2);
        
        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-6, -4, 10, 14);
        ctx.strokeRect(-6, -4, 10, 14);
        
        // Belly (partial, visible from side)
        ctx.fillStyle = bellyColor;
        ctx.fillRect(-4, 0, 6, 10);
        ctx.strokeRect(-4, 0, 6, 10);
        
        // Flipper (dark gray V-shape, animates)
        ctx.fillStyle = hoodColor;
        const flipperOffset = frame === 1 ? -1 : (frame === 2 ? 1 : 0);
        // Flipper shape
        ctx.fillRect(-7 + flipperOffset, -2, 2, 8);
        ctx.strokeRect(-7 + flipperOffset, -2, 2, 8);
        // Flipper tip
        ctx.fillRect(-8 + flipperOffset, 0, 1, 4);
        ctx.strokeRect(-8 + flipperOffset, 0, 1, 4);
        
        // Feet (animate)
        ctx.fillStyle = '#2C2C2C';
        const footOffset = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
        ctx.fillRect(-5 + footOffset, 10, 3, 2);
        ctx.fillRect(1 - footOffset, 10, 3, 2);
        ctx.strokeRect(-5 + footOffset, 10, 3, 2);
        ctx.strokeRect(1 - footOffset, 10, 3, 2);
    }

    // Right view (right direction) - mirror of left
    drawRightView(ctx, frame) {
        const bodyColor = this.color;
        const hoodColor = '#5A5A5A';
        const bellyColor = '#FFFFFF';
        const outlineColor = '#2C2C2C';
        
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        
        // Head
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-5, -12, 12, 8);
        ctx.strokeRect(-5, -12, 12, 8);
        
        // Hood
        ctx.fillStyle = hoodColor;
        ctx.fillRect(-2, -12, 10, 8);
        ctx.strokeRect(-2, -12, 10, 8);
        
        // Eye (single, facing right)
        ctx.fillStyle = '#000000';
        ctx.fillRect(2, -9, 2, 2);
        
        // Beak (side view)
        ctx.fillStyle = '#FF8C42';
        ctx.fillRect(-1, -7, 3, 2);
        ctx.strokeRect(-1, -7, 3, 2);
        
        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-4, -4, 10, 14);
        ctx.strokeRect(-4, -4, 10, 14);
        
        // Belly (partial)
        ctx.fillStyle = bellyColor;
        ctx.fillRect(-2, 0, 6, 10);
        ctx.strokeRect(-2, 0, 6, 10);
        
        // Flipper (animates)
        ctx.fillStyle = hoodColor;
        const flipperOffset = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
        ctx.fillRect(5 - flipperOffset, -2, 2, 8);
        ctx.strokeRect(5 - flipperOffset, -2, 2, 8);
        ctx.fillRect(7 - flipperOffset, 0, 1, 4);
        ctx.strokeRect(7 - flipperOffset, 0, 1, 4);
        
        // Feet (animate)
        ctx.fillStyle = '#2C2C2C';
        const footOffset = frame === 1 ? -1 : (frame === 2 ? 1 : 0);
        ctx.fillRect(-4 - footOffset, 10, 3, 2);
        ctx.fillRect(1 + footOffset, 10, 3, 2);
        ctx.strokeRect(-4 - footOffset, 10, 3, 2);
        ctx.strokeRect(1 + footOffset, 10, 3, 2);
    }

    drawHat(ctx) {
        // Position hat above sprite head
        // Sprite is drawn centered, so for 64x64 sprite, top is at -32 in scaled coordinates
        // Hat should be positioned above the sprite head
        let hatY;
        if (Penguin.spriteSheet && Penguin.spriteSheet.isLoaded()) {
            const spriteHeight = Penguin.spriteSheet.spriteHeight;
            hatY = -(spriteHeight / 2) + 2; // Above the head (moved 10 pixels down from -8 to +2)
        } else {
            // Fallback for programmatic drawing
            hatY = -12 + 8; // Above the head (moved 10 pixels down)
        }
        
        // Scale hat to be 2x bigger
        ctx.save();
        ctx.scale(2, 2);
        hatY = hatY / 2; // Adjust Y position for scaled coordinate system
        
        switch (this.hat) {
            case 'party':
                // Party hat (triangle)
                ctx.fillStyle = '#FF6B9D';
                ctx.beginPath();
                ctx.moveTo(0, hatY);
                ctx.lineTo(-6, hatY + 8);
                ctx.lineTo(6, hatY + 8);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
                
            case 'egg':
                // Egg hat
                ctx.fillStyle = '#FFF8DC';
                ctx.beginPath();
                ctx.ellipse(0, hatY + 4, 5, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
            
                
            case 'magician':
                // Magician hat (tall cone)
                ctx.fillStyle = '#1A1A1A';
                ctx.beginPath();
                ctx.moveTo(0, hatY - 6);
                ctx.lineTo(-5, hatY + 4);
                ctx.lineTo(5, hatY + 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(-4, hatY + 2, 8, 2);
                break;
                
            case 'bow':
                // Red bow
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(-6, hatY, 4, 3);
                ctx.fillRect(2, hatY, 4, 3);
                ctx.fillRect(-2, hatY + 1, 4, 2);
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.strokeRect(-6, hatY, 4, 3);
                ctx.strokeRect(2, hatY, 4, 3);
                ctx.strokeRect(-2, hatY + 1, 4, 2);
                break;
                
            case 'cowboy':
                // Cowboy hat
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(-8, hatY, 16, 2);
                ctx.fillRect(-6, hatY + 2, 12, 3);
                ctx.strokeRect(-8, hatY, 16, 2);
                ctx.strokeRect(-6, hatY + 2, 12, 3);
                break;
                
            case 'watermelon':
                // Watermelon hat
                ctx.fillStyle = '#228B22';
                ctx.fillRect(-7, hatY, 14, 5);
                ctx.strokeRect(-7, hatY, 14, 5);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(-6, hatY + 1, 12, 3);
                // Seeds
                ctx.fillStyle = '#000000';
                ctx.fillRect(-3, hatY + 2, 1, 1);
                ctx.fillRect(2, hatY + 2, 1, 1);
                break;
                
            case 'baseball':
                // Baseball cap
                ctx.fillStyle = '#000080';
                ctx.fillRect(-7, hatY, 14, 2);
                ctx.fillRect(-5, hatY + 2, 10, 3);
                ctx.strokeRect(-7, hatY, 14, 2);
                ctx.strokeRect(-5, hatY + 2, 10, 3);
                // Brim
                ctx.fillStyle = '#000080';
                ctx.fillRect(-8, hatY + 2, 16, 1);
                break;
                
            case 'santa':
                // Santa hat
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.moveTo(0, hatY - 8);
                ctx.lineTo(-6, hatY + 4);
                ctx.lineTo(6, hatY + 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.stroke();
                // White trim
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-6, hatY + 2, 12, 2);
                // White pom-pom
                ctx.beginPath();
                ctx.arc(0, hatY - 8, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'blue_party':
                // Blue party hat
                ctx.fillStyle = '#4169E1';
                ctx.beginPath();
                ctx.moveTo(0, hatY);
                ctx.lineTo(-6, hatY + 8);
                ctx.lineTo(6, hatY + 8);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
                
            case 'yellow_party':
                // Yellow party hat
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(0, hatY);
                ctx.lineTo(-6, hatY + 8);
                ctx.lineTo(6, hatY + 8);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
                
            case 'reindeer':
                // Reindeer ears
                ctx.fillStyle = '#8B4513';
                // Left ear
                ctx.beginPath();
                ctx.ellipse(-5, hatY, 3, 5, -0.3, 0, Math.PI * 2);
                ctx.fill();
                // Right ear
                ctx.beginPath();
                ctx.ellipse(5, hatY, 3, 5, 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(-5, hatY, 3, 5, -0.3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(5, hatY, 3, 5, 0.3, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'beanie':
                // Winter beanie
                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(-7, hatY, 14, 5);
                ctx.strokeRect(-7, hatY, 14, 5);
                // Pom-pom
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, hatY, 2, 0, Math.PI * 2);
                ctx.fill();
                // Brim
                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(-8, hatY + 4, 16, 1);
                break;
        }
        
        ctx.restore(); // Restore after scaling hat
    }

    drawEmoji(ctx, penguinX, penguinY, emojiObj) {
        if (!emojiObj) return;
        
        const emojiMap = {
            // Default emojis
            happy: '😊',
            sad: '😢',
            relieved: '😌',
            silly: '😜',
            surprised: '😲',
            laughing: '😂',
            cool: '😎',
            cowboy_face: '🤠',
            angry: '😠',
            clown: '🤡',
            tired: '😩',
            dizzy: '😵‍💫',
            thinking: '🤔',
            hot: '🥵',
            smirk: '😏',
            // Holiday emojis
            party_popper: '🎉',
            gift: '🎁',
            confetti: '🎊',
            christmas_tree: '🎄',
            partying: '🥳',
            balloon: '🎈',
            sparkles: '✨',
            birthday_cake: '🎂',
            dancing_woman: '💃',
            dancing_man: '🕺'
        };
        
        const emojiText = emojiMap[emojiObj.type] || '😊';
        
        // Calculate fade based on distance from penguin
        // Start fading when emoji reaches emojiFadeDistance (400px) above penguin
        const distanceAbove = Math.abs(emojiObj.y);
        let alpha = 1;
        
        if (distanceAbove > this.emojiFadeDistance) {
            // Fade out over the next 100 pixels
            const fadeStart = this.emojiFadeDistance;
            const fadeEnd = this.emojiFadeDistance + 100;
            if (distanceAbove >= fadeEnd) {
                alpha = 0;
            } else {
                alpha = 1 - ((distanceAbove - fadeStart) / (fadeEnd - fadeStart));
            }
        }
        
        // Fade in quickly at the start
        const age = (Date.now() - emojiObj.timestamp) / 1000;
        const fadeIn = Math.min(1, age * 5); // Quick fade in
        alpha = Math.min(alpha, fadeIn);
        
        if (alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Draw emoji at penguin's world position + emojiY offset (moves upward)
        ctx.fillText(emojiText, penguinX, penguinY + emojiObj.y);
        ctx.restore();
    }
}

