import assert from 'node:assert/strict';
import test from 'node:test';
import { KoiMotion } from '../src/scripts/koi-motion.ts';

test('a nearby click turns a fish away, speeds it up, and leaves distant fish calm', () => {
  const pond = new KoiMotion(1440, 900);
  const fish = pond.fish[2];
  const nx = -Math.sin(fish.angle), ny = Math.cos(fish.angle);
  const tap = { x: fish.x - nx * 20, y: fish.y - ny * 20 };
  pond.disturb(tap.x, tap.y);
  assert.ok(fish.alarm > .7);
  assert.ok(pond.fish.some(other => other !== fish && other.alarm === 0));
  assert.ok(fish.awayX * nx + fish.awayY * ny > .9);
  for (let step = 0; step < 24; step++) pond.step(1 / 30);
  assert.ok(Math.abs(fish.offset) > 1, 'fish should swerve away from the disturbance');
  assert.ok(fish.speed > 15, 'fish should briefly accelerate');
  for (let step = 0; step < 180; step++) pond.step(1 / 30);
  assert.ok(fish.alarm < .001, 'the startle must decay');
});

test('a click exactly on a fish produces a finite escape direction', () => {
  const pond = new KoiMotion(390, 844);
  for (const fish of pond.fish) {
    pond.disturb(fish.x, fish.y);
    assert.ok(Number.isFinite(fish.awayX) && Number.isFinite(fish.awayY));
    assert.ok(Math.hypot(fish.awayX, fish.awayY) > .99);
  }
});

test('a head-on disturbance produces a forward arc, not an axial spin or a snap back', () => {
  const pond = new KoiMotion(1920, 1080);
  const fish = pond.fish[0];
  const start = { x: fish.x, y: fish.y, angle: fish.angle };
  pond.disturb(fish.x + Math.cos(fish.angle) * 40, fish.y + Math.sin(fish.angle) * 40);
  let totalTurn = 0, distance = 0;
  for (let frame = 0; frame < 180; frame++) {
    const previous = { x: fish.x, y: fish.y, angle: fish.angle };
    pond.step(1 / 30);
    const travelled = Math.hypot(fish.x - previous.x, fish.y - previous.y);
    const turned = Math.abs(Math.atan2(Math.sin(fish.angle - previous.angle), Math.cos(fish.angle - previous.angle)));
    assert.ok(turned <= travelled / (pond.size(0) * .45) + .005, 'turning must follow distance travelled');
    totalTurn += turned;
    distance += travelled;
  }
  assert.ok(distance > 140, 'the fish must keep swimming through the response');
  assert.ok(totalTurn < Math.PI / 2, 'one click must not trigger a U-turn or spin');
  assert.ok((fish.x - start.x) * Math.cos(start.angle) + (fish.y - start.y) * Math.sin(start.angle) > 100, 'the response must continue forward');
});

for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1440, 900], [1920, 1080]]) {
  test(`four distinct sizes stay on screen under repeated clicks at ${width}×${height}`, () => {
    const pond = new KoiMotion(width, height);
    assert.equal(new Set(pond.fish.map((_, index) => pond.size(index))).size, 4);
    for (let step = 0; step < 3600; step++) {
      if (step % 30 === 0) {
        const fish = pond.fish[(step / 30) % 4];
        pond.disturb(fish.x + Math.sin(step) * 25, fish.y + Math.cos(step) * 25);
      }
      const before = pond.fish.map(fish => ({ ...fish }));
      pond.step(1 / 30);
      for (const [index, fish] of pond.fish.entries()) {
        const margin = pond.margin(index);
        assert.ok(Object.values(fish).every(Number.isFinite));
        assert.ok(fish.x >= margin - 16 && fish.x <= width - margin + 16);
        assert.ok(fish.y >= margin - 16 && fish.y <= height - margin + 16);
        const old = before[index];
        const travelled = Math.hypot(fish.x - old.x, fish.y - old.y);
        const turned = Math.abs(Math.atan2(Math.sin(fish.angle - old.angle), Math.cos(fish.angle - old.angle)));
        assert.ok(travelled >= .1 || turned <= .002, 'fish must not pivot at the screen edge');
      }
    }
    pond.resize(height, width);
    for (const [index, fish] of pond.fish.entries()) {
      const margin = pond.margin(index);
      assert.ok(fish.x >= margin && fish.x <= height - margin);
      assert.ok(fish.y >= margin && fish.y <= width - margin);
    }
  });
}

test('motion is consistent at 30 and 60 updates per second', () => {
  const slow = new KoiMotion(1440, 900), fast = new KoiMotion(1440, 900);
  for (let frame = 0; frame < 600; frame++) slow.step(1 / 30);
  for (let frame = 0; frame < 1200; frame++) fast.step(1 / 60);
  for (let index = 0; index < 4; index++) {
    assert.ok(Math.hypot(slow.fish[index].x - fast.fish[index].x, slow.fish[index].y - fast.fish[index].y) < 8);
  }
});
