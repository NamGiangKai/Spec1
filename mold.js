const createMoldClass = (p, shared) => {
  return class Mold {
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
        4 * (shared.d * p.floor(this.rSensorPos.y)) * (shared.d * p.width) +
        4 * (shared.d * p.floor(this.rSensorPos.x));
      r = p.pixels[index];

      index =
        4 * (shared.d * p.floor(this.lSensorPos.y)) * (shared.d * p.width) +
        4 * (shared.d * p.floor(this.lSensorPos.x));
      l = p.pixels[index];

      index =
        4 * (shared.d * p.floor(this.fSensorPos.y)) * (shared.d * p.width) +
        4 * (shared.d * p.floor(this.fSensorPos.x));
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
        shared.detectedRects.length < shared.maxRects
      ) {
        let rw = p.random(40, 70);
        let rh = p.random(30, 60);

        let overlapping = false;
        for (let rectData of shared.detectedRects) {
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
          shared.detectedRects.push({
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
  };
};
