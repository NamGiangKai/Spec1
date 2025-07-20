class Mold {
  constructor() {
    let baseSpread = 50; //giới hạn vị trí ban đầu quanh tâm
    let centerX = width / 2; // tọa độ trung tâm của canvas theo chiều ngang (trục X).
    this.x = random(centerX - baseSpread, centerX + baseSpread); //Tạo vị trí bắt đầu theo trục X cho mold — nằm trong khoảng ±50px quanh tâm màn hình.
    this.y = random(height / 2, height * 2); //Vị trí bắt đầu theo trục Y nằm từ nửa màn hình xuống đến gấp đôi chiều cao canvas. 

    this.r = 0.5; //Bán kính của hình tròn đại diện cho mold
    this.baseHeading = -90; 
    this.heading = this.baseHeading; //Hướng di chuyển ban đầu là -90 độ (tức là thẳng lên trên)
    this.rotAngle = 40; //Tức là mỗi khi mold “nhìn” thấy pixel sáng hơn ở bên trái hoặc phải, nó sẽ quay sang hướng đó một góc 40 độ.
    this.sensorAngle = 45; //Góc lệch cho cảm biến trái/phải so với hướng chính (phạm vi tầm nhìn)
    this.sensorDist = 10; //Có nghĩa là 3 cảm biến (trái, phải, trước) sẽ đặt cách tâm mold 10 pixel theo hướng tương ứng.

    this.rSensorPos = createVector(0, 0);
    this.lSensorPos = createVector(0, 0);
    this.fSensorPos = createVector(0, 0);
  }
// Tính vector hướng di chuyển theo heading hiện tại (cos, sin)
  update() {
    let vx = cos(this.heading);
    let vy = sin(this.heading);
    const upForce = createVector(0, -0.5); //Tạo một lực đẩy hướng lên trên (trục Y âm = đi lên trong hệ tọa độ canvas). Có thể dùng để mô phỏng gió, trọng lực ngược, lực hút, v.v. 
    let move = createVector(vx, vy);//Tạo vector move là hướng di chuyển chính của mold dựa theo hướng nhìn (heading).
    move.add(upForce); //Cộng thêm lực phụ upForce vào hướng di chuyển chính → giúp mold trườn lên trên nhẹ nhàng, không chỉ đi theo hướng đang nhìn.Kết quả: mold vừa đi theo hướng đang nhìn, vừa bị kéo nhẹ lên trên, tạo cảm giác trườn nhầy như slime.
    this.x += vx;
    this.y += vy; // Cập nhật vị trí this.x, this.y của đối tượng (mold) bằng cách di chuyển thêm một đoạn nhỏ theo hướng vx, vy – là hướng mà mold đang nhìn tới.

    if (this.y > height * 0.8) {
      //Nếu vị trí tọa độ y (chiều cao) của mold vượt quá 80% chiều cao màn hình (gần đáy màn hình), thì làm gì đó.
      let centerX = width / 2;
      // Xác định vị trí trung tâm theo chiều ngang của màn hình.
      let edgeLimit = 20;
      //Khoảng cách giới hạn 20 pixel từ tâm sang trái hoặc phải.
      this.x = constrain(this.x, centerX - edgeLimit, centerX + edgeLimit);
      //Giới hạn vị trí x của mold trong khoảng từ (centerX - 20) đến (centerX + 20). Dùng hàm constrain(value, min, max) để ép giá trị this.x không được vượt ra ngoài vùng này.
    }
  
    //Tính vector hướng dựa trên góc quay this.heading. cos(this.heading) là thành phần theo trục X → this.vx sin(this.heading) là thành phần theo trục Y → this.vy

    this.vx = cos(this.heading);
    this.vy = sin(this.heading);
    
//Cập nhật lại vị trí x, y bằng cách:Cộng thêm hướng di chuyển vx, vy. Dùng % width và % height để wrap vị trí quanh canvas.
    this.x = (this.x + this.vx + width) % width;
    this.y = (this.y + this.vy + height) % height;
    
    //Cập nhật lại vị trí của các cảm biến gắn trên mold, để chúng có thể "đọc" pixel ở các hướng khác nhau.
    this.getSensorPos(this.rSensorPos, this.heading + this.sensorAngle);

    this.getSensorPos(this.lSensorPos, this.heading - this.sensorAngle);

    this.getSensorPos(this.fSensorPos, this.heading);

    // Lấy pixel data (tu)
    let index, l, r, f;
    index =
      4 * (d * floor(this.rSensorPos.y)) * (d * width) +
      4 * (d * floor(this.rSensorPos.x));
    r = pixels[index];

    index =
      4 * (d * floor(this.lSensorPos.y)) * (d * width) +
      4 * (d * floor(this.lSensorPos.x));
    l = pixels[index];

    index =
      4 * (d * floor(this.fSensorPos.y)) * (d * width) +
      4 * (d * floor(this.fSensorPos.x));
    f = pixels[index];

    // Logic xoay hướng dựa trên pixel sáng hơn
    if (f > l && f > r) {
      this.heading += 0;
    } else if (f < l && f < r) {
      if (random(1) < 0.5) {
        this.heading += this.rotAngle;
      }
    } else if (l > r) {
      this.heading += -this.rotAngle;
    } else if (l < r) {
      this.heading += this.rotAngle;
    }
  }

  display() {
    noStroke();
    fill(255);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);

    if (
      this.y < height / 1.5 &&
      random(4) < 0.01 &&
      detectedRects.length < maxRects
    ) {
      let rw = random(40, 70);
      let rh = random(30, 60);

      let overlapping = false;
      for (let rectData of detectedRects) {
        let dx = abs(this.x - rectData.x);
        let dy = abs(this.y - rectData.y);
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
        this.x + rw / 2 <= width &&
        this.y - rh / 2 >= 0 &&
        this.y + rh / 2 <= height
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
    sensor.x = (this.x + this.sensorDist * cos(angle) + width) % width;
    sensor.y = (this.y + this.sensorDist * sin(angle) + height) % height;
  }
}
