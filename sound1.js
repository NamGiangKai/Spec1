// sound1.js được chuyển thành một lớp (class) để tương thích với instance mode.

class SoundManager {
  // Hàm khởi tạo (constructor) nhận vào instance của p5 (biến 'p')
  constructor(p) {
    this.p = p; // Lưu lại instance p5 để sử dụng trong các hàm khác
    this.maybeSound = null; // Biến 'maybeSound' giờ là một thuộc tính của lớp
  }

  // *** THAY ĐỔI: Hàm load() thay thế cho preload() ***
  // Hàm này sẽ được gọi từ bên trong setup() của sketch chính.
  load() {
    // Sử dụng this.p để gọi hàm loadSound() của instance p5 cụ thể
    this.maybeSound = this.p.loadSound('maybe.wav');
  }

  // Hàm phát nhạc
  playMaybeSound() {
    // Thêm kiểm tra sound đã được tải chưa (isLoaded)
    if (this.maybeSound && this.maybeSound.isLoaded() && !this.maybeSound.isPlaying()) {
      this.maybeSound.loop();
    }
  }

  // Hàm dừng nhạc
  stopMaybeSound() {
    if (this.maybeSound && this.maybeSound.isLoaded() && this.maybeSound.isPlaying()) {
      this.maybeSound.stop();
    }
  }
}
