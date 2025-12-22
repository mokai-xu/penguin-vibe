class Iceberg {
    constructor(canvas, worldX = 0, worldY = 0) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // World position (center of iceberg in world space)
        this.worldX = worldX;
        this.worldY = worldY;
        
        // Floating animation
        this.time = 0;
        this.floatSpeed = 0.002;
        this.floatAmount = 3;
        
        // Initialize iceberg dimensions
        this.updateDimensions();
        
        // Generate boundary points
        this.boundaryPoints = this.generateBoundary();
        
        // Generate snow clump positions (spread out across iceberg)
        this.snowClumps = this.generateSnowClumps();
    }
    
    updateDimensions() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Iceberg shape - Make it bigger and more rectangular
        // Use larger dimensions for a bigger iceberg
        // Make it rectangular: wider than tall
        this.baseRadiusX = Math.max(this.width, 1200) * 0.8; // 80% of width or 1200px, whichever is larger
        this.baseRadiusY = Math.max(this.height, 800) * 0.6; // 60% of height or 800px, whichever is larger
        
        // Center in world space
        this.centerX = this.worldX;
        this.centerY = this.worldY;
        
        // Regenerate boundary points with new dimensions
        this.boundaryPoints = this.generateBoundary();
        
        // Regenerate snow clumps with new dimensions
        this.snowClumps = this.generateSnowClumps();
    }

    generateBoundary() {
        const points = [];
        const segments = 32;
        const cornerRadius = 40; // Rounded corners for rectangular shape
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Create a rounded rectangle shape
            // Reduce organic variations to make it more rectangular
            const variationX = Math.sin(angle * 4) * 10; // Smaller variation
            const variationY = Math.cos(angle * 4) * 10; // Smaller variation
            
            // Make corners more rounded by adjusting radius at corners
            const cornerFactor = Math.min(
                Math.abs(Math.cos(angle)),
                Math.abs(Math.sin(angle))
            );
            const cornerAdjust = cornerFactor * cornerRadius;
            
            const radiusX = this.baseRadiusX + variationX - cornerAdjust;
            const radiusY = this.baseRadiusY + variationY - cornerAdjust;
            
            points.push({
                x: this.centerX + Math.cos(angle) * radiusX,
                y: this.centerY + Math.sin(angle) * radiusY
            });
        }
        return points;
    }

    generateSnowClumps() {
        const clumps = [];
        const numCircularClumps = 12; // Circular snow clumps
        const numTriangularClumps = 15; // Triangular snow clumps
        const totalClumps = numCircularClumps + numTriangularClumps;
        const minDistance = Math.min(this.baseRadiusX, this.baseRadiusY) * 0.25; // Minimum distance between clumps
        
        // Use a seeded random for consistent placement
        let seed = 12345;
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        for (let i = 0; i < totalClumps; i++) {
            let attempts = 0;
            let x, y;
            let validPosition = false;
            const isTriangular = i >= numCircularClumps;
            
            // Try to find a position that's inside the iceberg and far from other clumps
            while (attempts < 50 && !validPosition) {
                // Spread clumps across the iceberg area
                const angle = (i / totalClumps) * Math.PI * 2 + seededRandom() * 0.5;
                const distance = (0.3 + seededRandom() * 0.5) * Math.min(this.baseRadiusX, this.baseRadiusY);
                
                x = this.centerX + Math.cos(angle) * distance;
                y = this.centerY + Math.sin(angle) * distance;
                
                // Check if inside iceberg
                if (this.isPointInside(x, y)) {
                    // Check distance from other clumps
                    let tooClose = false;
                    for (const clump of clumps) {
                        const dist = Math.sqrt((x - clump.x) ** 2 + (y - clump.y) ** 2);
                        if (dist < minDistance) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (!tooClose) {
                        validPosition = true;
                    }
                }
                attempts++;
            }
            
            if (validPosition) {
                clumps.push({
                    x: x,
                    y: y,
                    size: isTriangular ? (5 + seededRandom() * 8) : (4 + seededRandom() * 6), // Triangular slightly larger
                    opacity: 0.6 + seededRandom() * 0.3, // Slight variation in opacity
                    type: isTriangular ? 'triangle' : 'circle',
                    rotation: seededRandom() * Math.PI * 2 // Random rotation for triangles
                });
            }
        }
        
        return clumps;
    }

    update(deltaTime) {
        this.time += deltaTime * this.floatSpeed;
    }

    isPointInside(x, y) {
        // Point-in-polygon test
        let inside = false;
        const points = this.boundaryPoints;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x;
            const yi = points[i].y;
            const xj = points[j].x;
            const yj = points[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    constrainPoint(x, y, radius = 10) {
        // If point is outside, move it to nearest point on boundary
        if (this.isPointInside(x, y)) {
            return { x, y };
        }
        
        // Find closest point on boundary
        let closestX = this.boundaryPoints[0].x;
        let closestY = this.boundaryPoints[0].y;
        let minDist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
        
        for (let i = 1; i < this.boundaryPoints.length; i++) {
            const px = this.boundaryPoints[i].x;
            const py = this.boundaryPoints[i].y;
            const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
            
            if (dist < minDist) {
                minDist = dist;
                closestX = px;
                closestY = py;
            }
        }
        
        // Move point slightly inside boundary
        const angle = Math.atan2(y - this.centerY, x - this.centerX);
        const moveX = Math.cos(angle) * radius;
        const moveY = Math.sin(angle) * radius;
        
        return {
            x: closestX - moveX,
            y: closestY - moveY
        };
    }

    render(ctx) {
        // Use provided context (which already has camera transform applied)
        const renderCtx = ctx || this.ctx;
        const floatOffset = Math.sin(this.time) * this.floatAmount;
        
        renderCtx.save();
        renderCtx.translate(0, floatOffset);
        
        // Draw iceberg
        renderCtx.beginPath();
        renderCtx.moveTo(this.boundaryPoints[0].x, this.boundaryPoints[0].y);
        for (let i = 1; i < this.boundaryPoints.length; i++) {
            renderCtx.lineTo(this.boundaryPoints[i].x, this.boundaryPoints[i].y);
        }
        renderCtx.closePath();
        
        // Iceberg gradient
        const gradient = renderCtx.createLinearGradient(
            this.centerX - this.baseRadiusX,
            this.centerY - this.baseRadiusY,
            this.centerX + this.baseRadiusX,
            this.centerY + this.baseRadiusY
        );
        gradient.addColorStop(0, '#E8F4F8');
        gradient.addColorStop(0.5, '#D0E8F0');
        gradient.addColorStop(1, '#B8DCE8');
        
        renderCtx.fillStyle = gradient;
        renderCtx.fill();
        
        // Iceberg outline
        renderCtx.strokeStyle = '#A0C4D0';
        renderCtx.lineWidth = 2;
        renderCtx.stroke();
        
        // Add some texture/details
        renderCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 5; i++) {
            const x = this.centerX + (Math.random() - 0.5) * this.baseRadiusX;
            const y = this.centerY + (Math.random() - 0.5) * this.baseRadiusY;
            if (this.isPointInside(x, y)) {
                renderCtx.beginPath();
                renderCtx.arc(x, y, 3, 0, Math.PI * 2);
                renderCtx.fill();
            }
        }
        
        // Draw snow clumps (spread out across iceberg)
        for (const clump of this.snowClumps) {
            renderCtx.save();
            renderCtx.translate(clump.x, clump.y);
            renderCtx.rotate(clump.rotation || 0);
            
            if (clump.type === 'triangle') {
                // Draw triangular snow clump
                renderCtx.fillStyle = `rgba(255, 255, 255, ${clump.opacity})`;
                renderCtx.beginPath();
                // Draw triangle pointing up
                renderCtx.moveTo(0, -clump.size); // Top point
                renderCtx.lineTo(-clump.size * 0.866, clump.size * 0.5); // Bottom left
                renderCtx.lineTo(clump.size * 0.866, clump.size * 0.5); // Bottom right
                renderCtx.closePath();
                renderCtx.fill();
                
                // Add a subtle highlight for depth
                renderCtx.fillStyle = `rgba(255, 255, 255, ${clump.opacity * 0.5})`;
                renderCtx.beginPath();
                renderCtx.moveTo(0, -clump.size * 0.6); // Top point (smaller)
                renderCtx.lineTo(-clump.size * 0.4, clump.size * 0.2); // Bottom left (smaller)
                renderCtx.lineTo(clump.size * 0.4, clump.size * 0.2); // Bottom right (smaller)
                renderCtx.closePath();
                renderCtx.fill();
            } else {
                // Draw circular snow clump
                renderCtx.fillStyle = `rgba(255, 255, 255, ${clump.opacity})`;
                renderCtx.beginPath();
                renderCtx.arc(0, 0, clump.size, 0, Math.PI * 2);
                renderCtx.fill();
                
                // Add a subtle highlight for depth
                renderCtx.fillStyle = `rgba(255, 255, 255, ${clump.opacity * 0.5})`;
                renderCtx.beginPath();
                renderCtx.arc(-clump.size * 0.3, -clump.size * 0.3, clump.size * 0.4, 0, Math.PI * 2);
                renderCtx.fill();
            }
            
            renderCtx.restore();
        }
        
        renderCtx.restore();
    }
}
