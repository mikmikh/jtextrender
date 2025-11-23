export class JCanv {
  constructor(selector, width = 600, height = 600) {
    this.canvas = document.querySelector(selector);
    this.ctx = this.canvas.getContext("2d");
    this.width = width;
    this.height = height;
    this.resize(width, height);
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawLine(sx, sy, ex, ey) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(sx, sy);
    this.ctx.lineTo(ex, ey);
    this.ctx.stroke();
    this.ctx.restore();
  }
  fillPath(points, color = "red") {
    this.ctx.save();

    const p0 = points[0];
    this.ctx.beginPath();
    this.ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      this.ctx.lineTo(p[0], p[1]);
    }
    this.ctx.lineTo(p0[0], p0[1]);
    this.ctx.closePath();

    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.restore();
  }
}
