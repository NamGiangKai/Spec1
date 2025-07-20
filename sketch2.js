const sketch2 = (p) => {
  // ===================================================
  // GLOBAL VARIABLES
  // ===================================================

  let myCentipede;
  let particles = [];
  // Giữ nguyên số lượng hạt đã giảm để cải thiện hiệu suất
  const numParticles = 70;
  let rotationY = 0;
  let rotationX = 0;
  let shapeStyle = -1;
  let autoRotate = true;
  let regenerationScheduled = false;
  let uncannyBg;
  let bgAlpha = 0;
  let clickPos;

  let startBgColor, endBgColor;
  let startParticleColor, endParticleColor;
  let currentParticleColor;
  let clickCounter = 0;
  const maxClicksForTransition = 10;

  // ===================================================
  // P5.JS MAIN FUNCTIONS
  // ===================================================

  p.setup = () => {
    let canvasContainer = p.select('#p5-centipede-canvas');
    let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('p5-centipede-canvas');
    p.colorMode(p.HSB, 360, 100, 100, 100);

    uncannyBg = p.createGraphics(p.width, p.height);
    uncannyBg.colorMode(p.HSB, 360, 100, 100, 100);
    clickPos = p.createVector(p.width / 2, p.height / 2);

    startBgColor = p.color(0, 0, 0);
    endBgColor = p.color(0, 90, 75);
    startParticleColor = p.color(0, 0, 100);
    endParticleColor = p.color(0, 0, 0);
    currentParticleColor = startParticleColor;

    myCentipede = new Centipede(p.width / 2, p.height / 2, 60, 8, 0.1);
    regenerateShape();
  }

  p.draw = () => {
    let lerpAmt = p.min(1, clickCounter / maxClicksForTransition);
    let currentBgColor = p.lerpColor(startBgColor, endBgColor, lerpAmt);
    p.background(currentBgColor);

    currentParticleColor = p.lerpColor(
      startParticleColor,
      endParticleColor,
      lerpAmt
    );

    if (bgAlpha > 0) {
      p.tint(255, bgAlpha);
      p.image(uncannyBg, 0, 0);
      bgAlpha -= 4;
      p.noTint();
    }

    if (autoRotate) {
      rotationY += 0.003;
      rotationX += 0.004;
    } else {
      let rotSpeedY = p.map(p.mouseY, 0, p.height, -0.01, 0.01);
      let rotSpeedX = p.map(p.mouseX, 0, p.width, -0.01, 0.01);
      rotationY += rotSpeedY;
      rotationX += rotSpeedX;
    }

    // --- TỐI ƯU HÓA VÒNG LẶP ---
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        let p1 = particles[i];
        let p2 = particles[j];
        if (p1.state === "stable" && p2.state === "stable") {
          let connectionDistance = 100;
          if (shapeStyle === 1 || shapeStyle === 4) connectionDistance = 150;
          if (shapeStyle === 3) connectionDistance = 120;
          
          // TỐI ƯU HÓA: So sánh bình phương khoảng cách để tránh tính căn bậc hai (sqrt)
          let connectionDistanceSq = connectionDistance * connectionDistance;
          let dSq = (p1.pos.x - p2.pos.x)**2 + (p1.pos.y - p2.pos.y)**2 + (p1.pos.z - p2.pos.z)**2;

          if (dSq < connectionDistanceSq) {
            let screenP1 = p1.getProjectedPoint();
            let screenP2 = p2.getProjectedPoint();
            let avgZ = (p1.pos.z + p2.pos.z) / 2;
            let alpha = p.map(avgZ, -p.width / 2, p.width / 2, 10, 60);
            let c = currentParticleColor;
            p.stroke(p.hue(c), p.saturation(c), p.brightness(c), alpha);
            p.strokeWeight(0.5);
            p.line(screenP1.x, screenP1.y, screenP2.x, screenP2.y);
          }
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      let particle = particles[i];
      particle.update();
      particle.display();
      if (particle.isDead()) {
        particles.splice(i, 1);
      }
    }

    let mouseTarget = p.createVector(p.mouseX, p.mouseY);
    myCentipede.update(mouseTarget);
    myCentipede.show();

    if (particles.length === 0 && !regenerationScheduled) {
      regenerationScheduled = true;
      setTimeout(regenerateShape, 500);
    }
  }

  // ===================================================
  // EVENT HANDLERS & HELPERS
  // ===================================================

  p.mousePressed = () => {
    clickCounter++;
    autoRotate = false;
    clickPos.set(p.mouseX, p.mouseY);
    triggerGenerativeEvent();

    let explosionRadius = 80;
    for (let i = particles.length - 1; i >= 0; i--) {
      let particle = particles[i];
      if (particle.state === "stable") {
        let screenPos = particle.getProjectedPoint();
        let d = p.dist(p.mouseX, p.mouseY, screenPos.x, screenPos.y);
        if (d < explosionRadius) {
          particle.explode();
        }
      }
    }
  }

  const eventFunctions = [event2, event3, event5];

  function triggerGenerativeEvent() {
    uncannyBg.clear();
    let numEvents = p.floor(p.random(1, 3));
    let shuffledEvents = p.shuffle(eventFunctions);
    for (let i = 0; i < numEvents; i++) {
      shuffledEvents[i](uncannyBg);
    }
    bgAlpha = 200;
  }

  function event2(buffer) {
    buffer.background(0, 0, 0);
    let centerX = clickPos.x;
    let centerY = clickPos.y;
    // TỐI ƯU HÓA: Giảm số lần lặp
    for (let i = 0; i < 80; i++) {
      buffer.stroke(0, 0, 100, p.random(50, 100));
      buffer.strokeWeight(p.random(0.5, 2));
      let angle = p.random(p.TWO_PI);
      let radius = p.random(50, p.width);
      let x2 = centerX + radius * p.cos(angle);
      let y2 = centerY + radius * p.sin(angle);
      buffer.line(centerX, centerY, x2, y2);
    }
  }

  function event3(buffer) {
    buffer.background(0, 0, 95);
    buffer.stroke(0, 0, 0, 60);
    // TỐI ƯU HÓA: Giảm số lần lặp
    for (let i = 0; i < 40; i++) {
      let x = p.random(p.width);
      let y = p.random(p.height);
      for (let j = 0; j < 100; j++) {
        buffer.strokeWeight(p.random(0.1, 1.5));
        let angle = p.noise(x * 0.01, y * 0.01, i) * 10;
        let nextX = x + p.cos(angle) * 5;
        let nextY = y + p.sin(angle) * 5;
        buffer.line(x, y, nextX, nextY);
        x = nextX;
        y = nextY;
      }
    }
  }

  function event5(buffer) {
    buffer.background(0, 0, 0);
    let planetRadius = p.width * 1.5;
    let planetY = p.height + planetRadius - 150;
    for (let i = 0; i < 2000; i++) {
      let angle = p.random(-p.PI / 4, p.PI / 4);
      let r = planetRadius + p.random(-10, 10);
      let x = p.width / 2 + r * p.cos(angle + p.PI / 2);
      let y = planetY + r * p.sin(angle + p.PI / 2);
      if (p.dist(p.width / 2, planetY, x, y) < planetRadius) {
        buffer.fill(0, 0, 100, p.random(20, 80));
        buffer.noStroke();
        buffer.ellipse(x, y, p.random(1, 2.5));
      }
    }
    // TỐI ƯU HÓA: Giảm mạnh số lần lặp từ 10000 xuống 2000
    for (let i = 0; i < 2000; i++) {
      buffer.fill(0, 0, 100, p.random(5));
      buffer.rect(p.random(p.width), p.random(p.height), 1, 1);
    }
  }

  function regenerateShape() {
    shapeStyle = (shapeStyle + 1) % 6;
    particles = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle(i));
    }
    autoRotate = true;
    regenerationScheduled = false;
  }

  // ===================================================
  // CLASS DEFINITIONS
  // ===================================================

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
      this.headColor = p.color(0, 0, 90);

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
      for (let i = 1; i < this.segments.length; i++) {
        this.segments[i].follow(this.segments[i - 1].pos);
        this.segments[i].update(this.easing);
      }
      this.gaitTimer++;
      if (this.gaitTimer > this.gaitDuration) {
        this.gaitTimer = 0;
        this.gaitPhase = 1 - this.gaitPhase;
        for (const leg of this.legs) {
          if (
            (this.gaitPhase === 0 && leg.side === 1) ||
            (this.gaitPhase === 1 && leg.side === -1)
          ) {
            leg.findNewTarget();
          }
        }
      }
      for (const leg of this.legs) {
        leg.update();
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
      let dir = p.constructor.Vector.sub(head.pos, neck.pos);
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
      p.fill(0, 0, 70);
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
      let dir = p.constructor.Vector.sub(this.pos, targetPos);
      dir.setMag(this.len);
      this.target = p.constructor.Vector.add(targetPos, dir);
    }
    update(easing) {
      this.pos.lerp(this.target, easing);
    }
    show(nextSegment) {
      p.stroke(0, 0, 90, 85);
      p.strokeWeight(1.5);
      p.line(this.pos.x, this.pos.y, nextSegment.pos.x, nextSegment.pos.y);
      let dir = p.constructor.Vector.sub(this.pos, nextSegment.pos);
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
      let bodyDir = p.constructor.Vector.sub(
        this.parent.pos,
        this.parent.target
      ).normalize();
      let perpendicularDir = p.createVector(bodyDir.y, -bodyDir.x);
      let stepVector = bodyDir.mult(-this.reach * 0.75);
      stepVector.add(perpendicularDir.mult(this.side * this.reach * 0.5));
      this.targetPos = p.constructor.Vector.add(this.parent.pos, stepVector);
      this.isStepping = true;
    }
    update() {
      if (this.isStepping) {
        this.footPos.lerp(this.targetPos, 0.1);
        if (p.constructor.Vector.dist(this.footPos, this.targetPos) < 1) {
          this.isStepping = false;
        }
      }
      let hip = this.parent.pos;
      let foot = this.footPos;
      let d = p.constructor.Vector.dist(hip, foot);
      d = p.min(d, this.upperLegLen + this.lowerLegLen - 1);
      let a =
        (d * d +
          this.upperLegLen * this.upperLegLen -
          this.lowerLegLen * this.lowerLegLen) /
        (2 * d);
      let h = p.sqrt(p.max(0, this.upperLegLen * this.upperLegLen - a * a));
      let midPoint = p.constructor.Vector.lerp(hip, foot, a / d);
      let hipToFoot = p.constructor.Vector.sub(foot, hip).normalize();
      let kneeOffset = p.createVector(-hipToFoot.y, hipToFoot.x).mult(
        h * this.side
      );
      this.kneePos = p.constructor.Vector.add(midPoint, kneeOffset);
    }
    show() {
      p.stroke(0, 0, 90, 70);
      p.strokeWeight(1.5);
      p.line(this.parent.pos.x, this.parent.pos.y, this.kneePos.x, this.kneePos.y);
      p.line(this.kneePos.x, this.kneePos.y, this.footPos.x, this.footPos.y);
      this.drawHand();
    }
    drawHand() {
      p.push();
      p.translate(this.footPos.x, this.footPos.y);
      let dir = p.constructor.Vector.sub(this.footPos, this.kneePos);
      p.rotate(dir.heading());
      p.stroke(0, 0, 90, 70);
      p.strokeWeight(1);
      p.line(0, 0, -4, -3);
      p.line(0, 0, -4, 0);
      p.line(0, 0, -4, 3);
      p.pop();
    }
  }

  class Particle {
    constructor(index) {
      this.index = index;
      this.state = "stable";
      this.lifespan = 255;
      let radius = p.min(p.width, p.height) / 4;

      if (shapeStyle === 0) {
        this.basePos = p.constructor.Vector.random3D().mult(radius);
      } else if (shapeStyle === 1) {
        this.basePos = p.constructor.Vector.random3D().mult(radius + p.random(-30, 30));
      } else if (shapeStyle === 2) {
        this.basePos = p.createVector(
          p.random(-1, 1),
          p.random(-1, 1),
          p.random(-1, 1)
        ).mult(radius);
        let component = p.floor(p.random(3));
        let side = p.random() > 0.5 ? 1 : -1;
        if (component === 0) this.basePos.x = radius * side;
        else if (component === 1) this.basePos.y = radius * side;
        else this.basePos.z = radius * side;
      } else if (shapeStyle === 3) {
        let tubeRadius = radius * 0.4;
        let mainAngle = p.random(p.TWO_PI);
        let tubeAngle = p.random(p.TWO_PI);
        this.basePos = p.createVector(
          (radius + tubeRadius * p.cos(tubeAngle)) * p.cos(mainAngle),
          (radius + tubeRadius * p.cos(tubeAngle)) * p.sin(mainAngle),
          tubeRadius * p.sin(tubeAngle)
        );
      } else if (shapeStyle === 4) {
        let v = p.constructor.Vector.random3D();
        let spike = 1 + p.noise(v.x * 2, v.y * 2, v.z * 2) * 1.5;
        this.basePos = v.mult(radius * spike);
      } else if (shapeStyle === 5) {
        let angle = p.random(p.TWO_PI);
        let h = p.random(-radius, radius);
        let r = radius * 0.8;
        this.basePos = p.createVector(r * p.cos(angle), h, r * p.sin(angle));
      }

      this.pos = this.basePos.copy();
      this.vel = p.createVector();
    }

    explode() {
      this.state = "exploding";
      this.vel = this.pos.copy().normalize().mult(p.random(4, 9));
      this.vel.add(p.constructor.Vector.random3D().mult(3));
    }

    isDead() {
      return this.lifespan <= 0;
    }

    update() {
      if (this.state === "stable") {
        let x1 =
          this.basePos.x * p.cos(rotationY) - this.basePos.z * p.sin(rotationY);
        let z1 =
          this.basePos.x * p.sin(rotationY) + this.basePos.z * p.cos(rotationY);
        let y2 = this.basePos.y * p.cos(rotationX) - z1 * p.sin(rotationX);
        let z2 = this.basePos.y * p.sin(rotationX) + z1 * p.cos(rotationX);
        this.pos.set(x1, y2, z2);
      } else if (this.state === "exploding") {
        this.pos.add(this.vel);
        this.lifespan -= 2.5;
      }
    }

    getProjectedPoint() {
      let fov = p.min(p.width, p.height) / 1.5;
      let scale = fov / (fov + this.pos.z);
      let x2d = this.pos.x * scale + p.width / 2;
      let y2d = this.pos.y * scale + p.height / 2;
      return p.createVector(x2d, y2d, scale);
    }

    display() {
      if (this.isDead()) return;
      let screenPoint = this.getProjectedPoint();
      let alpha = p.map(this.pos.z, -p.width / 2, p.width / 2, 40, 100);
      if (this.state === "exploding") {
        alpha = this.lifespan;
      }

      let c = currentParticleColor;

      p.noStroke();
      p.fill(p.hue(c), p.saturation(c), p.brightness(c), alpha);

      let baseSize = 3;
      let size = baseSize * screenPoint.z;
      if (shapeStyle === 2 && this.state === "stable") {
        p.rectMode(p.CENTER);
        p.rect(screenPoint.x, screenPoint.y, size, size);
      } else {
        p.ellipse(screenPoint.x, screenPoint.y, size, size);
      }
      if (this.state === "exploding") {
        p.stroke(p.hue(c), p.saturation(c), p.brightness(c), this.lifespan);
        p.strokeWeight(1.5);
        let trail = this.vel.copy().mult(-5);
        p.line(
          screenPoint.x,
          screenPoint.y,
          screenPoint.x + trail.x,
          screenPoint.y + trail.y
        );
      }
    }
  }
};


new p5(centipedeSketch, 'p5-centipede-canvas');

