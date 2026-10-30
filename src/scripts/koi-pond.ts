// Everything in the pond is typeset on a fixed character grid. No sprites,
// images, emoji, or filled fish silhouettes: even the fins and ripples are text.
import { KoiMotion } from './koi-motion';
type Ripple = { x: number; y: number; born: number };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export function createPond(canvas: HTMLCanvasElement, toggle: HTMLButtonElement) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const context = ctx;
  const light = canvas.dataset.theme === 'light';
  const movement = new KoiMotion(window.innerWidth, window.innerHeight);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, columns = 0, rows = 0;
  let cellX = 8, cellY = 12, fontSize = 12;
  let elapsed = 0, previous = 0, frame = 0;
  let paused = motion.matches;
  let ripples: Ripple[] = [];
  let water: { x: number; y: number; seed: number }[] = [];
  const glyphs = new Map<number, { char: string; color: string; alpha: number }>();

  function put(x: number, y: number, char: string, color: string, alpha = 1) {
    const col = Math.round(x / cellX), row = Math.round(y / cellY);
    if (col < 0 || row < 0 || col >= columns || row >= rows) return;
    glyphs.set(row * columns + col, { char, color, alpha });
  }

  function drawFish(index: number) {
    const p = movement.fish[index]!;
    const angle = p.angle;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const size = movement.size(index);
    const phase = p.phase;
    const radius = size * .8;
    const left = Math.max(0, Math.floor((p.x - radius) / cellX));
    const right = Math.min(columns, Math.ceil((p.x + radius) / cellX));
    const top = Math.max(0, Math.floor((p.y - radius) / cellY));
    const bottom = Math.min(rows, Math.ceil((p.y + radius) / cellY));

    for (let row = top; row < bottom; row++) for (let col = left; col < right; col++) {
      const dx = col * cellX - p.x, dy = row * cellY - p.y;
      const x = (dx * cos + dy * sin) / size;
      let y = (-dx * sin + dy * cos) / size;
      y -= p.bend * Math.pow(x - .4, 2) * .12;
      // A travelling bend grows towards the tail, rather than rotating a rigid sprite.
      y -= Math.sin(phase + x * 7) * .055 * (1 + p.alarm * .35) * Math.pow(clamp(.5 - x, 0, 1.2), 1.5);
      const ay = Math.abs(y);
      let char = '', color = '', alpha = 1;
      const u = (x + .4) / .88;
      const bodyWidth = u > 0 && u < 1 ? .19 * Math.pow(Math.sin(u * Math.PI), .65) * (.72 + .28 * u) : 0;
      const body = u > 0 && u < 1 && ay < bodyWidth;
      const tailT = (-.35 - x) / .36;
      const tail = tailT > 0 && tailT < 1 && ay < .025 + tailT * .24 && (tailT < .63 || ay > (tailT - .63) * .48);
      const fin = x > -.2 && x < .21 && ay > bodyWidth * .84 && ay < .32 - Math.abs(x + .025) * .75;

      if (body) {
        const edge = ay / bodyWidth;
        const patch = Math.sin(x * 22 + index * 2) + Math.cos(y * 30 + x * 6) + Math.sin(x * 11 - y * 21);
        const speckle = hash(Math.floor(x * 60) + index * 91, Math.floor(y * 60));
        const warm = index === 1 ? patch > -.8 : patch > .65;
        color = warm ? (index === 1 ? (light ? '#a97f38' : '#edbf70') : (light ? '#b86442' : '#f49b77')) : (light ? '#7d8876' : '#eee9d2');
        if (index === 2 && patch < -.9) color = light ? '#436d66' : '#778d84';
        char = edge > .83 ? ':' : warm ? (speckle > .45 ? '%' : '#') : (speckle > .55 ? 'o' : 'O');
        if (edge < .32 && x > -.15) char = warm ? '@' : '0';
        // Two dark eyes, located on the sides of the broad head.
        if (x > .28 && x < .36 && ay > bodyWidth * .48 && ay < bodyWidth * .88) {
          char = '•'; color = '#746d4b';
        }
        if (x > .43) { char = ':'; color = light ? '#7b846a' : '#bbb99e'; }
      } else if (tail || fin) {
        const rays = Math.sin(y * 95 + x * 25);
        char = rays > .3 ? '+' : rays > -.4 ? ':' : '·';
        color = index === 1 ? (light ? '#9a884f' : '#cfb578') : (light ? '#81977f' : '#bbcebb');
        alpha = tail ? .78 : .55;
      }
      if (char) put(col * cellX, row * cellY, char, color, alpha);
    }
  }

  function waveAt(x: number, y: number) {
    let value = 0, offsetX = 0, offsetY = 0;
    for (const ripple of ripples) {
      const age = elapsed - ripple.born;
      const dx = x - ripple.x, dy = y - ripple.y;
      const distance = Math.hypot(dx, dy);
      const behind = age * 78 - distance;
      if (behind < -20 || behind > 145) continue;
      // A short train of waves: a soft leading crest, then smaller trailing rings.
      // Summing fields lets intersecting clicks reinforce and cancel one another.
      const envelope = Math.exp(-Math.pow((behind - 30) / 48, 2));
      const fade = Math.pow(Math.max(0, 1 - age / 3.6), 1.5) / Math.sqrt(1 + age * .6);
      const wave = Math.sin(behind / 8) * envelope * fade;
      value += wave;
      const displacement = Math.cos(behind / 8) * envelope * fade * 3.5;
      offsetX += dx / Math.max(distance, 1) * displacement;
      offsetY += dy / Math.max(distance, 1) * displacement;
    }
    return { value, offsetX, offsetY };
  }

  function drawRipples() {
    if (!ripples.length) return;
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const x = col * cellX, y = row * cellY;
      const { value } = waveAt(x, y);
      const strength = Math.min(1, Math.abs(value));
      if (strength < .07 || (strength < .22 && hash(col + 13, row) > strength * 3)) continue;
      const underneath = glyphs.get(row * columns + col);
      // Preserve a fish's markings while light passes across its back.
      if (underneath && underneath.alpha > .5) continue;
      const char = strength > .58 ? '~' : strength > .3 ? ':' : '·';
      put(x, y, char, light ? '#3f8177' : '#bbd1b4', Math.sqrt(strength) * .88);
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    glyphs.clear();
    ripples = ripples.filter(r => elapsed - r.born < 3.6);
    // Sparse currents, not a solid wall of characters.
    for (const dot of water) {
      const wave = Math.sin(dot.x * .008 + dot.y * .013 + elapsed * .3);
      put(dot.x, dot.y, dot.seed > .8 && wave > .35 ? '~' : dot.seed > .5 ? '·' : '.', light ? '#839a81' : '#617b67', .12 + Math.max(0, wave) * .16);
    }
    for (let index = 0; index < 4; index++) drawFish(index);
    drawRipples();
    for (const [key, glyph] of glyphs) {
      const x = (key % columns) * cellX, y = Math.floor(key / columns) * cellY;
      const wave = ripples.length ? waveAt(x, y) : { value: 0, offsetX: 0, offsetY: 0 };
      context.fillStyle = glyph.color;
      context.globalAlpha = clamp(glyph.alpha + Math.max(0, wave.value) * .15, 0, 1);
      context.fillText(glyph.char, x + wave.offsetX, y + wave.offsetY);
    }
    context.globalAlpha = 1;
  }

  function resize() {
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    movement.resize(width, height);
    cellX = width < 650 ? 6 : 8;
    cellY = width < 650 ? 9 : 12;
    fontSize = width < 650 ? 9 : 12;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `${fontSize}px ui-monospace, Menlo, Consolas, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    columns = Math.ceil(width / cellX) + 1;
    rows = Math.ceil(height / cellY) + 1;
    water = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const seed = hash(col, row);
      if (seed > .82) water.push({ x: col * cellX, y: row * cellY, seed: hash(col + 31, row + 7) });
    }
    draw();
  }

  function tick(now: number) {
    if (paused || document.hidden) { frame = 0; return; }
    if (!previous) previous = now;
    if (now - previous >= 1000 / 30) {
      const dt = Math.min((now - previous) / 1000, .1);
      elapsed += dt;
      movement.step(dt);
      previous = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    toggle.textContent = paused ? 'resume pond' : 'pause pond';
    toggle.setAttribute('aria-pressed', String(paused));
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  window.addEventListener('click', event => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('#pond-toggle'))) return;
    if (paused) return;
    movement.disturb(event.clientX, event.clientY);
    ripples.push({ x: event.clientX, y: event.clientY, born: elapsed - .25 });
    ripples = ripples.slice(-8);
    draw();
  }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { paused = motion.matches; sync(); });
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', sync);
  resize();
  sync();
}
