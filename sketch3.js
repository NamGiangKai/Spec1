// Converted to p5 instance mode
const industrialSketch = (p) => {
  // Sounds & Images
  let img;
  let ambience, smokeSound, gearSound;
  let muteImg, unmuteImg;

  // =================== GEARS + SMOKE + MINI-GEARS BG + CIRCLE ANIM INSIDE MAIN GEARS + PIPES UNDERLAY ===================

  let t = 0;
  let smokes = [];
  const GRID = 1;
  let gearRad = 125;
  let gearOffset = 150;
  const teethN = 16;

  // Base canvas and mask image layout (for 1920x1080)
  const BASE_W = 1920, BASE_H = 1080;
  const IMG_BASE_X = 200;
  const IMG_BASE_Y = -40;
  const IMG_BASE_W = 1920 / 1.3;
  const IMG_BASE_H = 1080 / 1.3;
  const IMG_OFFSET_X0 = IMG_BASE_X + IMG_BASE_W / 2 - BASE_W / 2; // center-relative offset
  const IMG_OFFSET_Y0 = IMG_BASE_Y + IMG_BASE_H / 2 - BASE_H / 2; // center-relative offset

  // Quote baseline (from 1920x1080 design)
  const QUOTE_BASE_X = 1400;
  const QUOTE_BASE_Y = 80;
  const QUOTE_BASE_W = 400;
  const AUTHOR_DX = 20, AUTHOR_DY = 70;
  const CTA_DX = 110, CTA_DY = 300;

  // ---------- background ----------
  let bgPG;                     // mini gears layer (transparent)
  let pipesPG;                  // Truchet pipes layer (transparent, drawn under mini-gears)
  let miniGears = [];
  let colors = ['rgb(160,159,159)', '#929292', '#580302', '#9B1E1E'];

  // placement + sizing (all mini gears < main gear)
  let miniRMin = gearRad * 0.08;
  let miniRMax = gearRad * 1;
  const PADDING   = 8;
  const EDGE_PAD  = 8;

  // mini-gears count / placement attempts
  let miniGearsTarget = 200;
  const MAX_ATTEMPTS     = 30000;

  // main gear centers
  let leftX, rightX, cy;

  // ---------- Truchet pipes (static underlay) ----------
  let TILE = 80;        // grid cell size (px)
  let COLS, ROWS;       // computed in setup
  let tileRot = [];     // per-tile rotation 0..3
  const PIPE_W   = 15;  // pipe line weight

  // ---- gear sound smoothing ----
  let gearRate = 1.0;         // current playback rate
  let gearPan  = 0.0;         // current pan
  const RATE_BASE  = 0.95;    // idle rate
  const RATE_HOVER = 1.35;    // hover rate
  const SMOOTH     = 0.12;    // smoothing factor per frame (0..1)

  // ---- smoke sound throttle ----
  let lastSmokePlay = 0;
  const SMOKE_INTERVAL = 90;  // ms between smoke sound retriggers while dragging

  // ---- audio toggle button ----
  let audioEnabled = false; // start MUTED
  const BTN_SIZE = 56;
  const btnX = 24, btnY = 24; // top-left

  // quote box (aligns with sketch2.js usage)
  let quoteBox = { x: 0, y: 0, w: 0, h: 0 };

  // ---- responsive scaling ----
  let scaleUI = 1; // relative to 1920x1080
  
  // Responsive variables
  let isMobile = false;
  let isTablet = false;
  let baseGearRad = 125;
  let baseGearOffset = 150;
  
  // Performance optimization variables
  let maxFPS = 60; // Always maintain 60fps
  let frameTimeTarget = 16.67; // Target 60fps
  let lastFrameTime = 0;
  let adaptiveQuality = 1.0;
  let performanceHistory = [];
  let miniGearUpdateFrequency = 1;
  let smokeUpdateFrequency = 1;
  let circleAnimUpdateFrequency = 1;

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
      adaptiveQuality = Math.max(0.6, adaptiveQuality - 0.05);
    } else if (avgFrameTime < frameTimeTarget * 0.8) {
      adaptiveQuality = Math.min(1.0, adaptiveQuality + 0.02);
    }
    
    // Update frequencies based on performance
    if (isMobile && adaptiveQuality < 0.8) {
      miniGearUpdateFrequency = 2;
      smokeUpdateFrequency = 2;
      circleAnimUpdateFrequency = 2;
    } else {
      miniGearUpdateFrequency = 1;
      smokeUpdateFrequency = 1;
      circleAnimUpdateFrequency = 1;
    }
  }

  function detectDeviceType() {
    const width = p.width;
    const height = p.height;
    
    isMobile = width < 768;
    isTablet = width >= 768 && width < 1024;
    
    // Optimize for 60fps on all devices
    if (isMobile) {
      baseGearRad = 75;  // Optimized for 60fps
      baseGearOffset = 95;
    } else if (isTablet) {
      baseGearRad = 100;
      baseGearOffset = 125;
    } else {
      baseGearRad = 125;
      baseGearOffset = 150;
    }
  }

  function recomputeLayout() {
    const baseW = 1920, baseH = 1080;
    scaleUI = Math.min(p.width / baseW, p.height / baseH);

    // Apply device-specific scaling
    detectDeviceType();
    
    // Calculate gear size and position based on screen dimensions
    gearRad = Math.max(50, baseGearRad * scaleUI);
    gearOffset = baseGearOffset * scaleUI;
    
    // Mobile-specific positioning adjustments
    if (isMobile) {
      // On mobile, keep gears in the same relative position to mask image as desktop
      // But ensure they don't go off screen
      const maxGearSize = Math.min(p.width * 0.08, p.height * 0.08); // Giảm từ 0.18 xuống 0.15
      gearRad = Math.min(gearRad, maxGearSize);
      
      // Calculate the same relative position as desktop
      // Desktop: leftX = p.width/2 - 150, rightX = p.width/2 + 150, cy = p.height/2 - 200
      // Mobile: maintain same proportions but scaled, but move down a bit
      const desktopLeftRatio = (1920/2 - 150) / 1920; // Left gear position ratio
      const desktopRightRatio = (1920/2 + 150) / 1920; // Right gear position ratio
      const desktopCenterYRatio = (1080/2 - 150) / 1080; // Center Y position ratio - move down from -200 to -150
      
      leftX = p.width * desktopLeftRatio;
      rightX = p.width * desktopRightRatio;
      cy = p.height * desktopCenterYRatio;
      
      // Ensure gears don't go off screen
      const minMargin = gearRad + 15;
      if (leftX < minMargin) leftX = minMargin;
      if (rightX > p.width - minMargin) rightX = minMargin;
      if (cy < minMargin) cy = minMargin;
      if (cy > p.height - minMargin) cy = minMargin;
      
      // Recalculate gearOffset based on actual positions
      gearOffset = (rightX - leftX) / 2;
      
    } else {
      // Desktop/Tablet logic - keep original positioning
      // Ensure gears don't go off screen - calculate maximum safe offset
      const minGearOffset = gearRad + 20; // Minimum distance from edge
      const maxGearOffset = Math.min(p.width / 2 - minGearOffset, p.height / 2 - minGearOffset);
      gearOffset = Math.min(gearOffset, maxGearOffset);
      
      // Standard vertical positioning
      cy = p.height / 2 - 200 * scaleUI;
      
      // Responsive gear positioning - center gears based on screen size
      leftX = p.width / 2 - gearOffset;
      rightX = p.width / 2 + gearOffset;
    }

    // grid tile scales within bounds
    TILE = Math.round(80 * scaleUI);
    TILE = Math.max(40, Math.min(TILE, 120));

    // Adaptive mini gears count based on performance and device
    let baseGearCount = isMobile ? 120 : isTablet ? 160 : 200;
    miniGearsTarget = Math.round(baseGearCount * scaleUI * scaleUI * adaptiveQuality);
    miniGearsTarget = Math.max(40, Math.min(miniGearsTarget, 220));
    

  }

  p.setup = () => {
    const canvasContainer = p.select('#p5-dekay-canvas');
    if (canvasContainer) {
      const canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
      canvas.parent('p5-dekay-canvas');
    } else {
      p.createCanvas(1920, 1080);
    }
    p.angleMode(p.RADIANS);
    p.rectMode(p.CENTER);
    p.noFill();

    // Load assets
    ambience   = p.loadSound('ambience.wav');
    gearSound  = p.loadSound('gear.wav');
    smokeSound = p.loadSound('smoke.wav');
    img        = p.loadImage('maskfr.png');
    muteImg    = p.loadImage('mute.png');
    unmuteImg  = p.loadImage('unmute.png');

    bgPG    = p.createGraphics(p.width, p.height);
    pipesPG = p.createGraphics(p.width, p.height);

    // compute responsive layout
    recomputeLayout();

    // ----- build Truchet underlay once -----
    COLS = p.floor(p.width / TILE);
    ROWS = p.floor(p.height / TILE);
    tileRot = [];
    for (let j = 0; j < ROWS; j++) {
      tileRot[j] = [];
      for (let i = 0; i < COLS; i++) tileRot[j][i] = p.floor(p.random(4));
    }
    buildPipesLayer();

    // place mini-gears randomly with no overlap (and not colliding with main gears)
    createMiniGearsNoOverlap();

    // prepare loops (don’t start until button click)
    ambience.setLoop(true);
    ambience.setVolume(1);

    gearSound.setLoop(true);
    gearSound.setVolume(1);
    gearSound.rate(RATE_BASE);

    if (smokeSound) smokeSound.setVolume(3);
  };

  // handle resize responsively
  p.windowResized = () => {
    const canvasContainer = p.select('#p5-dekay-canvas');
    if (canvasContainer) {
      p.resizeCanvas(canvasContainer.width, canvasContainer.height);
    } else {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    }

    bgPG    = p.createGraphics(p.width, p.height);
    pipesPG = p.createGraphics(p.width, p.height);

    recomputeLayout();

    COLS = p.floor(p.width / TILE);
    ROWS = p.floor(p.height / TILE);
    tileRot = [];
    for (let j = 0; j < ROWS; j++) {
      tileRot[j] = [];
      for (let i = 0; i < COLS; i++) tileRot[j][i] = p.floor(p.random(4));
    }
    buildPipesLayer();
    createMiniGearsNoOverlap();
  };

  /* ---------- Audio Toggle UI ---------- */
  function drawAudioButton() {
    p.push();
    p.noStroke();
    // optional subtle bg
    p.fill(0, 140);
    p.rectMode(p.CORNER);
    p.rect(btnX - 6, btnY - 6, BTN_SIZE + 12, BTN_SIZE + 12, 8);
    // icon
    const icon = audioEnabled ? unmuteImg : muteImg;
    if (icon) p.image(icon, btnX, btnY, BTN_SIZE, BTN_SIZE);
    p.pop();
  }

  function isOverButton(x, y) {
    return x >= btnX && x <= btnX + BTN_SIZE && y >= btnY && y <= btnY + BTN_SIZE;
  }

  function toggleAudio() {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
      if (p.getAudioContext().state !== 'running') p.userStartAudio();
      if (ambience && !ambience.isPlaying()) ambience.loop();
      if (gearSound && !gearSound.isPlaying()) {
        gearSound.loop();
        gearSound.rate(gearRate);
        gearSound.pan(gearPan);
      }
    } else {
      if (ambience && ambience.isPlaying()) ambience.stop();
      if (gearSound && gearSound.isPlaying()) gearSound.stop();
      // smokeSound is one-shot; just prevent future plays while muted
    }
  }

  /* ---------- click/touch: ONLY toggle when pressing the button ---------- */
  p.mousePressed = () => {
    if (isOverButton(p.mouseX, p.mouseY)) toggleAudio();
  };
  p.touchStarted = (event) => {
    // Only handle touch if it's within canvas bounds and specifically on interactive elements
    let canvasElement = document.getElementById('p5-dekay-canvas');
    if (!canvasElement) return;
    
    let rect = canvasElement.getBoundingClientRect();
    let touch = event.touches ? event.touches[0] : event;
    let touchX = touch.clientX - rect.left;
    let touchY = touch.clientY - rect.top;
    
    // Check if touch is on audio button - only prevent default for button interactions
    if (isOverButton(touchX, touchY)) {
      toggleAudio();
      return false; // Only prevent default for button interactions
    }
    
    // For other touches, allow normal scrolling behavior
    // Don't return false - allow default touch behavior for scrolling
  };

  p.draw = () => {
    // Performance monitoring
    updatePerformance();
    
    p.background(0);

    // ---- 0) PIPES UNDERLAY (static) ----
    p.image(pipesPG, 0, 0);

    // ---- 1) mini gears background (animated with adaptive updates) ----
    if (p.frameCount % miniGearUpdateFrequency === 0) {
      bgPG.clear();
      // Adaptive mini gear rendering
      let gearStep = Math.max(1, Math.floor(2 - adaptiveQuality));
      for (let i = 0; i < miniGears.length; i += gearStep) {
        miniGears[i].update(); 
        miniGears[i].draw(bgPG);
      }
    }
    p.image(bgPG, 0, 0);

    // ---- 2) adaptive smoke system ----
    if (p.frameCount % smokeUpdateFrequency === 0) {
      // Reduce smoke emission based on performance
      let smokeIntensity = adaptiveQuality;
      let smokeCount = Math.floor(3 * smokeIntensity);
      
      if (smokeCount > 0) {
        const randX = Math.round(p.random(p.width * 0.02, p.width * 0.98) / GRID) * GRID;
        emitSmoke(randX, p.height - 2, smokeCount, 1.0, 2.0, 20, 30);
        
        if (p.random() < 0.15 * smokeIntensity) {
          const randX2 = Math.round(p.random(p.width * 0.02, p.width * 0.98) / GRID) * GRID;
          emitSmoke(randX2, p.height - 2, Math.floor(2 * smokeIntensity), 0.8, 1.6, 14, 24);
        }
      }
    }

    // Optimized smoke particle updates with batching
    let currentTime = p.millis();
    p.noStroke();
    
    for (let i = smokes.length - 1; i >= 0; i--) {
      const sp = smokes[i];
      if (currentTime - sp.birth >= sp.life) { 
        smokes.splice(i, 1); 
        continue; 
      }

      sp.vy *= 0.9999;
      sp.y += sp.vy;

      if (sp.y + sp.size * 0.5 < 0) { 
        smokes.splice(i, 1); 
        continue; 
      }

      sp.size += 0.08;
      
      // Batch calculations
      const sx = Math.round(sp.x / GRID) * GRID;
      const sy = Math.round(sp.y / GRID) * GRID;
      const alpha = p.map(sp.y, p.height, 0, 0, 100 * adaptiveQuality);
      
      if (sp.y > cy) p.fill(255, alpha);
      else p.fill(255, 0, 0, alpha);
      p.square(sx, sy, Math.round(sp.size));
    }

    // Draw mask image with center-relative responsive placement
    if (img) {
      const w = IMG_BASE_W * scaleUI;
      const h = IMG_BASE_H * scaleUI;
      const x = p.width / 2 + IMG_OFFSET_X0 * scaleUI - w / 2;
      const y = p.height / 2 + IMG_OFFSET_Y0 * scaleUI - h / 2;
      p.image(img, x, y, w, h);
    }

    // ---- 3) foreground main gear outlines (no fill -> shows animation) ----
    drawGearOutline(leftX,  cy, gearRad, teethN, +t);
    drawGearOutline(rightX, cy, gearRad, teethN, -t);

    // ---- 4) adaptive circle animation INSIDE each main gear ----
    if (p.frameCount % circleAnimUpdateFrequency === 0) {
      const time = p.millis() / 1000;
      drawCircleAnimInGear(leftX,  cy, gearRad * 0.88, time);
      drawCircleAnimInGear(rightX, cy, gearRad * 0.88, time);
    }

    // ---- hover affects spin speed + GEAR SOUND RATE/PAN ----
    const leftHover  = p.dist(p.mouseX, p.mouseY, leftX,  cy) < gearRad;
    const rightHover = p.dist(p.mouseX, p.mouseY, rightX, cy) < gearRad;
    const hovering   = leftHover || rightHover;
    t += hovering ? 0.08 : 0.03;

    const targetRate = hovering ? RATE_HOVER : RATE_BASE;
    gearRate = p.lerp(gearRate, targetRate, SMOOTH);
    if (gearSound && gearSound.isPlaying()) gearSound.rate(gearRate);

    const targetPan = leftHover ? -0.7 : rightHover ? 0.7 : 0.0;
    gearPan = p.lerp(gearPan, targetPan, SMOOTH);
    if (gearSound && gearSound.isPlaying()) gearSound.pan(gearPan);

    p.drawQuote();

    // ---- draw audio toggle button on top ----
    drawAudioButton();
    
    // Performance monitoring
    if (p.frameCount % 120 === 0) {
      let avgFrameTime = performanceHistory.length > 0 ? 
          performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length : 0;
      console.log(`Sketch3 FPS: ${p.frameRate().toFixed(1)}, Quality: ${(adaptiveQuality * 100).toFixed(0)}%, Frame Time: ${avgFrameTime.toFixed(1)}ms, MiniGears: ${miniGears.length}, Smoke: ${smokes.length}`);
    }
  };

  /* ================== PIPES LAYER ================== */
  function buildPipesLayer() {
    const pg = pipesPG;
    pg.clear(); // keep transparent background
    pg.stroke(40, 0, 0, 140);
    pg.strokeWeight(PIPE_W);
    pg.noFill();
    pg.strokeCap(p.SQUARE);
    pg.strokeJoin(p.MITER);

    const h = TILE / 2;

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        pg.push();
        pg.translate(i * TILE + TILE / 2, j * TILE + TILE / 2);
        pg.rotate(p.HALF_PI * tileRot[j][i]);

        // elbow 1: TOP -> RIGHT via NE
        pg.line(0, -h,  h, -h);
        pg.line( h, -h, h,  0);

        // elbow 2: BOTTOM -> LEFT via SW
        pg.line(0,  h, -h,  h);
        pg.line(-h,  h, -h, 0);

        pg.pop();
      }
    }
  }

  /* ================== CIRCLE ANIM INSIDE GEARS ================== */
  function drawCircleAnimInGear(cx, cy, rMax, time) {
    p.push();
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.arc(cx, cy, rMax, 0, Math.PI * 2);
    p.drawingContext.clip();

    p.translate(cx, cy);
    p.noFill();
    p.stroke(255, 180 * adaptiveQuality);
    p.strokeWeight(1);

    // Adaptive quality parameters
    const NUM_SIDES = Math.floor(20 + (adaptiveQuality * 8)); // 20-28 sides
    const R_START   = 0.12;
    const R_END     = 0.95;
    const R_STEP    = Math.max(0.06, 0.12 - (adaptiveQuality * 0.06)); // Adaptive step
    const SMOOTH_IT = Math.floor(1 + adaptiveQuality); // 1-2 smoothing iterations
    const DIST_AMT  = 0.06;
    const FREQ      = 2.1;

    for (let rn = R_START; rn <= R_END; rn += R_STEP) {
      let pts = makeCircle(NUM_SIDES, rn);
      pts = distortPolygonCircle(pts, time, DIST_AMT, FREQ);
      pts = chaikin(pts, SMOOTH_IT);

      p.beginShape();
      // Optimize vertex drawing
      const rMaxDouble = rMax * 2;
      for (let k = 0; k < pts.length; k++) {
        const px = (pts[k][0] - 0.5) * rMaxDouble;
        const py = (pts[k][1] - 0.5) * rMaxDouble;
        p.vertex(px, py);
      }
      p.endShape(p.CLOSE);
    }

    p.drawingContext.restore();
    p.pop();
  }

  function makeCircle(numSides, radius) {
    const points = [];
    const dTheta = p.TWO_PI / numSides;
    for (let theta = 0; theta < p.TWO_PI; theta += dTheta) {
      const x = 0.5 + radius * Math.cos(theta);
      const y = 0.5 + radius * Math.sin(theta);
      points.push([x, y]);
    }
    return points;
  }

  function distortPolygonCircle(poly, t, amount = 0.06, freq = 2.0) {
    return poly.map(([x, y]) => {
      const cx = x - 0.5;
      const cy = y - 0.5;
      const r  = Math.sqrt(cx*cx + cy*cy);
      const ang = Math.atan2(cy, cx);
      const n = p.noise( Math.cos(ang) * freq + 1.23, Math.sin(ang) * freq + t * 0.4 );
      const nudge = (n - 0.5) * 2 * amount * (0.5 + r);
      const newR = Math.max(0, r + nudge);
      return [0.5 + newR * Math.cos(ang), 0.5 + newR * Math.sin(ang)];
    });
  }

  function chaikin(arr, num) {
    if (num <= 0) return arr;
    let current = arr;
    for (let i = 0; i < num; i++) {
      const out = [];
      for (let j = 0; j < current.length; j++) {
        const a = current[j];
        const b = current[(j + 1) % current.length];
        out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
        out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      current = out;
    }
    return current;
  }

  /* ================== MINI-GEARS ================== */
  function createMiniGearsNoOverlap() {
    miniGears.length = 0;
    let attempts = 0;

    while (miniGears.length < miniGearsTarget && attempts < MAX_ATTEMPTS) {
      attempts++;

      const r = p.random(miniRMin, miniRMax);
      const x = p.random(r + EDGE_PAD, p.width  - r - EDGE_PAD);
      const y = p.random(r + EDGE_PAD, p.height - r - EDGE_PAD);

      const tooCloseLeft  = distSq(x, y, leftX,  cy) < (gearRad + r + PADDING) * (gearRad + r + PADDING);
      const tooCloseRight = distSq(x, y, rightX, cy) < (gearRad + r + PADDING) * (gearRad + r + PADDING);
      if (tooCloseLeft || tooCloseRight) continue;

      let ok = true;
      for (const m of miniGears) {
        if (distSq(x, y, m.x, m.y) < (m.r + r + PADDING) * (m.r + r + PADDING)) { ok = false; break; }
      }
      if (!ok) continue;

      miniGears.push(new MiniGear(x, y, r));
    }
  }

  function distSq(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  class MiniGear {
    constructor(x, y, r) {
      this.x = x; this.y = y; this.r = r;
      this.teeth = p.int(p.random([6, 8, 10, 12]));
      this.dir = p.random([1, -1]);
      this.rot = p.random(p.TWO_PI);
      this.speed = p.random(0.004, 0.012) * this.dir;
      this.strokeCol = p.color(p.random(colors));
      this.fillCol = p.color(1, 200);
      this.lastUpdate = 0;
    }
    
    update() { 
      // Adaptive update frequency
      if (isMobile && adaptiveQuality < 0.8) {
        // Update less frequently on mobile when performance is low
        if (p.frameCount - this.lastUpdate < 2) return;
      }
      this.rot += this.speed * adaptiveQuality; 
      this.lastUpdate = p.frameCount;
    }
    
    draw(pg) {
      // Adaptive rendering quality
      let strokeWeight = Math.max(0.5, 1 * adaptiveQuality);
      drawGearToPG(pg, this.x, this.y, this.r, this.teeth, this.rot, this.fillCol, this.strokeCol, strokeWeight);
      
      // Only draw center circle if quality is good enough
      if (adaptiveQuality > 0.7) {
        pg.noStroke();
        pg.fill(10, 120 * adaptiveQuality);
        pg.circle(this.x, this.y, this.r * 0.22);
      }
    }
  }

  function drawGearToPG(pg, cx, cy, rad, nTeeth, rotation, fillCol, strokeCol, sw) {
    pg.push();
    pg.translate(cx, cy);
    pg.rotate(rotation);
    pg.stroke(strokeCol);
    pg.strokeWeight(sw);
    pg.fill(fillCol);
    
    // Adaptive gear resolution based on performance
    const a = 1, b = 20;
    let numP = Math.floor(60 + (adaptiveQuality * 60)); // 60-120 points
    numP = Math.max(24, numP); // Minimum for recognizable gear shape
    
    pg.beginShape();
    const radScale = rad;
    const twoPI = p.TWO_PI;
    const invB = 1 / b;
    
    for (let i = 0; i < numP; i++) {
      const tt = twoPI * (i / numP);
      const r = a + invB * Math.tanh(b * Math.sin(nTeeth * tt));
      const costt = Math.cos(tt);
      const sintt = Math.sin(tt);
      pg.vertex(radScale * r * costt, radScale * r * sintt);
    }
    pg.endShape(p.CLOSE);
    pg.pop();
  }

  /* ================== MAIN GEARS (OUTLINES) ================== */
  function drawGearOutline(cx, cy, rad, n, rotation) {
    p.push();
    p.translate(cx, cy);
    p.rotate(rotation);
    p.stroke(255);
    p.strokeWeight(1.2);
    p.fill(0);
    const a = 1, b = 20, numP = 360;
    p.beginShape();
    for (let i = 0; i < numP; i++) {
      const tt = p.TWO_PI * (i / numP);
      const rr = a + (1 / b) * Math.tanh(b * Math.sin(n * tt));
      p.vertex(rad * rr * Math.cos(tt), rad * rr * Math.sin(tt));
    }
    p.endShape(p.CLOSE);
    p.pop();
  }

  /* ================== SMOKE ================== */
  p.mouseDragged = () => {
    emitSmoke(p.mouseX, p.mouseY, 14, 1.2, 2.6, 4, 20);

    if (!audioEnabled) return; // respect mute

    // Play smoke sound (throttled), panned by mouse X
    const now = p.millis();
    if (smokeSound && now - lastSmokePlay >= SMOKE_INTERVAL) {
      if (p.getAudioContext().state !== 'running') p.userStartAudio();
      const pan = p.map(p.mouseX, 0, p.width, -0.9, 0.9);
      smokeSound.pan(pan);
      smokeSound.rate(p.random(0.95, 1.05)); // tiny variation
      smokeSound.setVolume(2);
      smokeSound.play();
      lastSmokePlay = now;
    }
  };

  function emitSmoke(x, y, count, speedMin, speedMax, sizeMin, sizeMax) {
    const xSnap = Math.round(x / GRID) * GRID;
    for (let i = 0; i < count; i++) {
      smokes.push({
        x: xSnap,
        y: y,
        vx: 0,
        vy: -p.random(speedMin, speedMax),
        size: p.random(sizeMin, sizeMax),
        birth: p.millis(),
        life: p.random(4000, 7000)
      });
    }
  }

  function clearSmoke() { smokes.length = 10; }
  p.keyPressed = () => { if (p.key === 'c' || p.key === 'C') clearSmoke(); };

  p.drawQuote = () => {
    p.noStroke();
    let textCol = p.color(255);
    p.fill(textCol);

    // Responsive positioning and sizing
    let maxWidth, x, y;
    
    if (isMobile) {
      // Mobile layout - keep text on right side like desktop, but smaller
      maxWidth = p.width * 0.6; // Smaller width for mobile
      x = p.width - maxWidth - 15; // Right side with small margin
      y = p.height * 0.08; // Top area like desktop
      
      // Ensure text doesn't go off screen
      if (x < 15) x = 15;
    } else if (isTablet) {
      // Tablet layout - right side but smaller
      maxWidth = p.width * 0.4;
      x = p.width - maxWidth - 20;
      y = p.height * 0.08;
    } else {
      // Desktop layout - original positioning but responsive
      maxWidth = QUOTE_BASE_W;
      x = p.width - maxWidth - 20; // Always keep text fully visible
      y = p.height * 0.08;
      
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

    let quote = '"We are facing a man-made disaster on a global scale. Our greatest threat in thousands of years. Climate change."';

    p.textSize(mainTextSize);
    p.textStyle(p.BOLD);
    p.textFont('Source Code Pro');
    p.textAlign(p.LEFT);
    p.text(quote, x, y, maxWidth);

    p.textSize(attributionSize);
    p.textStyle(p.NORMAL);
    p.text('— Sir David Attenborough', x + AUTHOR_DX, y + AUTHOR_DY, maxWidth);

    p.textSize(callToActionSize);
    p.fill('#EB0000');
    p.textStyle(p.BOLD);
    let callToAction = 'Cut the fumes, not our breath.';
    p.text(callToAction, x + CTA_DX, y + CTA_DY, maxWidth);

    // Additional safety check to prevent text cutoff
    if (x + maxWidth > p.width - 15) {
      maxWidth = p.width - x - 15;
    }

    // Update quoteBox for hover detection
    const tw = p.textWidth(callToAction);
    const th = p.textAscent() + p.textDescent();
    quoteBox.x = x + CTA_DX;
    quoteBox.y = y + CTA_DY - th;
    quoteBox.w = maxWidth;
    quoteBox.h = th;
  };
};

// Create a new p5 instance and attach it to the div with id 'p5-dekay-canvas'
new p5(industrialSketch, 'p5-dekay-canvas');
