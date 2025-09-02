// Performance monitoring script for the webpage
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameTimes = [];
        this.maxFrameTimeHistory = 60;
        
        this.init();
    }
    
    init() {
        // Create performance display
        this.createDisplay();
        
        // Start monitoring
        this.monitor();
    }
    
    createDisplay() {
        this.display = document.createElement('div');
        this.display.id = 'performance-monitor';
        this.display.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            pointer-events: none;
            user-select: none;
        `;
        
        document.body.appendChild(this.display);
    }
    
    monitor() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.frameCount++;
        this.frameTimes.push(deltaTime);
        
        // Keep only recent frame times
        if (this.frameTimes.length > this.maxFrameTimeHistory) {
            this.frameTimes.shift();
        }
        
        // Calculate FPS
        if (deltaTime > 0) {
            this.fps = 1000 / deltaTime;
        }
        
        // Calculate average frame time
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        
        // Update display
        this.updateDisplay(this.fps, avgFrameTime, this.frameCount);
        
        this.lastTime = currentTime;
        
        // Continue monitoring
        requestAnimationFrame(() => this.monitor());
    }
    
    updateDisplay(fps, avgFrameTime, frameCount) {
        this.display.innerHTML = `
            <div>FPS: ${fps.toFixed(1)}</div>
            <div>Avg Frame: ${avgFrameTime.toFixed(2)}ms</div>
            <div>Frames: ${frameCount}</div>
            <div>Memory: ${this.getMemoryUsage()}</div>
        `;
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
            const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
            return `${used}MB / ${total}MB`;
        }
        return 'N/A';
    }
    
    destroy() {
        if (this.display && this.display.parentNode) {
            this.display.parentNode.removeChild(this.display);
        }
    }
}

// Initialize performance monitor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only show in development/debug mode
    if (window.location.search.includes('debug=true') || window.location.hostname === 'localhost') {
        window.performanceMonitor = new PerformanceMonitor();
    }
});

