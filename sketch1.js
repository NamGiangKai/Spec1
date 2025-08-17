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


    p.setup = () => {
        let canvasContainer = p.select('#p5-canvas-container');
        let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
        canvas.parent('p5-canvas-container');

        // Giữ lại các cơ chế tải an toàn và gỡ lỗi của bạn
        loadSoundSafely();

        p.loadImage("mute.png", (img) => {
            muteIcon = img;
            console.log("✅ Mute icon loaded");
        });
        p.loadImage("unmute.png", (img) => {
            unmuteIcon = img;
            console.log("✅ Unmute icon loaded");
        });

        if (p.random() > 0.5) {
            bgColor = p.color(0);
            contourColor = p.color(255);
        } else {
            bgColor = p.color(255);
            contourColor = p.color(0);
        }

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

        num = p.int(p.random(50, 60));
        circles = [];
        for (let i = 0; i < num; i++) {
            circles.push(new Circle());
        }
    };

    p.windowResized = () => {
        let canvasContainer = p.select('#p5-canvas-container');
        p.resizeCanvas(canvasContainer.width, canvasContainer.height);
        
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
        
        // Reset các blob
        for (let i = 0; i < circles.length; i++) {
            circles[i].reset();
        }
    };

    p.draw = function () {
        p.background(bgColor.levels[0], 20);

        // Tính toán giá trị grid từ các blob
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let val = 0;
                for (let k = 0; k < circles.length; k++) {
                    let dx = i * size - circles[k].x;
                    let dy = j * size - circles[k].y;
                    val += (circles[k].r * circles[k].r) / (dx * dx + dy * dy + 1);
                }
                grid[i][j] = val;
            }
        }
        
        // Di chuyển các blob
        for (let c of circles) {
            c.move();
        }
        
        // Tính toán contour với Marching Squares
        pixelPixels = [];
        let pixelDens = 8;
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
        
        // Vẽ hiệu ứng hạt đỏ dọc theo contour
        p.noStroke();
        p.fill("#EB0000");
        let runLength = 500;
        let contourSpeed = 1.5;
        let spreadRadius = 30;
        let startIdx = (p.frameCount * contourSpeed) % pixelPixels.length;
        for (let i = 0; i < runLength; i++) {
            let idx = (p.floor(startIdx) + i) % pixelPixels.length;
            let point = pixelPixels[idx];
            if (point) {
                p.rect(p.floor(point.x / 20) * 20, p.floor(point.y / 20) * 20, 20, 20);
                for (let j = 0; j < 8; j++) {
                    let angle = p.random(p.TWO_PI);
                    let radius = p.random(1, spreadRadius);
                    let x = point.x + p.cos(angle) * radius;
                    let y = point.y + p.sin(angle) * radius;
                    p.rect(p.floor(x / 20) * 20, p.floor(y / 20) * 20, 20, 20);
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
            if (isMuted) {
                p.image(muteIcon, 50, 50, 50, 50);
            } else {
                p.image(unmuteIcon, 50, 50, 50, 50);
            }
        }

        drawQuote();
    };
    
    p.mousePressed = function() {
        // Lần nhấn chuột đầu tiên (bất cứ đâu) để BẮT ĐẦU âm thanh
        if (!soundHasStarted) {
            if (sound && sound.isLoaded()) {
                p.userStartAudio(); // Kích hoạt Audio Context
                sound.loop();
                isMuted = false; // Bỏ tắt tiếng
                sound.setVolume(1);
                soundHasStarted = true; // Đánh dấu là âm thanh đã bắt đầu
                console.log("✅ Sound started successfully on first click!");
            } else {
                console.log("⚠️ Sound not loaded yet. Click again when loaded.");
            }
        }
        // Các lần nhấn chuột SAU ĐÓ chỉ để BẬT/TẮT tiếng khi nhấn vào icon
        else {
            if (p.mouseX > 20 && p.mouseX < 70 && p.mouseY > 20 && p.mouseY < 70) {
                isMuted = !isMuted; // Đảo ngược trạng thái
                if (sound && sound.isLoaded()) {
                    sound.setVolume(isMuted ? 0 : 1);
                    console.log(`Mute toggled. New state: ${isMuted}`);
                }
            }
        }
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
        console.log("🔊 Starting safe sound loading...");
        fetch('maybe.wav', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log("✅ File exists, attempting to load with p5.sound...");
                    loadWithP5Sound();
                } else {
                    console.log("❌ File not found, trying HTML5 Audio...");
                    loadWithHTML5Audio();
                }
            })
            .catch(error => {
                console.log("❌ Fetch failed, trying HTML5 Audio...", error);
                loadWithHTML5Audio();
            });
    }

    function loadWithP5Sound() {
        try {
            p.loadSound('maybe.wav',
                (loadedSound) => {
                    sound = loadedSound;
                    console.log("✅ p5.sound loaded successfully:", sound);
                },
                (error) => {
                    console.error("❌ p5.sound failed:", error);
                    console.log("Falling back to HTML5 Audio...");
                    loadWithHTML5Audio();
                }
            );
        } catch (error) {
            console.error("❌ p5.sound error:", error);
            loadWithHTML5Audio();
        }
    }

    function loadWithHTML5Audio() {
        try {
            console.log("🎵 Creating HTML5 Audio element...");
            let html5Audio = new Audio();
            html5Audio.addEventListener('canplaythrough', () => {
                console.log("✅ HTML5 Audio loaded successfully");
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
                console.error("❌ HTML5 Audio error:", e);
                createSilentSound();
            });
            html5Audio.src = 'maybe.wav';
        } catch (error) {
            console.error("❌ HTML5 Audio creation failed:", error);
            createSilentSound();
        }
    }

    function createSilentSound() {
        console.log("🔇 Creating silent sound object as fallback...");
        sound = {
            isLoaded: () => true,
            isPlaying: () => false,
            loop: () => console.log("🔇 Silent sound - no audio"),
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
        constructor() { this.reset(); }
        reset() {
            this.x = p.random(p.width);
            this.y = p.height + p.random(60, 120);
            this.r = p.random(30, 70);
            this.v = p.random(6, 10);
            this.offset = p.random(1000);
        }
        move() {
            this.y -= this.v;
            let n = p.noise(this.offset + p.frameCount * 0.01);
            this.x += p.map(n, 0, 1, -0.7, 0.7);
            if (this.y + this.r < 0) this.reset();
        }
    }

    function drawQuote() {
        p.noStroke();
        let textCol = bgColor.levels[0] === 255 ? p.color(0) : p.color(255);
        p.fill(textCol);
        
        // Keep original position but make it responsive
        let x = 1200; // Original position
        let y = 80;   // Original position
        let maxWidth = 400; // Original width
        
        // Adjust position when screen is too small to prevent text cutoff
        if (p.width < 1600) {
            x = p.width - 420; // Keep text fully visible
            if (x < 20) x = 20; // Don't go off left edge
        }
        
        // Responsive text sizes
        let mainTextSize = p.width > 1200 ? 17 : p.width > 800 ? 15 : 13;
        let attributionSize = p.width > 1200 ? 12 : p.width > 800 ? 11 : 10;
        let callToActionSize = p.width > 1200 ? 15 : p.width > 800 ? 14 : 12;
        
        let quote = '"We are facing a man-made disaster on a global scale. Our greatest threat in thousands of years. Climate change."';
        
        p.textSize(mainTextSize);
        p.textStyle(p.BOLD);
        p.textFont("Source Code Pro");
        p.textAlign(p.LEFT);
        p.text(quote, x, y, maxWidth);
        
        p.textSize(attributionSize);
        p.textStyle(p.NORMAL);
        p.text("— Sir David Attenborough", x + 20, y + 70, maxWidth);
        
        p.textSize(callToActionSize);
        p.fill("#EB0000");
        p.textStyle(p.BOLD);
        let callToAction = "Cut the fumes, not our breath.";
        p.text(callToAction, x + 110, y + 300, maxWidth);
        
        // Additional safety check to prevent text cutoff
        if (x + maxWidth > p.width - 20) {
            maxWidth = p.width - x - 20;
        }
    }
};

// --- KHỞI TẠO INSTANCE CỦA P5 ---
new p5(sketch1, 'p5-canvas-container');
