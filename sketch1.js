// --- BẮT ĐẦU INSTANCE MODE ---
const sketch1 = (p) => {
    // --- Các biến toàn cục ---
    let cols, rows; // Grid dimensions
    let size = 20; // Cell size
    let grid = []; // Field values for Marching Squares
    let circles = []; // Moving blobs
    let num; // Number of blobs
    let pixelPixels = []; // Coordinates along contour
    let bgColor, contourColor; // Background and contour colors
    let sound;
    let isMuted = true; // Bắt đầu ở trạng thái tắt tiếng, lần click đầu tiên sẽ bật lên
    let soundHasStarted = false; // Biến mới để theo dõi trạng thái bắt đầu của âm thanh
    let muteIcon, unmuteIcon;
    let peelSound;
    let lightningSound;
    let lightningHurtSound;

    let lightningImgs = [];
    let activeLightnings = [];
    let scarSquares = []; // Squares for the "peel" effect

    // ---- responsive scaling ----
    let scaleUI = 1; // relative to 1920x1080
    
    // Responsive variables
    let isMobile = false;
    let isTablet = false;
    let baseSize = 20;
    let baseNum = 55;
    
    // Performance optimization variables
    let frameSkip = 0;
    let maxFPS = 60; // Always maintain 60fps
    let gridUpdateFrequency = 1;
    let particleReductionFactor = 1;
    let contourCache = [];
    let lastContourUpdate = 0;
    
    // Advanced optimization variables
    let frameTimeTarget = 16.67; // Target 60fps
    let lastFrameTime = 0;
    let adaptiveQuality = 1.0;
    let performanceHistory = [];
    let gridCache = null;

    function detectDeviceType() {
        const width = p.width;
        const height = p.height;
        
        isMobile = width < 768;
        isTablet = width >= 768 && width < 1024;
        
        // Optimize for 60fps on all devices with adaptive quality
        if (isMobile) {
            baseSize = 28; // Optimized for 60fps
            baseNum = 35; // Balanced for smooth animation
            particleReductionFactor = 0.7; // Better particle density
        } else if (isTablet) {
            baseSize = 22;
            baseNum = 45;
            particleReductionFactor = 0.85;
        } else {
            baseSize = 20;
            baseNum = 55;
            particleReductionFactor = 1;
        }
        
        // Always target 60fps with adaptive quality
        maxFPS = 60;
        gridUpdateFrequency = 1;
    }

    function recomputeLayout() {
        const baseW = 1920, baseH = 1080;
        scaleUI = Math.min(p.width / baseW, p.height / baseH);
        
        detectDeviceType();
        
        // Responsive cell size - keep exact desktop size, just scale with screen
        size = baseSize * scaleUI; // Always use exact desktop proportions
        size = Math.max(8, Math.min(size, 25)); // Keep reasonable bounds
        
        // Responsive number of circles - keep exact desktop density, just scale with screen area
        let areaRatio = (p.width * p.height) / (baseW * baseH);
        num = Math.round(baseNum * areaRatio); // Always use exact desktop proportions
        num = Math.max(20, Math.min(num, 80)); // Keep reasonable bounds
        
        // Responsive spread radius - keep exact desktop proportions, just scale with screen
        spreadRadius = 30 * scaleUI; // Always use exact desktop proportions
        spreadRadius = Math.max(15, Math.min(spreadRadius, 40)); // Keep reasonable bounds
        

    }


    p.setup = () => {
        let canvasContainer = p.select('#p5-canvas-container');

        
        let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
        canvas.parent('p5-canvas-container');
        


        // Giữ lại các cơ chế tải an toàn và gỡ lỗi của bạn
        loadSoundSafely();

        p.loadImage("mute.png", (img) => {
            muteIcon = img;
        });
        p.loadImage("unmute.png", (img) => {
            unmuteIcon = img;
        });

        // Load additional sounds
        p.loadSound('peelcombine.wav', 
            (loadedSound) => { peelSound = loadedSound; },
            (error) => { console.log("Failed to load peel sound:", error); }
        );
        p.loadSound('lightningcombine.wav', 
            (loadedSound) => { lightningSound = loadedSound; },
            (error) => { console.log("Failed to load lightning sound:", error); }
        );
        p.loadSound('hurt.wav', 
            (loadedSound) => { lightningHurtSound = loadedSound; },
            (error) => { console.log("Failed to load hurt sound:", error); }
        );

        // Load the lightning images into an array
        for (let i = 0; i < 4; i++) {
            p.loadImage(`lightning${i + 1}.png`, (img) => {
                lightningImgs[i] = img;
            }, (error) => {
                console.log(`Failed to load lightning${i + 1}.png:`, error);
            });
        }

        if (p.random() > 0.5) {
            bgColor = p.color(0);
            contourColor = p.color(255);
        } else {
            bgColor = p.color(255);
            contourColor = p.color(0);
        }

        // compute responsive layout
        recomputeLayout();
        
        // Set target frame rate based on device
        p.frameRate(maxFPS);

        // FIX: Sử dụng Math.ceil để đảm bảo đủ ô lưới
        cols = Math.ceil(p.width / size) + 1;
        rows = Math.ceil(p.height / size) + 1;

        // Khởi tạo grid
        grid = [];
        for (let i = 0; i < cols; i++) {
            grid[i] = [];
            for (let j = 0; j < rows; j++) {
                grid[i][j] = 0;
            }
        }

        circles = [];
        for (let i = 0; i < num; i++) {
            circles.push(new Circle());
        }
    };

    p.windowResized = () => {
        // Debounce resize events for better performance
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            let canvasContainer = p.select('#p5-canvas-container');
            p.resizeCanvas(canvasContainer.width, canvasContainer.height);
            
            // compute responsive layout
            recomputeLayout();
            
            // Set new frame rate
            p.frameRate(maxFPS);
            
            // FIX: Cập nhật lại grid với kích thước mới
            cols = Math.ceil(p.width / size) + 1;
            rows = Math.ceil(p.height / size) + 1;
            
            // Tạo lại grid với kích thước mới
            grid = [];
            for (let i = 0; i < cols; i++) {
                grid[i] = [];
                for (let j = 0; j < rows; j++) {
                    grid[i][j] = 0;
                }
            }
            
            // Reset các blob với số lượng mới
            circles = [];
            for (let i = 0; i < num; i++) {
                circles.push(new Circle());
            }
            
            // Clear caches
            contourCache = [];
            lastContourUpdate = 0;
        }, 100); // 100ms debounce
    };

    // Performance monitoring function
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
            adaptiveQuality = Math.max(0.6, adaptiveQuality - 0.05);
        } else if (avgFrameTime < frameTimeTarget * 0.8) {
            adaptiveQuality = Math.min(1.0, adaptiveQuality + 0.02);
        }
    }

    p.draw = function () {
        // Performance monitoring
        updatePerformance();
        
        // Draw the peel effect squares first
        for (let s of scarSquares) {
            p.noStroke();
            p.fill(s.col);
            p.rect(s.x, s.y, s.size, s.size);
        }
        
        p.background(bgColor.levels[0], 20);

        // Adaptive grid calculations based on performance
        let shouldUpdateGrid = true;
        if (isMobile && adaptiveQuality < 0.8) {
            shouldUpdateGrid = p.frameCount % 2 === 0;
        }
        
        if (shouldUpdateGrid) {
            // Optimized grid calculations with adaptive quality
            let qualityFactor = Math.max(0.5, adaptiveQuality);
            let maxDistance = 8000 * qualityFactor; // Adaptive distance culling
            
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let val = 0;
                    let gridX = i * size;
                    let gridY = j * size;
                    
                    for (let k = 0; k < circles.length; k++) {
                        let dx = gridX - circles[k].x;
                        let dy = gridY - circles[k].y;
                        let distSq = dx * dx + dy * dy + 1;
                        
                        // Adaptive distance culling
                        if (distSq < maxDistance) {
                            val += (circles[k].r * circles[k].r) / distSq;
                        }
                    }
                    grid[i][j] = val;
                }
            }
        }
        
        // Di chuyển các blob
        for (let c of circles) {
            c.move();
        }
        
        // Tính toán contour với Marching Squares (with caching for mobile)
        let shouldUpdateContour = true;
        if (isMobile) {
            // Only update contour every few frames on mobile
            shouldUpdateContour = (p.frameCount - lastContourUpdate) >= 3;
        }
        
        if (shouldUpdateContour || contourCache.length === 0) {
            pixelPixels = [];
            let pixelDens = isMobile ? 4 : 8; // Reduce density on mobile
            lastContourUpdate = p.frameCount;
            
            for (let i = 0; i < cols - 1; i++) {
                for (let j = 0; j < rows - 1; j++) {
                    let a = grid[i][j] >= 1 ? 1 : 0;
                    let b = grid[i + 1][j] >= 1 ? 1 : 0;
                    let c = grid[i + 1][j + 1] >= 1 ? 1 : 0;
                    let d = grid[i][j + 1] >= 1 ? 1 : 0;
                    let config = 8 * a + 4 * b + 2 * c + 1 * d;
                    if (config === 0) continue;
                    let x = i * size;
                    let y = j * size;
                    let pt1 = p.createVector(p.lerp(x, x + size, getInterp(grid[i][j], grid[i + 1][j])), y);
                    let pt2 = p.createVector(x + size, p.lerp(y, y + size, getInterp(grid[i + 1][j], grid[i + 1][j + 1])));
                    let pt3 = p.createVector(p.lerp(x, x + size, getInterp(grid[i][j + 1], grid[i + 1][j + 1])), y + size);
                    let pt4 = p.createVector(x, p.lerp(y, y + size, getInterp(grid[i][j], grid[i][j + 1])));
                    switch (config) {
                        case 1: addPixelsAlongLine(pt3, pt4, pixelDens); break;
                        case 2: addPixelsAlongLine(pt2, pt3, pixelDens); break;
                        case 3: addPixelsAlongLine(pt2, pt4, pixelDens); break;
                        case 4: addPixelsAlongLine(pt1, pt2, pixelDens); break;
                        case 5: addPixelsAlongLine(pt1, pt4, pixelDens); addPixelsAlongLine(pt2, pt3, pixelDens); break;
                        case 6: addPixelsAlongLine(pt1, pt3, pixelDens); break;
                        case 7: addPixelsAlongLine(pt1, pt4, pixelDens); break;
                        case 8: addPixelsAlongLine(pt1, pt4, pixelDens); break;
                        case 9: addPixelsAlongLine(pt1, pt3, pixelDens); break;
                        case 10: addPixelsAlongLine(pt1, pt2, pixelDens); addPixelsAlongLine(pt3, pt4, pixelDens); break;
                        case 11: addPixelsAlongLine(pt1, pt2, pixelDens); break;
                        case 12: addPixelsAlongLine(pt2, pt4, pixelDens); break;
                        case 13: addPixelsAlongLine(pt2, pt3, pixelDens); break;
                        case 14: addPixelsAlongLine(pt3, pt4, pixelDens); break;
                    }
                }
            }
            // Cache the contour for mobile
            if (isMobile) {
                contourCache = [...pixelPixels];
            }
        } else {
            // Use cached contour on mobile
            pixelPixels = contourCache;
        }
        
        // Adaptive particle rendering based on performance
        p.noStroke();
        p.fill("#EB0000");
        
        let adaptiveParticleReduction = particleReductionFactor * adaptiveQuality;
        let runLength = Math.floor(500 * adaptiveParticleReduction);
        let contourSpeed = 1.5;
        let particlesPerPoint = Math.max(1, Math.floor(8 * adaptiveParticleReduction));
        
        // spreadRadius is now defined in recomputeLayout()
        let startIdx = (p.frameCount * contourSpeed) % pixelPixels.length;
        
        // Optimized particle rendering with batching
        if (pixelPixels.length > 0) {
            let cellSize = 20;
            let drawnCells = new Set(); // Avoid drawing duplicate cells
            
            for (let i = 0; i < runLength && i < pixelPixels.length; i++) {
                let idx = (p.floor(startIdx) + i) % pixelPixels.length;
                let point = pixelPixels[idx];
                if (point) {
                    // Draw main point
                    let mainX = p.floor(point.x / cellSize) * cellSize;
                    let mainY = p.floor(point.y / cellSize) * cellSize;
                    let mainKey = `${mainX},${mainY}`;
                    
                    if (!drawnCells.has(mainKey)) {
                        p.rect(mainX, mainY, cellSize, cellSize);
                        drawnCells.add(mainKey);
                    }
                    
                    // Draw spread particles with optimization
                    for (let j = 0; j < particlesPerPoint; j++) {
                        let angle = p.random(p.TWO_PI);
                        let radius = p.random(1, spreadRadius);
                        let x = p.floor((point.x + p.cos(angle) * radius) / cellSize) * cellSize;
                        let y = p.floor((point.y + p.sin(angle) * radius) / cellSize) * cellSize;
                        let key = `${x},${y}`;
                        
                        if (!drawnCells.has(key)) {
                            p.rect(x, y, cellSize, cellSize);
                            drawnCells.add(key);
                        }
                    }
                }
            }
        }
        
        // Vẽ contour chính
        p.stroke(contourColor);
        p.strokeWeight(1.5);
        p.noFill();
        for (let i = 0; i < cols - 1; i++) {
            for (let j = 0; j < rows - 1; j++) {
                let a = grid[i][j] >= 1 ? 1 : 0;
                let b = grid[i + 1][j] >= 1 ? 1 : 0;
                let c = grid[i + 1][j + 1] >= 1 ? 1 : 0;
                let d = grid[i][j + 1] >= 1 ? 1 : 0;
                let config = 8 * a + 4 * b + 2 * c + 1 * d;
                let x = i * size;
                let y = j * size;
                let pt1 = p.createVector(p.lerp(x, x + size, getInterp(grid[i][j], grid[i + 1][j])), y);
                let pt2 = p.createVector(x + size, p.lerp(y, y + size, getInterp(grid[i + 1][j], grid[i + 1][j + 1])));
                let pt3 = p.createVector(p.lerp(x, x + size, getInterp(grid[i][j + 1], grid[i + 1][j + 1])), y + size);
                let pt4 = p.createVector(x, p.lerp(y, y + size, getInterp(grid[i][j], grid[i][j + 1])));
                switch (config) {
                    case 1: p.line(pt3.x, pt3.y, pt4.x, pt4.y); break;
                    case 2: p.line(pt2.x, pt2.y, pt3.x, pt3.y); break;
                    case 3: p.line(pt2.x, pt2.y, pt4.x, pt4.y); break;
                    case 4: p.line(pt1.x, pt1.y, pt2.x, pt2.y); break;
                    case 5: p.line(pt1.x, pt1.y, pt4.x, pt4.y); p.line(pt2.x, pt2.y, pt3.x, pt3.y); break;
                    case 6: p.line(pt1.x, pt1.y, pt3.x, pt3.y); break;
                    case 7: p.line(pt1.x, pt1.y, pt4.x, pt4.y); break;
                    case 8: p.line(pt1.x, pt1.y, pt4.x, pt4.y); break;
                    case 9: p.line(pt1.x, pt1.y, pt3.x, pt3.y); break;
                    case 10: p.line(pt1.x, pt1.y, pt2.x, pt2.y); p.line(pt3.x, pt3.y, pt4.x, pt4.y); break;
                    case 11: p.line(pt1.x, pt1.y, pt2.x, pt2.y); break;
                    case 12: p.line(pt2.x, pt2.y, pt4.x, pt4.y); break;
                    case 13: p.line(pt2.x, pt2.y, pt3.x, pt3.y); break;
                    case 14: p.line(pt3.x, pt3.y, pt4.x, pt4.y); break;
                }
            }
        }
        
        // Vẽ icon mute/unmute
        if (muteIcon && unmuteIcon) {
            // Responsive button sizing and positioning
            let buttonSize = isMobile ? 40 : isTablet ? 45 : 50;
            let buttonX = isMobile ? 20 : isTablet ? 30 : 50;
            let buttonY = isMobile ? 20 : isTablet ? 30 : 50;
            
            if (isMuted) {
                p.image(muteIcon, buttonX, buttonY, buttonSize, buttonSize);
            } else {
                p.image(unmuteIcon, buttonX, buttonY, buttonSize, buttonSize);
            }
        }

        drawQuote();
        drawLightning();
        
        // Performance monitoring
        if (p.frameCount % 120 === 0) {
            let avgFrameTime = performanceHistory.length > 0 ? 
                performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length : 0;
            console.log(`Sketch1 FPS: ${p.frameRate().toFixed(1)}, Quality: ${(adaptiveQuality * 100).toFixed(0)}%, Frame Time: ${avgFrameTime.toFixed(1)}ms, Circles: ${circles.length}`);
        }
    };
    
    // Function to handle interaction (both mouse and touch)
    function handleInteraction(x, y) {
        // Lần nhấn đầu tiên (bất cứ đâu) để BẮT ĐẦU âm thanh
        if (!soundHasStarted) {
            if (sound && sound.isLoaded()) {
                p.userStartAudio(); // Kích hoạt Audio Context
                sound.loop();
                isMuted = false; // Bỏ tắt tiếng
                sound.setVolume(1);
                soundHasStarted = true; // Đánh dấu là âm thanh đã bắt đầu
                
                // Set volumes for additional sounds
                if (peelSound && peelSound.isLoaded()) peelSound.setVolume(1.5);
                if (lightningSound && lightningSound.isLoaded()) lightningSound.setVolume(0.4);
                if (lightningHurtSound && lightningHurtSound.isLoaded()) lightningHurtSound.setVolume(0.3);
            }
            return;
        }
        
        // Handle mute/unmute button click first
        let buttonSize = isMobile ? 40 : isTablet ? 45 : 50;
        let buttonX = isMobile ? 20 : isTablet ? 30 : 50;
        let buttonY = isMobile ? 20 : isTablet ? 30 : 50;
        
        if (x > buttonX && x < buttonX + buttonSize && y > buttonY && y < buttonY + buttonSize) {
            isMuted = !isMuted; // Đảo ngược trạng thái
            if (sound && sound.isLoaded()) {
                sound.setVolume(isMuted ? 0 : 1);
            }
            // Set volumes for additional sounds
            if (peelSound && peelSound.isLoaded()) peelSound.setVolume(isMuted ? 0 : 1.5);
            if (lightningSound && lightningSound.isLoaded()) lightningSound.setVolume(isMuted ? 0 : 0.4);
            if (lightningHurtSound && lightningHurtSound.isLoaded()) lightningHurtSound.setVolume(isMuted ? 0 : 0.3);
            return;
        }

        // --- Handle clicks/touches on the canvas ---

        // 1. Create the "peel" effect
        let squareSize = 60;
        let squareColor = (bgColor.levels[0] === 255) ? p.color(0) : p.color(255);
        scarSquares.push({
            x: x - squareSize / 2,
            y: y - squareSize / 2,
            size: squareSize,
            col: squareColor
        });

        // Play peel sound if loaded and not muted
        if (!isMuted && peelSound && peelSound.isLoaded()) {
            if (peelSound.isPlaying()) {
                peelSound.stop();
            }
            peelSound.play();
        }

        // 2. Create the lightning effect only if images are loaded
        if (lightningImgs.length === 4 && lightningImgs.every(img => img && img.width > 1)) {
            let imgIndex = p.floor(p.random(0, lightningImgs.length));
            let img = lightningImgs[imgIndex];
            let scaleFactor = isMobile ? 1.5 : 2; // Smaller lightning on mobile
            let w = img.width * scaleFactor;
            let h = img.height * scaleFactor;
            let lx = p.random(p.width - w);
            let ly = p.random(p.height - h);
            activeLightnings.push({ img, x: lx, y: ly, w, h, life: 30 });
            
            // Play lightning sounds if not muted and loaded
            if (!isMuted) {
                if (lightningSound && lightningSound.isLoaded()) {
                    if (lightningSound.isPlaying()) {
                        lightningSound.stop();
                    }
                    lightningSound.play();
                }

                if (lightningHurtSound && lightningHurtSound.isLoaded()) {
                    if (lightningHurtSound.isPlaying()) {
                        lightningHurtSound.stop();
                    }
                    lightningHurtSound.play();
                }
            }
        }
    }

    p.mousePressed = function() {
        handleInteraction(p.mouseX, p.mouseY);
    };

    // Add touch support for mobile devices
    p.touchStarted = function(event) {
        // Get touch coordinates relative to canvas
        let canvasElement = document.getElementById('p5-canvas-container');
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
        
        // Only process touches within canvas bounds
        if (touchX < 0 || touchX > p.width || touchY < 0 || touchY > p.height) {
            return; // Touch outside canvas, allow default scrolling
        }
        
        // Check if touch is on mute button
        let buttonSize = isMobile ? 40 : isTablet ? 45 : 50;
        let buttonX = isMobile ? 20 : isTablet ? 30 : 50;
        let buttonY = isMobile ? 20 : isTablet ? 30 : 50;
        
        if (touchX > buttonX && touchX < buttonX + buttonSize && 
            touchY > buttonY && touchY < buttonY + buttonSize) {
            handleInteraction(touchX, touchY);
            return false; // Only prevent default for button interactions
        }
        
        // For canvas interactions, handle but allow scrolling
        handleInteraction(touchX, touchY);
        // Don't return false - allow default touch behavior for scrolling
    };
    
    p.keyPressed = function() {
        if (p.key === 'p' || p.key === 'P') {
            if (!soundHasStarted) {
                p.userStartAudio();
                soundHasStarted = true;
            }
            if (sound && sound.isLoaded()) {
                if (sound.isPlaying()) {
                    sound.stop();
                } else {
                    sound.loop();
                    sound.setVolume(isMuted ? 0 : 1);
                }
            }
        }
        if (p.key === 'm' || p.key === 'M') {
            isMuted = !isMuted;
            if (sound && sound.isLoaded() && sound.isPlaying()) {
                sound.setVolume(isMuted ? 0 : 1);
            }
        }
    };
    
    function loadSoundSafely() {

        fetch('maybe.wav', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {

                    loadWithP5Sound();
                } else {

                    loadWithHTML5Audio();
                }
            })
            .catch(error => {

                loadWithHTML5Audio();
            });
    }

    function loadWithP5Sound() {
        try {
            p.loadSound('maybe.wav',
                (loadedSound) => {
                    sound = loadedSound;

                },
                (error) => {

                    loadWithHTML5Audio();
                }
            );
        } catch (error) {

            loadWithHTML5Audio();
        }
    }

    function loadWithHTML5Audio() {
        try {

            let html5Audio = new Audio();
            html5Audio.addEventListener('canplaythrough', () => {

                sound = {
                    isLoaded: () => true,
                    isPlaying: () => !html5Audio.paused,
                    loop: () => { html5Audio.loop = true; html5Audio.play().catch(e => console.error("Play failed:", e)); },
                    stop: () => { html5Audio.pause(); html5Audio.currentTime = 0; },
                    setVolume: (vol) => { html5Audio.volume = Math.max(0, Math.min(1, vol)); },
                    play: () => { html5Audio.play().catch(e => console.error("Play failed:", e)); }
                };
            });
            html5Audio.addEventListener('error', (e) => {

                createSilentSound();
            });
            html5Audio.src = 'maybe.wav';
        } catch (error) {

            createSilentSound();
        }
    }

    function createSilentSound() {

        sound = {
            isLoaded: () => true,
            isPlaying: () => false,
            loop: () => {},
            stop: () => {},
            setVolume: () => {},
            play: () => {}
        };
    }

    function addPixelsAlongLine(p1, p2, n) {
        for (let i = 0; i <= n; i++) {
            let x = p.lerp(p1.x, p2.x, i / n);
            let y = p.lerp(p1.y, p2.y, i / n);
            pixelPixels.push(p.createVector(x, y));
        }
    }

    function getInterp(val1, val2) {
        let diff = val2 - val1;
        if (diff === 0) return 0.5;
        return (1 - val1) / diff;
    }

    class Circle {
        constructor() { 
            this.reset(); 
            // Pre-calculate noise offset increment for performance
            this.noiseIncrement = 0.01;
        }
        reset() {
            this.x = p.random(p.width);
            this.y = p.height + p.random(60, 120);
            // Responsive circle size with mobile optimization
            let baseRadius = isMobile ? 40 * scaleUI : 50 * scaleUI;
            baseRadius = Math.max(15, Math.min(baseRadius, isMobile ? 50 : 70));
            this.r = p.random(baseRadius, baseRadius + (isMobile ? 15 : 20));
            this.v = p.random(isMobile ? 4 : 6, isMobile ? 8 : 10); // Slower on mobile for smoother performance
            this.offset = p.random(1000);
        }
        move() {
            this.y -= this.v;
            // Reduce noise calculation frequency on mobile
            if (isMobile && p.frameCount % 2 === 0) {
                let n = p.noise(this.offset + p.frameCount * this.noiseIncrement);
                this.x += p.map(n, 0, 1, -0.5, 0.5); // Reduced movement for mobile
            } else if (!isMobile) {
                let n = p.noise(this.offset + p.frameCount * this.noiseIncrement);
                this.x += p.map(n, 0, 1, -0.7, 0.7);
            }
            if (this.y + this.r < 0) this.reset();
        }
    }

    function drawQuote() {
        // Adaptive text rendering based on performance
        if (isMobile && adaptiveQuality < 0.8 && p.frameCount % 2 !== 0) {
            return; // Skip text rendering when performance is low
        }
        
        p.noStroke();
        let textCol = bgColor.levels[0] === 255 ? p.color(0) : p.color(255);
        p.fill(textCol);
        
        // Responsive positioning and sizing
        let maxWidth, x, y;
        
        if (isMobile) {
            // Mobile layout - keep text on right side like desktop, but responsive
            maxWidth = p.width * 0.65; // Slightly wider for better readability
            x = p.width - maxWidth - 20; // Right side with proper margin like desktop
            y = p.height * 0.06; // Closer to top like desktop
            
            // Ensure text doesn't go off screen
            if (x < 20) x = 20;
            

        } else if (isTablet) {
            // Tablet layout - right side but smaller
            maxWidth = p.width * 0.4;
            x = p.width - maxWidth - 20;
            y = p.height * 0.08;
        } else {
            // Desktop layout - original positioning but responsive
            maxWidth = 400;
            x = p.width - maxWidth - 20; // Always keep text fully visible
            y = 80;
            
            // Ensure text doesn't go off screen
            if (x < 20) x = 20;
        }
        
        // Responsive text sizes
        let mainTextSize, attributionSize, callToActionSize;
        
        if (isMobile) {
            mainTextSize = 13; // Slightly smaller for mobile
            attributionSize = 9;
            callToActionSize = 11;
        } else if (isTablet) {
            mainTextSize = 16;
            attributionSize = 11;
            callToActionSize = 13;
        } else {
            mainTextSize = p.width > 1200 ? 17 : p.width > 800 ? 15 : 13;
            attributionSize = p.width > 1200 ? 12 : p.width > 800 ? 11 : 10;
            callToActionSize = p.width > 1200 ? 15 : p.width > 800 ? 14 : 12;
        }
        
        // Quote text removed as requested
        
        // Responsive positioning for call to action - keep desktop-like spacing
        let ctaX = isMobile ? x + 80 : x + 110; // Mobile: proportional offset
        let ctaY = isMobile ? y + 140 : y + 300; // Mobile: proportional spacing
        p.textSize(callToActionSize);
        p.fill("#EB0000");
        p.textStyle(p.BOLD);
        let callToAction = "Cut the fumes, not our breath.";
        
        // Check if text fits within maxWidth, if not, reduce it
        let actualTextWidth = p.textWidth(callToAction);
        if (actualTextWidth > maxWidth) {

            // Try to fit the text by reducing maxWidth
            maxWidth = Math.min(maxWidth, actualTextWidth + 20); // Add some padding
        }
        
        p.text(callToAction, ctaX, ctaY, maxWidth);
        
        if (isMobile) {

        }        
        

    }

    function drawLightning() {
        for (let i = activeLightnings.length - 1; i >= 0; i--) {
            let l = activeLightnings[i];
            p.push();
            p.blendMode(p.ADD);
            p.tint(255, 20); // Low alpha for a subtle blend effect
            p.image(l.img, l.x, l.y, l.w, l.h);
            p.pop();
            l.life--;
            if (l.life <= 0) {
                activeLightnings.splice(i, 1);
            }
        }
    }
};

// --- KHỞI TẠO INSTANCE CỦA P5 ---
new p5(sketch1, 'p5-canvas-container');
