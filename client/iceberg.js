class Iceberg {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Floating animation
        this.time = 0;
        this.floatSpeed = 0.002;
        this.floatAmount = 3;
        
        // Initialize iceberg dimensions
        this.updateDimensions();
        
        // Generate boundary points
        this.boundaryPoints = this.generateBoundary();
    }
    
    updateDimensions() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Iceberg shape (ellipse-like polygon) - Fill entire screen
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        // Use canvas dimensions to fill entire screen
        // Use 48% of width/height (96% total) to fill most of the screen
        this.baseRadiusX = this.width * 0.48; // Nearly half the width
        this.baseRadiusY = this.height * 0.48; // Nearly half the height
        
        // Regenerate boundary points with new dimensions
        this.boundaryPoints = this.generateBoundary();
    }

    generateBoundary() {
        const points = [];
        const segments = 32;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radiusX = this.baseRadiusX + Math.sin(angle * 3) * 20;
            const radiusY = this.baseRadiusY + Math.cos(angle * 2) * 15;
            points.push({
                x: this.centerX + Math.cos(angle) * radiusX,
                y: this.centerY + Math.sin(angle) * radiusY
            });
        }
        return points;
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

    render() {
        const ctx = this.ctx;
        const floatOffset = Math.sin(this.time) * this.floatAmount;
        
        ctx.save();
        ctx.translate(0, floatOffset);
        
        // Draw iceberg
        ctx.beginPath();
        ctx.moveTo(this.boundaryPoints[0].x, this.boundaryPoints[0].y);
        for (let i = 1; i < this.boundaryPoints.length; i++) {
            ctx.lineTo(this.boundaryPoints[i].x, this.boundaryPoints[i].y);
        }
        ctx.closePath();
        
        // Iceberg gradient
        const gradient = ctx.createLinearGradient(
            this.centerX - this.baseRadiusX,
            this.centerY - this.baseRadiusY,
            this.centerX + this.baseRadiusX,
            this.centerY + this.baseRadiusY
        );
        gradient.addColorStop(0, '#E8F4F8');
        gradient.addColorStop(0.5, '#D0E8F0');
        gradient.addColorStop(1, '#B8DCE8');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Iceberg outline
        ctx.strokeStyle = '#A0C4D0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add some texture/details
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 5; i++) {
            const x = this.centerX + (Math.random() - 0.5) * this.baseRadiusX;
            const y = this.centerY + (Math.random() - 0.5) * this.baseRadiusY;
            if (this.isPointInside(x, y)) {
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

