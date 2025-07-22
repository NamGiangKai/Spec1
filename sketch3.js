/**
 * p5.js sketch in instance mode.
 * Phiên bản đã sửa lỗi: Chữ hiển thị đúng và loại bỏ code không cần thiết.
 *
 * @param {p5} p The p5 instance.
 */
const butterflySketch = (p) => {
  let particles = [];
  let centerX, centerY;

  // Setup the canvas and initial particles
  p.setup = () => {
    let canvasContainer = p.select('#p5-dekay-canvas');
    // Ensure the container exists before creating the canvas
    if (canvasContainer) {
      let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
      canvas.parent('p5-dekay-canvas');
    } else {
      console.error("The canvas container '#p5-dekay-canvas' was not found!");
      p.createCanvas(800, 600); // Create a fallback canvas
    }

    centerX = p.width / 2;
    centerY = p.height / 2;

    // A helper function to create a particle with a pre-calculated color
    const createParticle = (x, y, homeX, homeY) => {
      particles.push({
        x,
        y,
        homeX,
        homeY,
        vx: 0,
        vy: 0,
        // --- OPTIMIZATION: Set a random color once, not every frame. ---
        color: p.color(255, p.random(150, 220)) // White with random alpha
      });
    };

    //------ THE BODY ----
    // spine left
    for (let i = 0; i < 500; i++) {
      let t = p.map(i, 0, 20, 1.5, 2.3);
      let curve = p.sin(t * p.PI / 5) * 20;
      let x = centerX - curve;
      let y = centerY + t * 10;
      createParticle(x - 10, y, x + 5, y);
    }

    // spine right
    for (let i = 0; i < 500; i++) {
      let t = p.map(i, 0, 20, 1.5, 2.3);
      let curve = p.sin(t * p.PI / 5) * 20;
      let x = centerX + 10 + curve;
      let y = centerY + t * 10;
      createParticle(x + 10, y, x - 5, y);
    }

    //------ THE WINGS ----
    // Top wings
    for (let i = 0; i < 800; i++) {
      let angle = p.random(-p.PI / 2, p.PI / 2);
      let r = p.random(30, 80);
      // Left
      let x1 = centerX - p.random(400, 50) + r * angle;
      let y1 = centerY + r * p.sin(angle);
      createParticle(x1, y1, x1, y1);
      // Right
      let x2 = centerX + p.random(400, 50) - r * angle;
      let y2 = centerY + r * p.sin(angle);
      createParticle(x2, y2, x2, y2);
    }

    // Bottom wings
    // Left wing
    for (let i = 0; i < 800; i++) {
      let angle = p.random(p.PI / 2, -2 * p.PI / 2);
      let r = p.random(30, 80);
      let x = centerX - p.random(150, 30) + r * p.cos(angle);
      let y = centerY + 80 + r * p.sin(angle) + 50;
      createParticle(x, y, x, y);
    }
    // Right wing
    for (let i = 0; i < 800; i++) {
      let angle = p.random(p.PI / 2, 2 * p.PI);
      let r = p.random(30, 80);
      let x = centerX + p.random(150, 30) + r * p.cos(angle);
      let y = centerY + 130 + r * p.sin(angle);
      createParticle(x, y, x, y);
    }
  };

  // Main draw loop
  p.draw = () => {
    p.background(0);
    writeText(); // FIX: Called directly to ensure text is always drawn

    let d = p.dist(p.mouseX, p.mouseY, centerX, centerY);
    let inSide = d < 120;

    for (let particle of particles) {
      if (inSide) {
        if (p.abs(particle.vx) < 1 && p.abs(particle.vy) < 1) {
          particle.vx += p.random(-4, 4);
          particle.vy += p.random(-2, 2);
        }
      } else {
        let dx = particle.homeX - particle.x;
        let dy = particle.homeY - particle.y;
        particle.vx += dx * 0.1;
        particle.vy += dy * 0.01;
      }

      particle.vx *= 0.7;
      particle.vy *= 0.8;
      particle.x += particle.vx;
      particle.y += particle.vy;

      p.noStroke();
      p.fill(particle.color);
      p.square(particle.x, particle.y, p.random(1, 2.5));
    }

    drawEye();
  };

  function drawEye() {
    p.push();
    p.translate(p.mouseX, p.mouseY);
    let angleToCenter = p.atan2(centerY - p.mouseY, centerX - p.mouseX);

    p.noFill();
    p.stroke(255);
    p.ellipse(0, 0, 90, 40);

    let pupilX = p.cos(angleToCenter) * 10;
    let pupilY = p.sin(angleToCenter) * 20;

    p.noFill();
    p.stroke(255, 0, 0);
    p.ellipse(pupilX, pupilY, 30, 30);
    p.fill(255);
    p.ellipse(pupilX, pupilY, 10, 10);
    p.pop();
  }

  function writeText() {
    p.textFont("Source Code Pro");
    p.textSize(20);

    p.textAlign(p.RIGHT);
    p.fill('white');
    p.noStroke();
    let margin = 50;
    let xRight = p.width - margin;

    p.text('We are facing a man-made disaster on a global scale', xRight, p.height / 6);
    p.text('Our greatest threat in thousands of years. ', xRight - 180, p.height / 5);
    p.text('— Sir David Attenborough, Naturalist and Broadcaster', xRight, p.height / 4);

    p.fill('rgb(234,71,71)');
    p.text('Climate change.', xRight, p.height / 5);

    p.fill('white');
    p.text('We must act urgently and decisively to protect our planet ', xRight, p.height / 1.15);
    p.text('before the damage becomes irreversible.', xRight, p.height / 1.11);
  }
};

// Create a new p5 instance and attach it to the div with id 'p5-dekay-canvas'
new p5(butterflySketch, 'p5-dekay-canvas');
