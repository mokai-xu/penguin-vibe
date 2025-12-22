class HolidayWorld {
    constructor(canvas, worldX = 0, worldY = 0) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // World position (center of world in world space)
        this.worldX = worldX;
        this.worldY = worldY;
        
        // Generate trees and ponds
        this.trees = this.generateTrees();
        this.ponds = this.generatePonds();
        
        // Snowflake animation
        this.snowflakes = this.generateSnowflakes();
        this.time = 0;
    }
    
    generateTrees() {
        const trees = [];
        const numTrees = 80; // Spread trees across the world
        const worldSize = 4000; // Match game world bounds
        
        // Use seeded random for consistent placement
        let seed = 54321;
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        for (let i = 0; i < numTrees; i++) {
            const x = (seededRandom() - 0.5) * worldSize;
            const y = (seededRandom() - 0.5) * worldSize;
            const size = 30 + seededRandom() * 40; // Tree size variation
            
            trees.push({
                x: x,
                y: y,
                size: size,
                trunkHeight: size * 0.4,
                crownSize: size * 0.6
            });
        }
        
        return trees;
    }
    
    generatePonds() {
        const ponds = [];
        const numPonds = 15;
        const worldSize = 4000;
        
        let seed = 98765;
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        for (let i = 0; i < numPonds; i++) {
            const x = (seededRandom() - 0.5) * worldSize;
            const y = (seededRandom() - 0.5) * worldSize;
            const radius = 40 + seededRandom() * 60;
            
            ponds.push({
                x: x,
                y: y,
                radius: radius
            });
        }
        
        return ponds;
    }
    
    generateSnowflakes() {
        const snowflakes = [];
        const numSnowflakes = 500;
        
        for (let i = 0; i < numSnowflakes; i++) {
            snowflakes.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                size: 1 + Math.random() * 1.5,
                speed: 0.5 + Math.random() * 1,
                drift: (Math.random() - 0.5) * 0.5
            });
        }
        
        return snowflakes;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update snowflakes
        this.snowflakes.forEach(snowflake => {
            snowflake.y += snowflake.speed * deltaTime * 50;
            snowflake.x += snowflake.drift * deltaTime * 50;
            
            // Reset if off screen (will be handled by camera)
            if (snowflake.y > 2000) {
                snowflake.y = -2000;
                snowflake.x = Math.random() * 4000 - 2000;
            }
        });
    }
    
    isPointNearTree(x, y, radius = 20) {
        // Check if point is within walking distance of any tree
        for (const tree of this.trees) {
            const dist = Math.sqrt((x - tree.x) ** 2 + (y - tree.y) ** 2);
            if (dist < tree.crownSize + radius) {
                return true;
            }
        }
        return false;
    }
    
    constrainPoint(x, y, radius = 10) {
        // If point is near a tree, allow it
        if (this.isPointNearTree(x, y, radius)) {
            return { x, y };
        }
        
        // Otherwise, find nearest tree and move point to its edge
        let nearestTree = null;
        let minDist = Infinity;
        
        for (const tree of this.trees) {
            const dist = Math.sqrt((x - tree.x) ** 2 + (y - tree.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearestTree = tree;
            }
        }
        
        if (nearestTree) {
            const angle = Math.atan2(y - nearestTree.y, x - nearestTree.x);
            const targetDist = nearestTree.crownSize + radius;
            return {
                x: nearestTree.x + Math.cos(angle) * targetDist,
                y: nearestTree.y + Math.sin(angle) * targetDist
            };
        }
        
        return { x, y };
    }
    
    render(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
        // Calculate visible area
        const visibleLeft = cameraX - canvasWidth / 2 - 100;
        const visibleRight = cameraX + canvasWidth / 2 + 100;
        const visibleTop = cameraY - canvasHeight / 2 - 100;
        const visibleBottom = cameraY + canvasHeight / 2 + 100;
        
        // Draw water background (areas without trees)
        ctx.fillStyle = '#4682B4'; // Ocean blue
        ctx.fillRect(visibleLeft, visibleTop, visibleRight - visibleLeft, visibleBottom - visibleTop);
        
        // Draw water waves
        ctx.fillStyle = '#5A9FD4';
        const waveTime = Date.now() * 0.001;
        for (let x = Math.floor(visibleLeft / 30) * 30; x < visibleRight; x += 30) {
            for (let y = Math.floor(visibleTop / 30) * 30; y < visibleBottom; y += 30) {
                const wave = Math.sin(waveTime + x * 0.01 + y * 0.01) * 3;
                ctx.fillRect(x, y + wave, 30, 5);
            }
        }
        
        // Draw traversable areas (snowy ground around trees)
        // For each tree, draw a circular area of snow
        this.trees.forEach(tree => {
            if (tree.x + tree.crownSize + 50 > visibleLeft && tree.x - tree.crownSize - 50 < visibleRight &&
                tree.y + tree.crownSize + 50 > visibleTop && tree.y - tree.crownSize - 50 < visibleBottom) {
                // Draw snow circle around tree
                const snowRadius = tree.crownSize + 40; // Traversable radius
                ctx.fillStyle = '#F0F8FF'; // Snow white
                ctx.beginPath();
                ctx.arc(tree.x, tree.y, snowRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw border around traversable area
                ctx.strokeStyle = '#87CEEB';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(tree.x, tree.y, snowRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // Draw snow texture on traversable areas
        ctx.fillStyle = '#FFFFFF';
        this.trees.forEach(tree => {
            const snowRadius = tree.crownSize + 40;
            if (tree.x + snowRadius > visibleLeft && tree.x - snowRadius < visibleRight &&
                tree.y + snowRadius > visibleTop && tree.y - snowRadius < visibleBottom) {
                for (let x = Math.floor((tree.x - snowRadius) / 20) * 20; x < tree.x + snowRadius; x += 20) {
                    for (let y = Math.floor((tree.y - snowRadius) / 20) * 20; y < tree.y + snowRadius; y += 20) {
                        const dist = Math.sqrt((x - tree.x) ** 2 + (y - tree.y) ** 2);
                        if (dist < snowRadius && Math.random() > 0.7) {
                            ctx.fillRect(x, y, 2, 2);
                        }
                    }
                }
            }
        });
        
        // Draw ponds
        ctx.fillStyle = '#87CEEB'; // Sky blue for frozen/icy ponds
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 2;
        this.ponds.forEach(pond => {
            if (pond.x + pond.radius > visibleLeft && pond.x - pond.radius < visibleRight &&
                pond.y + pond.radius > visibleTop && pond.y - pond.radius < visibleBottom) {
                ctx.beginPath();
                ctx.arc(pond.x, pond.y, pond.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Add some ice texture
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(pond.x, pond.y, pond.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#87CEEB';
            }
        });
        
        // Draw trees
        this.trees.forEach(tree => {
            if (tree.x + tree.size > visibleLeft && tree.x - tree.size < visibleRight &&
                tree.y + tree.size > visibleTop && tree.y - tree.size < visibleBottom) {
                this.drawTree(ctx, tree);
            }
        });
        
        // Draw snowflakes
        ctx.fillStyle = '#FFFFFF';
        this.snowflakes.forEach(snowflake => {
            if (snowflake.x > visibleLeft && snowflake.x < visibleRight &&
                snowflake.y > visibleTop && snowflake.y < visibleBottom) {
                ctx.beginPath();
                ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    drawTree(ctx, tree) {
        const { x, y, trunkHeight, crownSize } = tree;
        
        // Draw trunk
        ctx.fillStyle = '#8B4513'; // Brown trunk
        ctx.fillRect(x - 4, y, 8, trunkHeight);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, y, 8, trunkHeight);
        
        // Draw crown (evergreen triangle layers)
        ctx.fillStyle = '#228B22'; // Forest green
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 1;
        
        // Bottom layer (largest)
        ctx.beginPath();
        ctx.moveTo(x, y - trunkHeight - crownSize * 0.3);
        ctx.lineTo(x - crownSize * 0.6, y - trunkHeight);
        ctx.lineTo(x + crownSize * 0.6, y - trunkHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Middle layer
        ctx.beginPath();
        ctx.moveTo(x, y - trunkHeight - crownSize * 0.6);
        ctx.lineTo(x - crownSize * 0.5, y - trunkHeight - crownSize * 0.2);
        ctx.lineTo(x + crownSize * 0.5, y - trunkHeight - crownSize * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Top layer
        ctx.beginPath();
        ctx.moveTo(x, y - trunkHeight - crownSize * 0.9);
        ctx.lineTo(x - crownSize * 0.4, y - trunkHeight - crownSize * 0.5);
        ctx.lineTo(x + crownSize * 0.4, y - trunkHeight - crownSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add snow on branches
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - crownSize * 0.3, y - trunkHeight - crownSize * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + crownSize * 0.3, y - trunkHeight - crownSize * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y - trunkHeight - crownSize * 0.7, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

