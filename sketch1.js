let sketch1 = (p) => {
  let molds = [];
  let num = 500;
  let d;
  let detectedRects = [];
  let maxRects = 5;

  p.setup = () => {
    let canvasContainer = p.select('#p5-canvas-container');
    let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('p5-canvas-container');
    p.angleMode(p.DEGREES);
    d = p.pixelDensity();

    for (let i = 0; i < num; i++) {
      molds[i] = new Mold(p);
    }
  };

  p.draw = () => {
    p.background(0, 7);
    p.loadPixels();
    p.updatePixels();

    for (let mold of molds) {
      mold.update();
      mold.display();
    }

    p.noFill();
    p.stroke("#E0223A");
    p.strokeWeight(1);
    p.rectMode(p.CENTER);

    for (let i = detectedRects.length - 1; i >= 0; i--) {
      let r = detectedRects[i];
      p.rect(r.x, r.y, r.w, r.h);
      r.life--;
      if (r.life <= 0) {
        detectedRects.splice(i, 1);
      }
    }

    if (p.frameCount % 5 === 0 && molds.length < 5000) {
      molds.push(new Mold(p));
    }
  };

  class Mold {
    constructor(pInst) {
      this.p = pInst;
      let baseSpread = 50;
      let centerX = this.p.width / 2;
      this.x = this.p.random(centerX - baseSpread, centerX + baseSpread);
      this.y = this.p.random(this.p.height / 2, this.p.height * 2);

      this.r = 0.5;
      this.baseHeading = -90;
      this.heading = this.baseHeading;
      this.rotAngle = 40;
      this.sensorAngle = 45;
      this.sensorDist = 10;

      this.rSensorPos = this.p.createVector(0, 0);
      this.lSensorPos = this.p.createVector(0, 0);
      this.fSensorPos = this.p.createVector(0, 0);
    }

    update() {
      let vx = this.p.cos(this.heading);
      let vy = this.p.sin(this.heading);
      const upForce = this.p.createVector(0, -0.5);
      let move = this.p.createVector(vx, vy);
      move.add(upForce);
      this.x += vx;
      this.y += vy;

      if (this.y > this.p.height * 0.8) {
        let centerX = this.p.width / 2;
        let edgeLimit = 20;
        this.x = this.p.constrain(this.x, centerX - edgeLimit, centerX + edgeLimit);
      }

      this.vx = this.p.cos(this.heading);
      this.vy = this.p.sin(this.heading);

      this.x = (this.x + this.vx + this.p.width) % this.p.width;
      this.y = (this.y + this.vy + this.p.height) % this.p.height;

      this.getSensorPos(this.rSensorPos, this.heading + this.sensorAngle);
      this.getSensorPos(this.lSensorPos, this.heading - this.sensorAngle);
      this.getSensorPos(this.fSensorPos, this.heading);

      let index, l, r, f;
      index = 4 * (d * this.p.floor(this.rSensorPos.y)) * (d * this.p.width) +
              4 * (d * this.p.floor(this.rSensorPos.x));
      r = this.p.pixels[index];

      index = 4 * (d * this.p.floor(this.lSensorPos.y)) * (d * this.p.width) +
              4 * (d * this.p.floor(this.lSensorPos.x));
      l = this.p.pixels[index];

      index = 4 * (d * this.p.floor(this.fSensorPos.y)) * (d * this.p.width) +
              4 * (d * this.p.floor(this.fSensorPos.x));
      f = this.p.pixels[index];

      if (f > l && f > r) {
        this.heading += 0;
      } else if (f < l && f < r) {
        if (this.p.random(1) < 0.5) {
          this.heading += this.rotAngle;
        }
      } else if (l > r) {
        this.heading += -this.rotAngle;
      } else if (l < r) {
        this.heading += this.rotAngle;
      }
    }

    display() {
      this.p.noStroke();
      this.p.fill(255);
      this.p.ellipse(this.x, this.y, this.r * 2, this.r * 2);

      if (
        this.y < this.p.height / 1.5 &&
        this.p.random(4) < 0.01 &&
        detectedRects.length < maxRects
      ) {
        let rw = this.p.random(40, 70);
        let rh = this.p.random(30, 60);

        let overlapping = false;
        for (let rectData of detectedRects) {
          let dx = this.p.abs(this.x - rectData.x);
          let dy = this.p.abs(this.y - rectData.y);
          if (dx < (rw + rectData.w) / 2 + 10 &&
              dy < (rh + rectData.h) / 2 + 10) {
            overlapping = true;
            break;
          }
        }

        if (
          !overlapping &&
          this.x - rw / 2 >= 0 &&
          this.x + rw / 2 <= this.p.width &&
          this.y - rh / 2 >= 0 &&
          this.y + rh / 2 <= this.p.height
        ) {
          detectedRects.push({
            x: this.x,
            y: this.y,
            w: rw,
            h: rh,
            life: 5,
          });
        }
      }
    }

    getSensorPos(sensor, angle) {
      sensor.x = (this.x + this.sensorDist * this.p.cos(angle) + this.p.width) % this.p.width;
      sensor.y = (this.y + this.sensorDist * this.p.sin(angle) + this.p.height) % this.p.height;
    }
  }
};

new p5(sketch1, 'p5-canvas-container');
