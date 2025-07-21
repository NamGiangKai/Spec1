const sketch = (p) => {
  let myCentipede;

  let particles = [];
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

    myCentipede = new Centipede(p, p.width / 2, p.height / 2, 60, 8, 0.1);

    regenerateShape();
  };

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

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        let p1 = particles[i];
        let p2 = particles[j];
        if (p1.state === "stable" && p2.state === "stable") {
          let d = p1.pos.dist(p2.pos);
          let connectionDistance = 100;
          if (shapeStyle === 1 || shapeStyle === 4) connectionDistance = 150;
          if (shapeStyle === 3) connectionDistance = 120;
          if (d < connectionDistance) {
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

    drawQuote();
  };

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
  };

  const triggerGenerativeEvent = () => {
    uncannyBg.clear();
    let numEvents = p.floor(p.random(1, 3));
    let shuffledEvents = p.shuffle(eventFunctions);

    for (let i = 0; i < numEvents; i++) {
      shuffledEvents[i](uncannyBg);
    }
    bgAlpha = 200;
  };
  
  const event2 = (buffer) => {
    buffer.background(0, 0, 0);
    let centerX = clickPos.x;
    let centerY = clickPos.y;
    for (let i = 0; i < 100; i++) {
      buffer.stroke(0, 0, 100, p.random(50, 100));
      buffer.strokeWeight(p.random(0.5, 2));
      let angle = p.random(p.TWO_PI);
      let radius = p.random(50, p.width);
      let x2 = centerX + radius * p.cos(angle);
      let y2 = centerY + radius * p.sin(angle);
      buffer.line(centerX, centerY, x2, y2);
    }
  };

  const event3 = (buffer) => {
    buffer.background(0, 0, 95);
    buffer.stroke(0, 0, 0, 60);
    for (let i = 0; i < 50; i++) {
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
  };

  const event5 = (buffer) => {
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
    for (let i = 0; i < 10000; i++) {
      buffer.fill(0, 0, 100, p.random(5));
      buffer.rect(p.random(p.width), p.random(p.height), 1, 1);
    }
  };

  const eventFunctions = [event2, event3, event5];

  const drawQuote = () => {
    p.push();
    const margin = 40;
    const txtSize = 16;
    p.textFont('Source Code Pro');
    p.fill(0, 0, 100, 80);
    p.noStroke();
    p.textSize(txtSize);
    p.textLeading(txtSize * 1.5);

    p.textStyle(p.NORMAL);
    const originalQuote =
      "We are facing a man-made disaster on a global scale.\n\n Our greatest threat in thousands of years. Climate change.\n\n" +
      "-SIR DAVID ATTENBOROUGH";
    p.textAlign(p.RIGHT, p.TOP);
    p.text(originalQuote, p.width - margin, margin);

    p.textStyle(p.BOLD);
    const callToAction = "We must act urgently and \n\ndecisively to protect our \n\nplanet before the damage becomes irreversible.";
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text(callToAction, p.width - margin, p.height - margin);

    p.pop();
  };

  const regenerateShape = () => {
    shapeStyle = (shapeStyle + 1) % 6;
    particles = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle(p, i));
    }
    autoRotate = true;
    regenerationScheduled = false;
  };

  class Centipede {
    constructor(p, x, y, numSegments, segLength, easing) {
      this.p = p;
      this.segments = [];
      this.legs = [];
      this.easing = easing;
      this.segLength = segLength;
      this.gaitPhase = 0;
      this.gaitTimer = 0;
      this.gaitDuration = 25;
      this.time = 0;
      this.headColor = this.p.color(0, 0, 90);

      for (let i = 0; i < numSegments; i++) {
        let scale = 1 - i / numSegments;
        scale = this.p.pow(scale, 1.5);
        let ribLen = this.segLength * 5.8 * scale;
        this.segments.push(new Segment(p, x, y, this.segLength, ribLen));
      }

      for (let i = 5; i < numSegments - 10; i += 7) {
        let scale = 1 - i / numSegments;
        scale = this.p.pow(scale, 1.2);
        let legReach = this.segLength * 6 * scale;
        this.legs.push(new Leg(p, this.segments[i], 1, legReach));
        this.legs.push(new Leg(p, this.segments[i], -1, legReach));
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
      let dir = p5.Vector.sub(head.pos, neck.pos);
      this.p.push();
      this.p.translate(head.pos.x, head.pos.y);
      this.p.rotate(dir.heading());
      this.p.stroke(this.headColor);
      this.p.strokeWeight(1);
      let antennaAngle = this.p.sin(this.time * 0.1) * 0.25;
      this.p.line(0, 0, 15, -5 + antennaAngle * 15);
      this.p.line(0, 0, 15, 5 - antennaAngle * 15);
      this.p.fill(this.headColor);
      this.p.noStroke();
      this.p.beginShape();
      this.p.vertex(8, 0);
      this.p.vertex(-2, -5);
      this.p.vertex(-6, -3);
      this.p.vertex(-6, 3);
      this.p.vertex(-2, 5);
      this.p.endShape(this.p.CLOSE);
      this.p.fill(0, 0, 70);
      this.p.triangle(8, 0, 12, -4, 10, 0);
      this.p.triangle(8, 0, 12, 4, 10, 0);
      this.p.pop();
    }
  }

  class Segment {
    constructor(p, x, y, len, ribLength) {
        this.p = p;
        this.pos = this.p.createVector(x, y);
        this.target = this.p.createVector(x, y);
        this.len = len;
        this.ribLength = ribLength;
    }
    follow(targetPos) {
      let dir = p5.Vector.sub(this.pos, targetPos);
      dir.setMag(this.len);
      this.target = p5.Vector.add(targetPos, dir);
    }
    update(easing) {
      this.pos.lerp(this.target, easing);
    }
    show(nextSegment) {
      this.p.stroke(0, 0, 90, 85);
      this.p.strokeWeight(1.5);
      this.p.line(this.pos.x, this.pos.y, nextSegment.pos.x, nextSegment.pos.y);
      let dir = p5.Vector.sub(this.pos, nextSegment.pos);
      this.p.push();
      this.p.translate(this.pos.x, this.pos.y);
      this.p.rotate(dir.heading());
      this.p.strokeWeight(1);
      let sweepBack = this.ribLength * 0.4;
      let halfRib = this.ribLength * 0.7;
      this.p.line(0, 0, -sweepBack, -halfRib);
      this.p.line(0, 0, -sweepBack, halfRib);
      this.p.pop();
    }
  }

  class Leg {
    constructor(p, parentSegment, side, reach) {
        this.p = p;
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
      let bodyDir = p5.Vector.sub(this.parent.pos, this.parent.target).normalize();
      let perpendicularDir = this.p.createVector(bodyDir.y, -bodyDir.x);
      let stepVector = bodyDir.mult(-this.reach * 0.75);
      stepVector.add(perpendicularDir.mult(this.side * this.reach * 0.5));
      this.targetPos = p5.Vector.add(this.parent.pos, stepVector);
      this.isStepping = true;
    }
    update() {
      if (this.isStepping) {
        this.footPos.lerp(this.targetPos, 0.1);
        if (p5.Vector.dist(this.footPos, this.targetPos) < 1) {
          this.isStepping = false;
        }
      }
      let hip = this.parent.pos;
      let foot = this.footPos;
      let d = p5.Vector.dist(hip, foot);
      d = this.p.min(d, this.upperLegLen + this.lowerLegLen - 1);
      let a = (d * d + this.upperLegLen * this.upperLegLen - this.lowerLegLen * this.lowerLegLen) / (2 * d);
      let h = this.p.sqrt(this.p.max(0, this.upperLegLen * this.upperLegLen - a * a));
      let midPoint = p5.Vector.lerp(hip, foot, a / d);
      let hipToFoot = p5.Vector.sub(foot, hip).normalize();
      let kneeOffset = this.p.createVector(-hipToFoot.y, hipToFoot.x).mult(h * this.side);
      this.kneePos = p5.Vector.add(midPoint, kneeOffset);
    }
    show() {
      this.p.stroke(0, 0, 90, 70);
      this.p.strokeWeight(1.5);
      this.p.line(this.parent.pos.x, this.parent.pos.y, this.kneePos.x, this.kneePos.y);
      this.p.line(this.kneePos.x, this.kneePos.y, this.footPos.x, this.footPos.y);
      this.drawHand();
    }
    drawHand() {
      this.p.push();
      this.p.translate(this.footPos.x, this.footPos.y);
      let dir = p5.Vector.sub(this.footPos, this.kneePos);
      this.p.rotate(dir.heading());
      this.p.stroke(0, 0, 90, 70);
      this.p.strokeWeight(1);
      this.p.line(0, 0, -4, -3);
      this.p.line(0, 0, -4, 0);
      this.p.line(0, 0, -4, 3);
      this.p.pop();
    }
  }

  class Particle {
    constructor(p, index) {
        this.p = p;
        this.index = index;
        this.state = "stable";
        this.lifespan = 255;
        let radius = this.p.min(this.p.width, this.p.height) / 4;

      if (shapeStyle === 0) {
        this.basePos = p5.Vector.random3D().mult(radius);
      } else if (shapeStyle === 1) {
        this.basePos = p5.Vector.random3D().mult(radius + this.p.random(-30, 30));
      } else if (shapeStyle === 2) {
        this.basePos = this.p.createVector(
          this.p.random(-1, 1),
          this.p.random(-1, 1),
          this.p.random(-1, 1)
        ).mult(radius);
        let component = this.p.floor(this.p.random(3));
        let side = this.p.random() > 0.5 ? 1 : -1;
        if (component === 0) this.basePos.x = radius * side;
        else if (component === 1) this.basePos.y = radius * side;
        else this.basePos.z = radius * side;
      } else if (shapeStyle === 3) {
        let tubeRadius = radius * 0.4;
        let mainAngle = this.p.random(this.p.TWO_PI);
        let tubeAngle = this.p.random(this.p.TWO_PI);
        this.basePos = this.p.createVector(
          (radius + tubeRadius * this.p.cos(tubeAngle)) * this.p.cos(mainAngle),
          (radius + tubeRadius * this.p.cos(tubeAngle)) * this.p.sin(mainAngle),
          tubeRadius * this.p.sin(tubeAngle)
        );
      } else if (shapeStyle === 4) {
        let pVec = p5.Vector.random3D();
        let spike = 1 + this.p.noise(pVec.x * 2, pVec.y * 2, pVec.z * 2) * 1.5;
        this.basePos = pVec.mult(radius * spike);
      } else if (shapeStyle === 5) {
        let angle = this.p.random(this.p.TWO_PI);
        let h = this.p.random(-radius, radius);
        let r = radius * 0.8;
        this.basePos = this.p.createVector(r * this.p.cos(angle), h, r * this.p.sin(angle));
      }

      this.pos = this.basePos.copy();
      this.vel = this.p.createVector();
    }

    explode() {
      this.state = "exploding";
      this.vel = this.pos.copy().normalize().mult(this.p.random(4, 9));
      this.vel.add(p5.Vector.random3D().mult(3));
    }

    isDead() {
      return this.lifespan <= 0;
    }

    update() {
      if (this.state === "stable") {
        let x1 = this.basePos.x * this.p.cos(rotationY) - this.basePos.z * this.p.sin(rotationY);
        let z1 = this.basePos.x * this.p.sin(rotationY) + this.basePos.z * this.p.cos(rotationY);
        let y2 = this.basePos.y * this.p.cos(rotationX) - z1 * this.p.sin(rotationX);
        let z2 = this.basePos.y * this.p.sin(rotationX) + z1 * this.p.cos(rotationX);
        this.pos.set(x1, y2, z2);
      } else if (this.state === "exploding") {
        this.pos.add(this.vel);
        this.lifespan -= 2.5;
      }
    }

    getProjectedPoint() {
      let fov = this.p.min(this.p.width, this.p.height) / 1.5;
      let scale = fov / (fov + this.pos.z);
      let x2d = this.pos.x * scale + this.p.width / 2;
      let y2d = this.pos.y * scale + this.p.height / 2;
      return this.p.createVector(x2d, y2d, scale);
    }

    display() {
      if (this.isDead()) return;
      let screenPoint = this.getProjectedPoint();
      let alpha = this.p.map(this.pos.z, -this.p.width / 2, this.p.width / 2, 40, 100);
      if (this.state === "exploding") {
        alpha = this.lifespan;
      }

      let c = currentParticleColor;

      this.p.noStroke();
      this.p.fill(this.p.hue(c), this.p.saturation(c), this.p.brightness(c), alpha);

      let baseSize = 3;
      let size = baseSize * screenPoint.z;
      if (shapeStyle === 2 && this.state === "stable") {
        this.p.rectMode(this.p.CENTER);
        this.p.rect(screenPoint.x, screenPoint.y, size, size);
      } else {
        this.p.ellipse(screenPoint.x, screenPoint.y, size, size);
      }
      if (this.state === "exploding") {
        this.p.stroke(this.p.hue(c), this.p.saturation(c), this.p.brightness(c), this.lifespan);
        this.p.strokeWeight(1.5);
        let trail = this.vel.copy().mult(-5);
        this.p.line(
          screenPoint.x,
          screenPoint.y,
          screenPoint.x + trail.x,
          screenPoint.y + trail.y
        );
      }
    }
  }
};

// Khởi tạo sketch p5 mới
new p5(sketch);

new p5(sketch2, 'sketch-centipede-container');

