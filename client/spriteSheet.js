class SpriteSheet {
    constructor(imagePath, spriteWidth, spriteHeight, framesPerRow) {
        this.image = new Image();
        this.image.src = imagePath;
        console.log("imagePath", this.image.src);
        this.spriteWidth = spriteWidth;
        console.log("spriteWidth", this.spriteWidth);
        this.spriteHeight = spriteHeight;
        this.framesPerRow = framesPerRow;
        this.loaded = false;
        
        this.image.onload = () => {
            this.loaded = true;
            console.log("loaded", this.loaded);
        };
        
        this.image.onerror = () => {
            console.error(`Failed to load sprite sheet: ${imagePath}`);
        };
    }

    // Get a sprite frame from the sheet
    // row: 0 = down, 1 = up, 2 = left, 3 = right
    // frame: 0-2 for waddling animation (0 = idle/center, 1 = waddle left, 2 = waddle right)
    getFrame(row, frame) {
        if (!this.loaded) return null;
        
        const sx = frame * this.spriteWidth;
        const sy = row * this.spriteHeight;
        
        return {
            image: this.image,
            sx: sx,
            sy: sy,
            sw: this.spriteWidth,
            sh: this.spriteHeight
        };
    }

    isLoaded() {
        return this.loaded;
    }
}

