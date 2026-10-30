export type Koi = {
  x: number; y: number; angle: number; speed: number;
  alarm: number; awayX: number; awayY: number; phase: number; bend: number;
  distance: number; direction: number; offset: number; offsetSpeed: number; offsetTarget: number;
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const sizes = [1.15, .85, .65, .45];

export class KoiMotion {
  width: number;
  height: number;
  time = 0;
  fish: Koi[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    for (let index = 0; index < sizes.length; index++) {
      const distance = this.track(index).length * [.66, .17, .43, .94][index]!;
      const direction = index % 2 ? -1 : 1;
      const point = this.point(index, distance);
      this.fish.push({ x: point.x, y: point.y, angle: point.angle + (direction < 0 ? Math.PI : 0), speed: 8, alarm: 0, awayX: 0, awayY: 0, phase: index * 2, bend: 0, distance, direction, offset: 0, offsetSpeed: 0, offsetTarget: 0 });
    }
  }

  size(index: number) {
    return clamp(Math.min(this.width * .19, this.height * .27), 80, 250) * sizes[index]!;
  }

  margin(index: number) {
    return Math.min(this.size(index) * .9 + 12, this.width * .38, this.height * .38);
  }

  private track(index: number) {
    const margin = this.margin(index);
    const horizontal = this.width >= this.height;
    const long = (horizontal ? this.width : this.height) / 2 - margin;
    const radius = Math.max(12, (horizontal ? this.height : this.width) / 2 - margin);
    const straight = Math.max(0, 2 * (long - radius));
    return { horizontal, radius, straight, length: 2 * straight + 2 * Math.PI * radius };
  }

  private point(index: number, distance: number) {
    const track = this.track(index);
    const { radius: r, straight: s, length } = track;
    let d = ((distance % length) + length) % length;
    let x: number, y: number, angle: number;
    if (d < s) {
      x = -s / 2 + d; y = -r; angle = 0;
    } else if ((d -= s) < Math.PI * r) {
      const a = -Math.PI / 2 + d / r;
      x = s / 2 + Math.cos(a) * r; y = Math.sin(a) * r; angle = a + Math.PI / 2;
    } else if ((d -= Math.PI * r) < s) {
      x = s / 2 - d; y = r; angle = Math.PI;
    } else {
      d -= s;
      const a = Math.PI / 2 + d / r;
      x = -s / 2 + Math.cos(a) * r; y = Math.sin(a) * r; angle = a + Math.PI / 2;
    }
    if (!track.horizontal) { const previousX = x; x = -y; y = previousX; angle += Math.PI / 2; }
    return { x: this.width / 2 + x, y: this.height / 2 + y, angle };
  }

  resize(width: number, height: number) {
    const progress = this.fish.map((fish, index) => fish.distance / this.track(index).length);
    this.width = width;
    this.height = height;
    for (const [index, fish] of this.fish.entries()) {
      fish.distance = progress[index]! * this.track(index).length;
      const point = this.point(index, fish.distance);
      fish.x = point.x; fish.y = point.y;
      fish.angle = point.angle + (fish.direction < 0 ? Math.PI : 0);
      fish.offset = 0; fish.offsetSpeed = 0; fish.offsetTarget = 0;
    }
  }

  disturb(x: number, y: number) {
    for (const [index, fish] of this.fish.entries()) {
      const dx = fish.x - x, dy = fish.y - y, distance = Math.hypot(dx, dy);
      const radius = Math.max(90, this.size(index) * 1.1);
      if (distance >= radius) continue;
      const strength = .45 + .55 * (1 - distance / radius);
      fish.alarm = Math.max(fish.alarm, strength);
      const point = this.point(index, fish.distance);
      const nx = -Math.sin(point.angle), ny = Math.cos(point.angle);
      const lateral = dx * nx + dy * ny;
      const side = Math.abs(lateral) > 2 ? Math.sign(lateral) : (index % 2 ? -1 : 1);
      fish.awayX = nx * side; fish.awayY = ny * side;
      // Change a spring's target, never position, angle, or lateral velocity.
      // This makes repeated clicks a smooth swerve rather than an instant pivot.
      fish.offsetTarget = side * strength * Math.min(14, this.size(index) * .12);
    }
  }

  step(seconds: number) {
    const dt = clamp(seconds, 0, .1);
    if (!dt) return;
    this.time += dt;
    for (const [index, fish] of this.fish.entries()) {
      const oldX = fish.x, oldY = fish.y, oldAngle = fish.angle;
      const size = this.size(index);
      const cruising = 9 + size * .055;
      const desiredSpeed = cruising + fish.alarm * (22 + size * .08);
      fish.speed += (desiredSpeed - fish.speed) * (1 - Math.exp(-dt * 3));
      fish.distance += fish.speed * dt * fish.direction;
      fish.offsetSpeed += ((fish.offsetTarget - fish.offset) * 4 - fish.offsetSpeed * 3.8) * dt;
      fish.offset += fish.offsetSpeed * dt;
      fish.offsetTarget *= Math.exp(-dt * .65);
      const point = this.point(index, fish.distance);
      const nx = -Math.sin(point.angle), ny = Math.cos(point.angle);
      fish.x = point.x + nx * fish.offset;
      fish.y = point.y + ny * fish.offset;
      // Heading follows actual forward travel. Broad rounded tracks avoid both
      // elliptical tight turns and the stationary rotation caused by wall clamps.
      const desiredAngle = Math.atan2(fish.y - oldY, fish.x - oldX);
      const travelled = Math.hypot(fish.x - oldX, fish.y - oldY);
      const minimumTurnRadius = Math.max(20, Math.min(size * .6, this.track(index).radius * .9));
      const turnLimit = travelled / minimumTurnRadius;
      const difference = Math.atan2(Math.sin(desiredAngle - oldAngle), Math.cos(desiredAngle - oldAngle));
      const turn = clamp(difference, -turnLimit, turnLimit);
      fish.angle = oldAngle + turn;
      const curvature = turn / dt * size / Math.max(fish.speed, 1);
      fish.bend += (clamp(curvature, -1.2, 1.2) - fish.bend) * (1 - Math.exp(-dt * 4));
      fish.phase += dt * (1.8 + fish.speed * .035);
      fish.alarm *= Math.exp(-dt * 1.1);
    }
  }
}
