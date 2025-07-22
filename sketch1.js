let sketch1 = (p) => {
  let molds = [];
  let num = 700;
  let d;
  let detectedRects = [];
  let maxRects = 5;

  class Mold {
    constructor() {
      let baseSpread = 50;
      let centerX = p.width / 2;
      this.x = p.random(centerX - baseSpread, centerX + baseSpread);
      this.y = p.random(p.height / 2, p.height * 2);

      this.r = 0.5;
      this.baseHeading = -90;
      this.heading = this.baseHeading;
      this.rotAngle = 40;
      this.sensorAngle = 45;
      this.sensorDist = 10;

      this.rSensorPos = p.createVector(0, 0);
      this.lSensorPos = p.createVector(0, 0);
      this.fSensorPos = p.createVector(0, 0);
    }

    update() {
      let vx = p.cos(this.heading);
      let vy = p.sin(this.heading);
      this.x += vx;
      this.y += vy;

      if (this.y > p.height * 0.8) {
        let centerX = p.width / 2;
        let edgeLimit = 20;
        this.x = p.constrain(this.x, centerX - edgeLimit, centerX + edgeLimit);
      }

      this.vx = p.cos(this.heading);
      this.vy = p.sin(this.heading);
      this.x = (this.x + this.vx + p.width) % p.width;
      this.y = (this.y + this.vy + p.height) % p.height;

      this.getSensorPos(this.rSensorPos, this.heading + this.sensorAngle);
      this.getSensorPos(this.lSensorPos, this.heading - this.sensorAngle);
      this.getSensorPos(this.fSensorPos, this.heading);

      let index, l, r, f;
      index =
        4 * (d * p.floor(this.rSensorPos.y)) * (d * p.width) +
        4 * (d * p.floor(this.rSensorPos.x));
      r = p.pixels[index];

      index =
        4 * (d * p.floor(this.lSensorPos.y)) * (d * p.width) +
        4 * (d * p.floor(this.lSensorPos.x));
      l = p.pixels[index];

      index =
        4 * (d * p.floor(this.fSensorPos.y)) * (d * p.width) +
        4 * (d * p.floor(this.fSensorPos.x));
      f = p.pixels[index];

      if (f > l && f > r) {
        this.heading += 0;
      } else if (f < l && f < r) {
        if (p.random(1) < 0.5) {
          this.heading += this.rotAngle;
        } else {
          this.heading -= this.rotAngle;
        }
      } else if (l > r) {
        this.heading -= this.rotAngle;
      } else if (l < r) {
        this.heading += this.rotAngle;
      }
    }

    display() {
      p.noStroke();
      p.fill(255);
      p.ellipse(this.x, this.y, this.r * 2, this.r * 2);

      if (
        this.y < p.height / 1.5 &&
        p.random(4) < 0.01 &&
        detectedRects.length < maxRects
      ) {
        let rw = p.random(40, 70);
        let rh = p.random(30, 60);

        let overlapping = false;
        for (let rectData of detectedRects) {
          let dx = p.abs(this.x - rectData.x);
          let dy = p.abs(this.y - rectData.y);
          if (
            dx < (rw + rectData.w) / 2 + 10 &&
            dy < (rh + rectData.h) / 2 + 10
          ) {
            overlapping = true;
            break;
          }
        }

        if (
          !overlapping &&
          this.x - rw / 2 >= 0 &&
          this.x + rw / 2 <= p.width &&
          this.y - rh / 2 >= 0 &&
          this.y + rh / 2 <= p.height
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
      sensor.x =
        (this.x + this.sensorDist * p.cos(angle) + p.width) % p.width;
      sensor.y =
        (this.y + this.sensorDist * p.sin(angle) + p.height) % p.height;
    }
  }

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

      if (p.frameCount % 5 === 0 && molds.length < 5000) {
        molds.push(new Mold());
      }
    }

    // --- FIX HERE: fill(255) rõ ràng và không cần truyền "255" chuỗi nữa ---
    function myRect(x, y) {
      p.noStroke();
      p.fill(255);
      p.rect(x, y, 60, 60);
    }

    function myArt(x, y) {
      myRect(100 + x, 150 + y);
      myRect(150 + x, 160 + y);
      myRect(180 + x, 170 + y);
      myRect(50 + x, 170 + y);
    }

 // Đặt ngoài p.draw() — thường ở đầu file hoặc ngay trước p.setup()
const myArtPositions = [
  { x: 1050, y: 660 },
  { x: 1200, y: 660 },
  { x: 1250, y: 650 },
  { x: 1200, y: 710 },
  { x: 1100, y: 700 },
  { x: 1230, y: 730 },
  { x: 1070, y: 620 },
  { x: 1070, y: 580 },
];

// Trong p.draw(), tại vị trí bạn từng gọi các myArt(...) riêng lẻ
myArtPositions.forEach(pos => {
  myArt(pos.x, p.height - pos.y);
});


    // --- Vẽ chữ ---
    let quote =
      '"We are facing a man-made disaster on a global scale. Our greatest threat in thousands of years. Climate change."';
    let x = 1270;
    let y = p.height - 530;
    let maxWidth = 290;
    p.textSize(12);
    p.textStyle(p.BOLD);
    p.textFont("Source Code Pro");
    p.fill('black');
    p.textAlign(p.LEFT);
    p.text(quote, x, y, maxWidth);

    p.textSize(10);
    p.textStyle(p.ITALIC);
    p.text("— Sir David Attenborough", 1320, p.height - 470, maxWidth);

    p.textSize(11);
    p.textStyle(p.NORMAL);
    p.fill(255);
    p.text(
      "We must act urgently and decisively to protect our planet before the damage becomes irreversible.", 1390, p.height - 435,200
    );
  };
};

new p5(sketch1, 'p5-canvas-container');
