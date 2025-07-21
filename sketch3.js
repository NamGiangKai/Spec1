const butterflySketch = (p) => {
  let particles = [];
  let centerX, centerY;

  p.setup = () => {
    let canvasContainer = p.select('#p5-dekay-canvas');
    let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('p5-dekay-canvas');
    centerX = p.width / 2;
    centerY = p.height / 2;

    //------THE BODY----
    
    // spine left
    for (let i = 0; i < 500; i++) {
      let t = p.map(i, 0, 20, 1.5, 2); 
      let curve = p.sin(t * p.PI / 5) * 20; // the curve
      
      let x = centerX - curve;  // curve pathway
      let y = centerY + t * 10;      // vertical long

      particles.push({
        x: x - 10,
        y: y,
        homeX: x + 5,
        homeY: y,
        vx: 0,
        vy: 0
      });
    }

    // spine right
    for (let i = 0; i < 500; i++) {
      let t = p.map(i, 0, 20, 1.5, 2);
      let curve = p.sin(t * p.PI / 5) * 20;
      let x = centerX + 10 + curve;  // curve right
      let y = centerY + t * 10;

      particles.push({
        x: x + 10,
        y: y,
        homeX: x - 5,
        homeY: y,
        vx: 0,
        vy: 0
      });
    }

    //-----------------------------------------
    
    //------THE WINGS----

    // --- Top wings
    //Left wing
    for (let i = 0; i < 800; i++) {
      let angle = p.random(-p.PI / 2, p.PI / 2);
      let r = p.random(30, 50);
      let x = centerX - p.random(200, 50) + r * angle;
      let y = centerY + r * p.sin(angle);
      particles.push({ x, y, homeX: x, homeY: y, vx: 0, vy: 0 });
    }
    
    //Right wing
    for (let i = 0; i < 800; i++) {
      let angle = p.random(-p.PI / 2, p.PI / 2);
      let r = p.random(30, 50);
      let x = centerX + p.random(200, 50) - r * angle;
      let y = centerY +  r * p.sin(angle);
      particles.push({ x, y, homeX: x, homeY: y, vx: 0, vy: 0 });
    }

    // --- Bottom wings
    //Left wing
    for (let i = 0; i < 800; i++) {
      let angle = p.random(p.PI / 2, -2 * p.PI / 2); // bottom angles
      let r = p.random(30, 50);
      let x = centerX - p.random(90, 30) + r * p.cos(angle);
      let y = centerY + 80 + r * p.sin(angle);
      
      particles.push({ 
        x, 
        y, 
        homeX: x, 
        homeY: y,
        vx: 0, 
        vy: 0 
      });
    }
    
    //Right wing
    for (let i = 0; i < 800; i++) {
      let angle = p.random(p.PI / 2, 2 * p.PI); // bottom angles
      let r = p.random(30, 50);
      let x = centerX + p.random(90, 30) + r * p.cos(angle);
      let y = centerY + 80 + r * p.sin(angle);
      particles.push({ x, y, homeX: x, homeY: y, vx: 0, vy: 0 });
    }
  };

  p.draw = () => {
    p.background(0);

    //-------cURSOR ENTER IN D(CENTER ROUND)
    let d = p.dist(p.mouseX, p.mouseY, centerX, centerY);
    let inSide = d < 100;

    // ---Conditional
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
      p.fill(p.random(255, 250));
      p.square(particle.x, particle.y, p.random(2));
    }

    drawEye();
  };

  //DA EYE
  const drawEye = () => {
    // p.push() và p.pop() để đảm bảo translate không ảnh hưởng đến các phần khác
    p.push();
    p.translate(p.mouseX, p.mouseY);
    let angleToCenter = p.atan2(centerY - p.mouseY, centerX - p.mouseX);

    p.noFill();
    p.stroke(255);
    p.ellipse(0, 0, 90, 40); // the cursor eye

    // the mid eye (locatin center)
    let pupilX = p.cos(angleToCenter) * 10;
    let pupilY = p.sin(angleToCenter) * 20;

    p.noFill();
    p.stroke(255, 0, 0);
    p.ellipse(pupilX, pupilY, 30, 30); 
    p.fill(255);
    p.ellipse(pupilX, pupilY, 10, 10); 
    p.pop();
  };
};

new p5(butterflySketch, 'p5-dekay-canvas');