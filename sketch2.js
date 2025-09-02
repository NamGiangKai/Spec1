// sketch2.js
const sketch2 = (p) => {
    // Biến toàn cục được đặt bên trong instance
    let resolution = 20;
    let cols, rows;
    let zoff = 0;
    let states = ['PULSE', 'VORTEX', 'CHAOS'];
    let currentState = 'PULSE';
    let lastStateChangeTime = 0;
    let stateDuration = 300;
    let time = 0;
    let myCentipede;

    let quoteBox = { x: 0, y: 0, w: 0, h: 0 };
    let isMouseOverQuote = false;

    // Biến âm thanh - Sử dụng sound2.js module
    let soundManager;
    let isMuted = true;
    let soundHasStarted = false;

    // Bộ đệm đồ họa
    let flowFieldGraphics;
    let pillarGraphics;
    let staticElementsGraphics; // Buffer cho các đối tượng tĩnh

    // Smoke effect variables
    const MAX_SMOKE_INSTANCES = 20; // GIỚI HẠN SỐ LƯỢNG HIỆU ỨNG KHÓI
    let smokeAnimations = []; // Mảng này sẽ chứa TẤT CẢ các hiệu ứng khói đang hoạt động
    let particles = [];
    let chars = "------------------";
    let smokeTime = 0; // Biến thời gian riêng cho khói để tránh xung đột
    let flowPaths = [];

    // Responsive variables
    let isMobile = false;
    let isTablet = false;
    let baseResolution = 20;
    let baseSegLength = 8;
    let baseNumSegments = 40;
    
    // Performance optimization variables
    let maxFPS = 60; // Always maintain 60fps
    let flowFieldUpdateFrequency = 1;
    let pillarUpdateFrequency = 1;
    let centipedeUpdateFrequency = 1;
    let performanceMode = false;
    
    // Advanced optimization variables
    let vectorPool = []; // Object pool for vectors
    let vectorPoolIndex = 0;
    let frameTimeTarget = 16.67; // Target 60fps (16.67ms per frame)
    let lastFrameTime = 0;
    let adaptiveQuality = 1.0; // Dynamic quality scaling
    let performanceHistory = [];
    let flowFieldCache = null; // Cache for flow field calculations
    let pillarCache = null; // Cache for pillar calculations

    // --- Object Pooling System ---
    function getVector(x = 0, y = 0) {
        if (vectorPool.length > vectorPoolIndex) {
            let v = vectorPool[vectorPoolIndex];
            v.set(x, y);
            vectorPoolIndex++;
            return v;
        } else {
            let v = p.createVector(x, y);
            vectorPool.push(v);
            vectorPoolIndex++;
            return v;
        }
    }
    
    function resetVectorPool() {
        vectorPoolIndex = 0;
    }
    
    // Performance monitoring and adaptive quality
    function updatePerformance() {
        let currentTime = performance.now();
        let frameTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        performanceHistory.push(frameTime);
        if (performanceHistory.length > 10) {
            performanceHistory.shift();
        }
        
        let avgFrameTime = performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length;
        
        // Adaptive quality scaling
        if (avgFrameTime > frameTimeTarget * 1.2) {
            adaptiveQuality = Math.max(0.5, adaptiveQuality - 0.05);
        } else if (avgFrameTime < frameTimeTarget * 0.8) {
            adaptiveQuality = Math.min(1.0, adaptiveQuality + 0.02);
        }
    }

    // --- Định nghĩa các lớp ---

    // Lớp Centipede
    class Centipede {
        constructor(x, y, numSegments, segLength, easing) {
            this.segments = [];
            this.legs = [];
            this.easing = easing;
            this.segLength = segLength;
            this.gaitPhase = 0;
            this.gaitTimer = 0;
            this.gaitDuration = 25;
            this.time = 0;
            this.headColor = p.color(255, 255, 255);

            for (let i = 0; i < numSegments; i++) {
                let scale = 1 - i / numSegments;
                scale = p.pow(scale, 1.5);
                let ribLen = this.segLength * 5.8 * scale;
                this.segments.push(new Segment(x, y, this.segLength, ribLen));
            }

            for (let i = 5; i < numSegments - 10; i += 7) {
                let scale = 1 - i / numSegments;
                scale = p.pow(scale, 1.2);
                let legReach = this.segLength * 6 * scale;
                this.legs.push(new Leg(this.segments[i], 1, legReach));
                this.legs.push(new Leg(this.segments[i], -1, legReach));
            }
        }

        update(target) {
            this.time++;
            this.segments[0].follow(target);
            this.segments[0].update(this.easing);
            
            // Optimize segment updates
            for (let i = 1; i < this.segments.length; i++) {
                this.segments[i].follow(this.segments[i - 1].pos);
                this.segments[i].update(this.easing);
            }
            
            this.gaitTimer++;
            if (this.gaitTimer > this.gaitDuration) {
                this.gaitTimer = 0;
                this.gaitPhase = 1 - this.gaitPhase;
                
                // Optimize leg updates - batch process
                for (let i = 0; i < this.legs.length; i++) {
                    let leg = this.legs[i];
                    if ((this.gaitPhase === 0 && leg.side === 1) || (this.gaitPhase === 1 && leg.side === -1)) {
                        leg.findNewTarget();
                    }
                }
            }
            
            // Optimize leg updates
            for (let i = 0; i < this.legs.length; i++) {
                this.legs[i].update();
            }
        }

        show() {
            for (const leg of this.legs) {
                leg.show();
            }
            for (let i = 0; i < this.segments.length - 1; i++) {
                this.segments[i].show(this.segments[i + 1]);
            }
            this.drawHead();
        }

        drawHead() {
            let head = this.segments[0];
            let neck = this.segments[1];
            let dir = p.createVector(head.pos.x - neck.pos.x, head.pos.y - neck.pos.y);
            p.push();
            p.translate(head.pos.x, head.pos.y);
            p.rotate(dir.heading());
            p.stroke(this.headColor);
            p.strokeWeight(1);
            let antennaAngle = p.sin(this.time * 0.1) * 0.25;
            p.line(0, 0, 15, -5 + antennaAngle * 15);
            p.line(0, 0, 15, 5 - antennaAngle * 15);
            p.fill(this.headColor);
            p.noStroke();
            p.beginShape();
            p.vertex(8, 0);
            p.vertex(-2, -5);
            p.vertex(-6, -3);
            p.vertex(-6, 3);
            p.vertex(-2, 5);
            p.endShape(p.CLOSE);
            p.fill(100, 100, 100);
            p.triangle(8, 0, 12, -4, 10, 0);
            p.triangle(8, 0, 12, 4, 10, 0);
            p.pop();
        }
    }

    class Segment {
        constructor(x, y, len, ribLength) {
            this.pos = p.createVector(x, y);
            this.target = p.createVector(x, y);
            this.len = len;
            this.ribLength = ribLength;
        }

        follow(targetPos) {
            let dir = p.createVector(this.pos.x - targetPos.x, this.pos.y - targetPos.y);
            dir.setMag(this.len);
            this.target = p.createVector(targetPos.x + dir.x, targetPos.y + dir.y);
        }

        update(easing) {
            this.pos.lerp(this.target, easing);
        }

        show(nextSegment) {
            p.stroke(255, 255, 255, 217);
            p.strokeWeight(1.5);
            p.line(this.pos.x, this.pos.y, nextSegment.pos.x, nextSegment.pos.y);
            let dir = p.createVector(this.pos.x - nextSegment.pos.x, this.pos.y - nextSegment.pos.y);
            p.push();
            p.translate(this.pos.x, this.pos.y);
            p.rotate(dir.heading());
            p.strokeWeight(1);
            let sweepBack = this.ribLength * 0.4;
            let halfRib = this.ribLength * 0.7;
            p.line(0, 0, -sweepBack, -halfRib);
            p.line(0, 0, -sweepBack, halfRib);
            p.pop();
        }
    }

    class Leg {
        constructor(parentSegment, side, reach) {
            this.parent = parentSegment;
            this.side = side;
            this.footPos = this.parent.pos.copy();
            this.targetPos = this.parent.pos.copy();
            this.kneePos = this.parent.pos.copy();
            this.reach = reach;
            this.upperLegLen = this.reach * 0.6;
            this.lowerLegLen = this.reach * 0.6;
            this.isStepping = true;
        }

        findNewTarget() {
            let bodyDir = p.createVector(this.parent.pos.x - this.parent.target.x, this.parent.pos.y - this.parent.target.y).normalize();
            let perpendicularDir = p.createVector(bodyDir.y, -bodyDir.x);
            let stepVector = bodyDir.mult(-this.reach * 0.75);
            stepVector.add(perpendicularDir.mult(this.side * this.reach * 0.5));
            this.targetPos = p.createVector(this.parent.pos.x + stepVector.x, this.parent.pos.y + stepVector.y);
            this.isStepping = true;
        }

        update() {
            if (this.isStepping) {
                this.footPos.lerp(this.targetPos, 0.1);
                if (distSqManual(this.footPos, this.targetPos) < 1) {
                    this.isStepping = false;
                }
            }
            
            let hip = this.parent.pos;
            let foot = this.footPos;
            
            // Optimize distance calculation
            let dx = foot.x - hip.x;
            let dy = foot.y - hip.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            d = Math.min(d, this.upperLegLen + this.lowerLegLen - 1);
            
            // Optimize inverse kinematics calculations
            let a = (d * d + this.upperLegLen * this.upperLegLen - this.lowerLegLen * this.lowerLegLen) / (2 * d);
            let h = Math.sqrt(Math.max(0, this.upperLegLen * this.upperLegLen - a * a));
            
            // Pre-calculate normalized direction
            let invD = 1 / d;
            let normalizedX = dx * invD;
            let normalizedY = dy * invD;
            
            let midPointX = hip.x + normalizedX * a;
            let midPointY = hip.y + normalizedY * a;
            
            // Optimize knee position calculation
            let kneeOffsetX = -normalizedY * h * this.side;
            let kneeOffsetY = normalizedX * h * this.side;
            
            this.kneePos.x = midPointX + kneeOffsetX;
            this.kneePos.y = midPointY + kneeOffsetY;
        }

        show() {
            p.stroke(255, 255, 255, 178);
            p.strokeWeight(1.5);
            p.line(this.parent.pos.x, this.parent.pos.y, this.kneePos.x, this.kneePos.y);
            p.line(this.kneePos.x, this.kneePos.y, this.footPos.x, this.footPos.y);
            this.drawHand();
        }

        drawHand() {
            p.push();
            p.translate(this.footPos.x, this.footPos.y);
            let dir = p.createVector(this.footPos.x - this.kneePos.x, this.footPos.y - this.kneePos.y);
            p.rotate(dir.heading());
            p.stroke(255, 255, 255, 178);
            p.strokeWeight(1);
            p.line(0, 0, -4, -3);
            p.line(0, 0, -4, 0);
            p.line(0, 0, -4, 3);
            p.pop();
        }
    }

    // Lớp TextParticle (MỚI)
    class TextParticle {
        constructor() {
            this.reset();
            this.noiseOffset = p.random(1000);
        }

        reset() {
            const pillarWidth = 200;
            this.pos = p.createVector(
                p.width / 2 + p.random(-pillarWidth / 2, pillarWidth / 2),
                p.random(p.height, p.height + 100) // Vị trí ở đáy
            );
            this.vel = p.createVector(0, p.random(-1, -3));
            this.size = p.random(6, 12);
            this.alpha = p.random(100, 255);
            this.life = p.random(200, 400);
            this.maxLife = this.life;
            this.char = p.random(chars.split(""));
        }

        update() {
            this.pos.add(this.vel);
            this.pos.x += p.sin(smokeTime + this.noiseOffset) * 0.5;
            let progress = (p.height - this.pos.y) / p.height; // Logic mới để đảo ngược hiệu ứng
            this.alpha = p.map(progress, 0, 1, 255, 30);
            this.size = p.map(progress, 0, 1, 12, 4);
            if (this.pos.y < -50) {
                // Điều kiện reset mới
                this.reset();
            }
            this.life--;
            if (this.life <= 0) {
                this.reset();
            }
        }

        show() {
            p.fill(255, this.alpha);
            p.textSize(this.size);
            p.text(this.char, this.pos.x, this.pos.y);
        }
    }

    // Function to detect device type and set responsive parameters
    function updateResponsiveParams() {
        const width = p.width;
        const height = p.height;
        
        // Detect device type
        isMobile = width < 768;
        isTablet = width >= 768 && width < 1024;
        
        // Adjust settings for 60fps on all devices with smart optimizations
        if (isMobile) {
            resolution = Math.max(30, Math.floor(width / 18)); // Optimized for 60fps
            baseNumSegments = 25; // Balanced for smooth animation
            baseSegLength = 6;
            performanceMode = true;
            // Use adaptive quality instead of fixed frame skipping
        } else if (isTablet) {
            resolution = Math.max(25, Math.floor(width / 20));
            baseNumSegments = 32;
            baseSegLength = 7;
            performanceMode = true;
        } else {
            resolution = baseResolution;
            baseNumSegments = 40;
            baseSegLength = 8;
            performanceMode = false;
        }
        
        // Always target 60fps
        maxFPS = 60;
        flowFieldUpdateFrequency = 1;
        pillarUpdateFrequency = 1;
        centipedeUpdateFrequency = 1;
        
        // Update cols and rows
        cols = p.floor(width / resolution);
        rows = p.floor(height / resolution);
        
        // Recreate centipede with new parameters
        if (myCentipede) {
            myCentipede = new Centipede(width / 2, height / 2, baseNumSegments, baseSegLength, 0.1);
        }
        
        // Recreate graphics buffers
        if (flowFieldGraphics) {
            flowFieldGraphics = p.createGraphics(width, height);
        }
        if (pillarGraphics) {
            pillarGraphics = p.createGraphics(width, height);
        }
    }

    p.setup = () => {
        let canvasContainer = p.select('#p5-centipede-canvas');
        if (!canvasContainer || !canvasContainer.elt) {
            console.error('Canvas container not found');
            return;
        }
        
        // Get container dimensions
        let containerWidth = canvasContainer.width;
        let containerHeight = canvasContainer.height;
        
        // Create canvas with container dimensions
        let canvas = p.createCanvas(containerWidth, containerHeight);
        canvas.parent('p5-centipede-canvas');
        
        // Set responsive parameters
        updateResponsiveParams();
        
        // Create centipede with responsive parameters
        myCentipede = new Centipede(p.width / 2, p.height / 2, baseNumSegments, baseSegLength, 0.1);
        
        // Create graphics buffers
        flowFieldGraphics = p.createGraphics(p.width, p.height);
        pillarGraphics = p.createGraphics(p.width, p.height);
        staticElementsGraphics = p.createGraphics(p.width, p.height);
        
        // Initialize smoke effects
        p.textFont("Source Code Pro");
        p.textAlign(p.CENTER, p.CENTER);
        
        createFlowPaths(); // Tạo các đường dẫn cho khói
        for (let i = 0; i < 100; i++) {
            particles.push(new TextParticle()); // Tạo các hạt khói
        }
        
        drawStaticElements(); // Draw static factory elements
        
        // Performance settings
        p.frameRate(maxFPS);
        p.disableFriendlyErrors = true;
        
        // Load assets using sound2.js module
        loadAssets();
        

    };

    p.windowResized = () => {
        // Debounce resize events for better performance
        clearTimeout(window.centipedeResizeTimeout);
        window.centipedeResizeTimeout = setTimeout(() => {
            // Get container dimensions
            let canvasContainer = p.select('#p5-centipede-canvas');
            if (canvasContainer && canvasContainer.elt) {
                let containerWidth = canvasContainer.width;
                let containerHeight = canvasContainer.height;
                
                // Resize canvas to container
                p.resizeCanvas(containerWidth, containerHeight);
                
                // Update responsive parameters
                updateResponsiveParams();
                
                // Set new frame rate
                p.frameRate(maxFPS);
                
                // Clear graphics buffers to force refresh
                if (flowFieldGraphics) {
                    flowFieldGraphics = p.createGraphics(p.width, p.height);
                }
                if (pillarGraphics) {
                    pillarGraphics = p.createGraphics(p.width, p.height);
                }
                if (staticElementsGraphics) {
                    staticElementsGraphics = p.createGraphics(p.width, p.height);
                    drawStaticElements(); // Redraw static elements
                }
                
                createFlowPaths(); // Recreate flow paths for new size
            }
        }, 100); // 100ms debounce
    };

    p.draw = () => {
        // Performance monitoring and adaptive quality
        updatePerformance();
        resetVectorPool(); // Reset object pool each frame
        
        p.background(0, 40);
        
        // Display static elements buffer
        p.image(staticElementsGraphics, 0, 0);
        
        // Adaptive rendering based on performance
        let shouldUpdateFlowField = true;
        let shouldUpdatePillar = true;
        
        if (performanceMode && adaptiveQuality < 0.8) {
            // Skip some updates when performance is low
            shouldUpdateFlowField = p.frameCount % 2 === 0;
            shouldUpdatePillar = p.frameCount % 3 === 0;
        }
        
        if (shouldUpdateFlowField) {
            p.drawFlowField();
        }
        if (shouldUpdatePillar) {
            p.drawPillarAndSmoke(); // Updated function name
        }
        
        p.image(flowFieldGraphics, 0, 0);
        p.image(pillarGraphics, 0, 0);
        
        // Update centipede with mouse or touch position
        let targetX = p.mouseX;
        let targetY = p.mouseY;
        
        // Handle touch events for mobile
        if (p.touches && p.touches.length > 0) {
            targetX = p.touches[0].x;
            targetY = p.touches[0].y;
        }
        
        // Update centipede with performance optimization
        if (p.frameCount % centipedeUpdateFrequency === 0) {
            myCentipede.update(p.createVector(targetX, targetY));
        }
        myCentipede.show();
        
        // Reduce text rendering frequency on mobile
        if (!performanceMode || p.frameCount % 2 === 0) {
            p.drawQuote();
            p.checkHover();
        }

        // Vẽ nút mute/unmute với responsive positioning
        let muteButtonSize = isMobile ? 40 : 50;
        let muteButtonX = isMobile ? 15 : 20;
        let muteButtonY = isMobile ? 15 : 20;
        
        if (isMuted) {
            if (soundManager && soundManager.muteIcon) {
                p.image(soundManager.muteIcon, muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);
            }
        } else {
            if (soundManager && soundManager.unmuteIcon) {
                p.image(soundManager.unmuteIcon, muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);
            }
        }
        time += 0.005; // Cập nhật thời gian cho con rết
        smokeTime += 0.02; // Cập nhật thời gian cho khói
        
        // Performance monitoring for debugging
        if (p.frameCount % 120 === 0) {
            let avgFrameTime = performanceHistory.length > 0 ? 
                performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length : 0;
            console.log(`FPS: ${p.frameRate().toFixed(1)}, Quality: ${(adaptiveQuality * 100).toFixed(0)}%, Frame Time: ${avgFrameTime.toFixed(1)}ms, Grid: ${cols}x${rows}`);
        }
    };

    p.mousePressed = () => {
        // Check if click is within canvas bounds
        let canvasElement = document.getElementById('p5-centipede-canvas');
        if (!canvasElement) return;
        
        let rect = canvasElement.getBoundingClientRect();
        let mouseX = p.mouseX;
        let mouseY = p.mouseY;
        
        // Only process clicks within canvas area
        if (mouseX < 0 || mouseX > p.width || mouseY < 0 || mouseY > p.height) {
            return; // Click is outside canvas, ignore it
        }
        
        // Check if click is on mute button with responsive positioning
        let muteButtonSize = isMobile ? 40 : 50;
        let muteButtonX = isMobile ? 15 : 20;
        let muteButtonY = isMobile ? 15 : 20;
        
        // Lần nhấn chuột đầu tiên (bất cứ đâu trong canvas) để BẮT ĐẦU âm thanh
        if (!soundHasStarted) {
            if (soundManager && soundManager.testSound && soundManager.testSound.isLoaded()) {
                p.userStartAudio(); // Kích hoạt Audio Context
                soundManager.playTestSound();
                isMuted = false; // Bỏ tắt tiếng
                soundManager.testSound.setVolume(1);
                soundHasStarted = true; // Đánh dấu là âm thanh đã bắt đầu
            }
            return;
        }
        
        // Các lần nhấn chuột SAU ĐÓ chỉ để BẬT/TẮT tiếng khi nhấn vào icon
        if (mouseX > muteButtonX && mouseX < muteButtonX + muteButtonSize && 
            mouseY > muteButtonY && mouseY < muteButtonY + muteButtonSize) {
            isMuted = !isMuted; // Đảo ngược trạng thái
            if (soundManager && soundManager.testSound && soundManager.testSound.isLoaded()) {
                soundManager.testSound.setVolume(isMuted ? 0 : 1);
            }
        } else {
            // Only create smoke effects if click is within canvas and not on button
            // --- BẮT ĐẦU TỐI ƯU HÓA ---
            // Nếu số lượng hiệu ứng trong mảng đã đạt hoặc vượt quá giới hạn
            if (smokeAnimations.length >= MAX_SMOKE_INSTANCES) {
                // .shift() sẽ xóa phần tử đầu tiên (cũ nhất) ra khỏi mảng
                smokeAnimations.shift(); 
            }
            // --- KẾT THÚC TỐI ƯU HÓA ---

            let newSmokeInstancePaths = createFlowPaths();
            smokeAnimations.push({ 
                paths: newSmokeInstancePaths, 
                revealCount: 0
            });
            
            // Phát âm thanh click nếu không bị tắt tiếng
            if (!isMuted && soundManager) {
                soundManager.playClickSound();
            }
        }
    };
    
    // Handle touch events for mobile
    p.touchStarted = (event) => {
        // Only handle touch if it's within canvas bounds and not a scroll gesture
        let canvasElement = document.getElementById('p5-centipede-canvas');
        if (!canvasElement) return;
        
        let rect = canvasElement.getBoundingClientRect();
        let touch = event.touches ? event.touches[0] : event;
        let touchX = touch.clientX - rect.left;
        let touchY = touch.clientY - rect.top;
        
        // Scale touch coordinates to canvas coordinates
        let scaleX = p.width / canvasElement.clientWidth;
        let scaleY = p.height / canvasElement.clientHeight;
        touchX *= scaleX;
        touchY *= scaleY;
        
        // Only process touches within canvas area
        if (touchX < 0 || touchX > p.width || touchY < 0 || touchY > p.height) {
            return; // Touch is outside canvas, allow default behavior
        }
        
        // Check if touch is on mute button - only prevent default for button interactions
        let muteButtonSize = isMobile ? 40 : 50;
        let muteButtonX = isMobile ? 15 : 20;
        let muteButtonY = isMobile ? 15 : 20;
        
        if (touchX > muteButtonX && touchX < muteButtonX + muteButtonSize && 
            touchY > muteButtonY && touchY < muteButtonY + muteButtonSize) {
            p.mousePressed();
            return false; // Only prevent default for button interactions
        }
        
        // For canvas touches (not on button), create smoke effects but allow scrolling
        p.mousePressed();
        // Don't return false - allow default touch behavior for scrolling
    };
    
    p.keyPressed = () => {
        if (p.key === 'p' || p.key === 'P') {
            if (!soundHasStarted) {
                p.userStartAudio();
                soundHasStarted = true;
            }
            if (soundManager && soundManager.testSound && soundManager.testSound.isLoaded()) {
                if (soundManager.testSound.isPlaying()) {
                    soundManager.stopTestSound();
                } else {
                    soundManager.playTestSound();
                    soundManager.testSound.setVolume(isMuted ? 0 : 1);
                }
            }
        }
        if (p.key === 'm' || p.key === 'M') {
            isMuted = !isMuted;
            if (soundManager && soundManager.testSound && soundManager.testSound.isLoaded() && soundManager.testSound.isPlaying()) {
                soundManager.testSound.setVolume(isMuted ? 0 : 1);
            }
        }
    };
    
    // Function to draw static elements
    function drawStaticElements() {
        // Vẽ vào bộ đệm staticElementsGraphics
        staticElementsGraphics.clear();
        drawFactory(staticElementsGraphics); // Truyền bộ đệm vào hàm
        addPillarShading(staticElementsGraphics); // Truyền bộ đệm vào hàm
    }
    
    // --- HÀM MỚI ĐƯỢC THÊM VÀO TỪ CODE CITYSCAPE ---
    function drawFactory(pg) {
        const horizonY = pg.height * 0.8;
        const bottomY = pg.height;

        pg.fill(40, 40, 43, 40);
        pg.noStroke();

        const w = pg.width;
        pg.beginShape();
        pg.vertex(0, bottomY);
        pg.vertex(0, horizonY);
        pg.vertex(w * 0.02, horizonY);
        pg.vertex(w * 0.02, horizonY - 40);
        pg.vertex(w * 0.045, horizonY - 40);
        pg.vertex(w * 0.05, horizonY - 54);
        pg.vertex(w * 0.0725, horizonY - 60);
        pg.vertex(w * 0.095, horizonY - 54);
        pg.vertex(w * 0.1, horizonY - 40);
        pg.vertex(w * 0.115, horizonY - 40);
        pg.vertex(w * 0.12, horizonY - 54);
        pg.vertex(w * 0.1425, horizonY - 60);
        pg.vertex(w * 0.165, horizonY - 54);
        pg.vertex(w * 0.17, horizonY - 40);
        pg.vertex(w * 0.1875, horizonY - 40);
        pg.vertex(w * 0.1875, horizonY - 60);
        pg.vertex(w * 0.2375, horizonY - 60);
        pg.vertex(w * 0.2375, horizonY - 40);
        pg.vertex(w * 0.2575, horizonY - 40);
        pg.vertex(w * 0.2575, horizonY - 68);
        pg.vertex(w * 0.2775, horizonY - 68);
        pg.vertex(w * 0.2775, horizonY - 40);
        pg.vertex(w * 0.295, horizonY - 40);
        pg.vertex(w * 0.3, horizonY - 80);
        pg.vertex(w * 0.3125, horizonY - 104);
        pg.vertex(w * 0.3325, horizonY - 98);
        pg.vertex(w * 0.3425, horizonY - 40);
        pg.vertex(w * 0.3575, horizonY - 40);
        pg.vertex(w * 0.3575, horizonY - 60);
        pg.vertex(w * 0.3825, horizonY - 60);
        pg.vertex(w * 0.3825, horizonY - 40);
        pg.vertex(w * 0.4025, horizonY - 40);
        pg.vertex(w * 0.425, horizonY - 60);
        pg.vertex(w * 0.4625, horizonY - 60);
        pg.vertex(w * 0.4625, horizonY - 120);
        pg.vertex(w * 0.4775, horizonY - 120);
        pg.vertex(w * 0.4775, horizonY - 60);
        pg.vertex(w * 0.4975, horizonY - 60);
        pg.vertex(w * 0.4975, horizonY - 138);
        pg.vertex(w * 0.5275, horizonY - 138);
        pg.vertex(w * 0.5275, horizonY - 60);
        
        pg.vertex(w * 0.885, horizonY - 40);
        pg.vertex(w * 0.905, horizonY - 40);
        pg.vertex(w * 0.905, horizonY - 88);
        pg.vertex(w * 0.955, horizonY - 88);
        pg.vertex(w * 0.955, horizonY - 40);
        pg.vertex(w * 0.975, horizonY - 40);
        pg.vertex(w * 0.975, horizonY - 68);
        pg.vertex(w * 0.9975, horizonY - 68);
        pg.vertex(w * 0.9975, horizonY - 40);
        pg.vertex(w, horizonY);
        pg.vertex(w, bottomY);
        pg.endShape(p.CLOSE);
    }
    
    // Smoke effect functions
    function createFlowPaths() {
        let newPaths = []; // Tạo một mảng cục bộ cho hiệu ứng mới này
        const pillarWidth = 120;
        for (let pathIndex = 0; pathIndex < 10; pathIndex++) {
            let path = [];
            let startX = p.random(-pillarWidth * 0.45, pillarWidth * 0.45);
            let endX = p.random(-pillarWidth * 0.15, pillarWidth * 0.15);
            for (let y = p.height; y >= -100; y -= 8) {
                let progress = y / p.height;
                let x = p.lerp(startX, endX, progress);
                let curveOffset = p.sin(progress * p.PI * 2 + pathIndex * 0.5) * 30;
                x += curveOffset;
                let noiseOffset = p.noise(pathIndex * 100, y * 0.01, smokeTime) * 20;
                x += noiseOffset;
                path.push({ x: x + p.width / 2, y: y - 50, density: 1 - progress * 0.3 });
            }
            // Thêm vào mảng cục bộ
            newPaths.push({
                points: path,
                speed: p.random(0.8, 2.5),
                offset: p.random(p.TWO_PI),
                density: p.random(0.4, 0.9),
            });
        }
        return newPaths; // Trả về bộ đường dẫn vừa tạo
    }
    
    function updateFlowPaths() {
        for (let i = smokeAnimations.length - 1; i >= 0; i--) {
            const smokeInstance = smokeAnimations[i];
            let isInstanceFinished = true;

            // --- BẮT ĐẦU SỬA ĐỔI ---
            // Tăng dần số lượng ký tự được vẽ để tạo hiệu ứng "mọc" lên
            // Tốc độ "mọc" có thể điều chỉnh bằng cách thay đổi giá trị cộng thêm (ví dụ: 1.5, 2)
            smokeInstance.revealCount += 1; 
            // --- KẾT THÚC SỬA ĐỔI ---

            for (const path of smokeInstance.paths) {
                for (const point of path.points) {
                    point.y -= path.speed;
                }
                
                // Truyền revealCount vào hàm vẽ
                drawTextAlongPath(path, smokeInstance.revealCount);

                if (path.points[0].y > -100) {
                    isInstanceFinished = false;
                }
            }

            if (isInstanceFinished) {
                smokeAnimations.splice(i, 1);
            }
        }
    }
    
    function drawTextAlongPath(path, revealCount) { // Thêm tham số revealCount
        let charIndex = 0;
        
        // --- BẮT ĐẦU SỬA ĐỔI ---
        // Giới hạn vòng lặp để chỉ vẽ các điểm đã được "tiết lộ"
        const pointsToDraw = p.min(path.points.length, revealCount);
        for (let i = 0; i < pointsToDraw; i += 2) { 
        // --- KẾT THÚC SỬA ĐỔI ---
            let point = path.points[i];
            
            let progress = (p.height - point.y) / p.height;
            let alpha = p.map(progress, 0, 1, 255, 30);
            alpha *= path.density;
            let size = p.map(progress, 0, 1, 14, 6);
            let char = chars[charIndex % chars.length];
            let xOffset = p.sin(smokeTime + path.offset + i * 0.1) * 5;
            let yOffset = p.cos(smokeTime + path.offset + i * 0.1) * 3;
            p.noStroke();
            p.fill(255, alpha); 
            p.textSize(size);
            p.text(char, point.x + xOffset, point.y + yOffset);
            charIndex++;
        }
    }
    
    p.drawPillarAndSmoke = () => {
        pillarGraphics.clear();
        updateFlowPaths(); 
    };
    
    // ... (Các hàm phụ trợ còn lại)
    p.checkHover = () => {
        let wasMouseOver = isMouseOverQuote;
        isMouseOverQuote = (p.mouseX > quoteBox.x && p.mouseX < quoteBox.x + quoteBox.w &&
                            p.mouseY > quoteBox.y && p.mouseY < quoteBox.y + quoteBox.h);
        // Phát âm thanh hover nếu không bị tắt tiếng
        if (isMouseOverQuote && !wasMouseOver && !isMuted && soundManager) {
            soundManager.playHoverSound();
        }
    };
    
    p.drawFlowField = () => {
        if (p.frameCount - lastStateChangeTime > stateDuration) {
            let nextState = p.random(states);
            while (nextState === currentState) {
                nextState = p.random(states);
            }
            currentState = nextState;
            lastStateChangeTime = p.frameCount;
            stateDuration = p.random(300, 600);
        }
        let timeIncrement, noiseScale, baseAlpha, lineLength, angleMultiplier;
        if (currentState === 'PULSE') {
            let beat = p.sin(p.frameCount / 35.0);
            timeIncrement = p.map(beat, -1, 1, 0.002, 0.02);
            noiseScale = p.map(beat, -1, 1, 0.02, 0.1);
            let volume = p.map(beat, -1, 1, 0.5, 1);
            if(soundManager && soundManager.testSound && soundManager.testSound.isLoaded()) {
                soundManager.testSound.setVolume(volume);
            }
            baseAlpha = p.map(beat, -1, 1, 50, 255);
            lineLength = p.map(beat, -1, 1, 15, 30);
            angleMultiplier = 4;
        } else if (currentState === 'VORTEX') {
            timeIncrement = 0.01;
            noiseScale = 0.1;
            baseAlpha = 150;
            lineLength = 10;
            angleMultiplier = 2;
        } else if (currentState === 'CHAOS') {
            timeIncrement = 0.05;
            noiseScale = p.random(0.1, 0.5);
            baseAlpha = p.random(100, 255);
            lineLength = p.random(10, 40);
            angleMultiplier = 8;
        }
        zoff += timeIncrement;
        flowFieldGraphics.clear();
        flowFieldGraphics.strokeWeight(1.5);
        const w_half = p.width / 2;
        const h_half = p.height / 2;
        
        // Adaptive quality for flow field density
        let qualityStepSize = Math.max(1, Math.floor(2 - adaptiveQuality));
        let effectiveRows = Math.floor(rows / qualityStepSize);
        let effectiveColumns = Math.floor(cols / qualityStepSize);
        
        // Pre-calculate common values
        let halfResolution = resolution / 2;
        let invWHalf = 1 / w_half;
        
        // Batch rendering for better performance
        flowFieldGraphics.beginShape(p.LINES);
        
        for (let y = 0; y < effectiveRows; y++) {
            let actualY = y * qualityStepSize;
            let gridY = actualY * resolution + halfResolution;
            
            for (let x = 0; x < effectiveColumns; x++) {
                let actualX = x * qualityStepSize;
                let gridX = actualX * resolution + halfResolution;
                
                // Optimized noise calculation
                let noiseAngle = p.noise(actualX * noiseScale, actualY * noiseScale, zoff) * p.TWO_PI * angleMultiplier;
                let finalAngle = noiseAngle;
                
                if (currentState === 'VORTEX') {
                    let dx = w_half - gridX;
                    let dy = h_half - gridY;
                    finalAngle = Math.atan2(dy, dx) + p.HALF_PI + noiseAngle * 0.5;
                }
                
                // Pre-calculate trigonometric values
                let cosAngle = Math.cos(finalAngle);
                let sinAngle = Math.sin(finalAngle);
                
                // Optimized distance and alpha calculation
                let dx = gridX - w_half;
                let dy = gridY - h_half;
                let distSq = dx * dx + dy * dy;
                let edgeAlpha = Math.max(0, 1 - Math.sqrt(distSq) * invWHalf);
                let finalAlpha = baseAlpha * edgeAlpha * adaptiveQuality;
                
                if (finalAlpha > 10) { // Skip very transparent lines
                    flowFieldGraphics.stroke(255, 20, 20, finalAlpha);
                    flowFieldGraphics.line(gridX, gridY, 
                                         gridX + cosAngle * lineLength, 
                                         gridY + sinAngle * lineLength);
                }
            }
        }
        
        flowFieldGraphics.endShape();
    };
    
    p.drawPillar = () => {
        pillarGraphics.clear();
        pillarGraphics.noFill();
        pillarGraphics.stroke(0, 0, 0);
        pillarGraphics.strokeWeight(2);
        
        // Responsive pillar sizing
        const pillarWidth = isMobile ? 120 : isTablet ? 160 : 200;
        const pillarRadius = pillarWidth / 2;
        const pillarCenterX = p.width / 2;
        
        // Adaptive pillar rendering based on performance
        let radiusStep = Math.max(0.015, 0.035 - (adaptiveQuality * 0.02));
        let circleResolution = Math.floor(12 + (adaptiveQuality * 8));
        let smoothingIterations = Math.floor(2 + (adaptiveQuality * 2));
        
        // Pre-calculate common values
        let heightScale = p.height;
        let angleRange = p.PI;
        let angleOffset = -p.HALF_PI;
        
        for (let radius = 0.05; radius < 0.7; radius += radiusStep) {
            const circle = makeCircle(circleResolution, radius);
            const distortedCircle = distortPolygon(circle, time);
            const smoothCircle = chaikin(distortedCircle, smoothingIterations);
            
            pillarGraphics.beginShape();
            
            // Optimized vertex calculations with pre-computed values
            for (let i = 0; i < smoothCircle.length; i++) {
                let point = smoothCircle[i];
                let angle = angleOffset + (point[0] * angleRange);
                let screenX = pillarCenterX + Math.sin(angle) * pillarRadius;
                let screenY = point[1] * heightScale;
                pillarGraphics.vertex(screenX, screenY);
            }
            pillarGraphics.endShape(p.CLOSE);
        }
        addPillarShading(pillarGraphics);
    };
    
    function distSqManual(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return dx * dx + dy * dy;
    }
    
    function makeCircle(numSides, radius) {
        const points = [];
        const radiansPerStep = (p.PI * 2) / numSides;
        for (let theta = 0; theta < p.PI * 2; theta += radiansPerStep) {
            const x = 0.5 + radius * p.cos(theta);
            const y = 0.5 + radius * p.sin(theta);
            points.push([x, y]);
        }
        return points;
    }
    
    function distortPolygon(polygon, t) {
        return polygon.map(point => {
            const x = point[0];
            const y = point[1];
            const distance = p.dist(0.5, 0.5, x, y);
            const z = t * 0.2;
            const z2 = t * 0.5;
            const noiseFn = (x, y) => {
                const noiseX = (x + 0.31 + t * 1.5) * distance * 2 + z2;
                const noiseY = (y - 1.73) * distance * 2 + z2;
                return p.noise(noiseX, noiseY, z);
            };
            const theta = noiseFn(x, y) * p.PI * 3;
            const amountToNudge = 0.08;
            const newX = x + (amountToNudge * p.cos(theta));
            const newY = y + (amountToNudge * p.sin(theta));
            return [newX, newY];
        });
    }
    
    function chaikin(arr, num) {
        if (num === 0) return arr;
        let currentArr = arr;
        for (let i = 0; i < num; i++) {
            const l = currentArr.length;
            const smooth = [];
            for (let j = 0; j < l; j++) {
                const c = currentArr[j];
                const next = currentArr[(j + 1) % l];
                smooth.push([0.75 * c[0] + 0.25 * next[0], 0.75 * c[1] + 0.25 * next[1]]);
                smooth.push([0.25 * c[0] + 0.75 * next[0], 0.25 * c[1] + 0.75 * next[1]]);
            }
            currentArr = smooth;
        }
        return currentArr;
    }
    
    function addPillarShading(pg, x, w) {
        // If x and w are not provided, use default pillar dimensions
        if (x === undefined || w === undefined) {
            const pillarWidth = isMobile ? 120 : isTablet ? 160 : 200;
            const pillarCenterX = pg.width / 2;
            x = pillarCenterX - pillarWidth / 2;
            w = pillarWidth;
        }
        
        pg.noStroke();
        let shadowWidth = isMobile ? 60 : isTablet ? 90 : 120;
        for (let i = 0; i < shadowWidth; i++) {
            let alpha = p.map(i, 0, shadowWidth, 180, 0);
            pg.fill(0, alpha);
            pg.rect(x + i, 0, 1, pg.height);
            pg.rect(x + w - 1 - i, 0, 1, pg.height);
        }
        let highlightWidth = isMobile ? 20 : isTablet ? 30 : 40;
        for (let i = 0; i < highlightWidth; i++) {
            let alpha = p.map(i, 0, highlightWidth, 40, 0);
            pg.fill(222, alpha);
            pg.rect(x + w / 9 - i, 0, 1, pg.height);
            pg.rect(x + w / 8 + i, 0, 1, pg.height);
            pg.rect(x + w / 7 + i, 0, 1, pg.height);
            pg.rect(x + w / 2 + i, 0, 1, pg.height);
        }
    }
    
    p.drawQuote = () => {
        p.noStroke();
        let textCol = p.color(255); // Using white since bgColor is not defined in this sketch
        p.fill(textCol);
        
        // Responsive positioning and sizing
        let maxWidth, x, y;
        
        if (isMobile) {
            // Mobile layout - centered and smaller
            maxWidth = p.width * 0.85;
            x = (p.width - maxWidth) / 2;
            y = p.height * 0.1;
        } else if (isTablet) {
            // Tablet layout - right side but smaller
            maxWidth = p.width * 0.4;
            x = p.width - maxWidth - 20;
            y = p.height * 0.08;
        } else {
            // Desktop layout - original positioning
            maxWidth = 400;
            x = 1200;
            y = 80;
            
            // Adjust position when screen is too small to prevent text cutoff
            if (p.width < 1600) {
                x = p.width - 420; // Keep text fully visible
                if (x < 20) x = 20; // Don't go off left edge
            }
        }
        
        // Responsive text sizes
        let mainTextSize, attributionSize, callToActionSize;
        
        if (isMobile) {
            mainTextSize = 14;
            attributionSize = 10;
            callToActionSize = 12;
        } else if (isTablet) {
            mainTextSize = 16;
            attributionSize = 11;
            callToActionSize = 13;
        } else {
            mainTextSize = p.width > 1200 ? 17 : p.width > 800 ? 15 : 13;
            attributionSize = p.width > 1200 ? 12 : p.width > 800 ? 11 : 10;
            callToActionSize = p.width > 1200 ? 15 : p.width > 800 ? 14 : 12;
        }
        
        // Quote and attribution removed
        
        p.textSize(callToActionSize);
        p.fill("#EB0000");
        p.textStyle(p.BOLD);
        let callToAction = "Cut the fumes, not our breath.";
        p.text(callToAction, x + 20, y + 300, maxWidth);
        
        // Additional safety check to prevent text cutoff
        if (x + maxWidth > p.width - 20) {
            maxWidth = p.width - x - 20;
        }
        
        // Update quoteBox for hover detection (keeping the existing functionality)
        const tw = p.textWidth(callToAction);
        const th = p.textAscent() + p.textDescent();
        quoteBox.x = x + 20;
        quoteBox.y = y + 300 - th;
        quoteBox.w = maxWidth;
        quoteBox.h = th;
    };

    // Function to load assets - Sử dụng sound2.js module
    function loadAssets() {
        // Initialize sound manager using sound2.js module
        soundManager = soundModule(p);
        soundManager.loadAssets();
        

        
        // Check loading status after a delay
        setTimeout(() => {
            if (soundManager) {
                const status = soundManager.getLoadingStatus();

            }
        }, 3000);
    }
};

// Khởi tạo sketch sau khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    new p5(sketch2, 'p5-centipede-canvas');
});
