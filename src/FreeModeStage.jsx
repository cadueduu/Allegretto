import { useEffect, useRef } from 'react';
import './free-mode.css';

// Each palette runs from the lowest key (C4) to the highest (C6).
export const FREE_PALETTES = {
  gold:   { label: 'Dourado', stops: [[60, '#c9852c'], [72, '#e2b15c'], [84, '#f4e2b4']] },
  aurora: { label: 'Aurora',  stops: [[60, '#e0a85a'], [66, '#e3836c'], [72, '#d77fa4'], [78, '#a690e2'], [84, '#7fb8e8']] },
  ivory:  { label: 'Marfim',  stops: [[60, '#e6d6bb'], [84, '#fffaf0']] },
};

const hexToRgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const toHex = rgb => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Color for a MIDI note in the given palette, as #rrggbb. */
export function noteColor(midi, palette = 'gold') {
  const stops = (FREE_PALETTES[palette] || FREE_PALETTES.gold).stops;
  const clamped = Math.min(stops.at(-1)[0], Math.max(stops[0][0], midi));
  for (let i = 1; i < stops.length; i += 1) {
    if (clamped <= stops[i][0]) {
      const t = (clamped - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      const from = hexToRgb(stops[i - 1][1]);
      const to = hexToRgb(stops[i][1]);
      return toHex(from.map((v, c) => v + (to[c] - v) * t));
    }
  }
  return stops.at(-1)[1];
}

/** Mix a #rrggbb color toward white by `amount` (0–1). */
export const lighten = (hex, amount) => toHex(hexToRgb(hex).map(v => v + (255 - v) * amount));
const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(', ')}, ${alpha})`;

// ---------------------------------------------------------------------------
// Chord recognition for the "now playing" readout.
// ---------------------------------------------------------------------------
const PITCH_PT = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
const PITCH_EN = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const CHORDS = [
  { intervals: [0, 4, 7], name: 'maior', symbol: '' },
  { intervals: [0, 3, 7], name: 'menor', symbol: 'm' },
  { intervals: [0, 3, 6], name: 'diminuto', symbol: '°' },
  { intervals: [0, 4, 8], name: 'aumentado', symbol: '+' },
  { intervals: [0, 2, 7], name: 'suspenso 2', symbol: 'sus2' },
  { intervals: [0, 5, 7], name: 'suspenso 4', symbol: 'sus4' },
  { intervals: [0, 4, 7, 10], name: 'com sétima', symbol: '7' },
  { intervals: [0, 4, 7, 11], name: 'com sétima maior', symbol: 'maj7' },
  { intervals: [0, 3, 7, 10], name: 'menor com sétima', symbol: 'm7' },
  { intervals: [0, 3, 6, 10], name: 'meio-diminuto', symbol: 'm7♭5' },
  { intervals: [0, 3, 6, 9], name: 'diminuto com sétima', symbol: '°7' },
  { intervals: [0, 4, 7, 9], name: 'com sexta', symbol: '6' },
];
const INTERVALS = ['uníssono', '2ª menor', '2ª maior', '3ª menor', '3ª maior', '4ª justa', 'trítono', '5ª justa', '6ª menor', '6ª maior', '7ª menor', '7ª maior'];

/** Names what is being played: a chord when it matches one, otherwise the notes or interval. */
export function describeNotes(midis, lang = 'pt') {
  if (!midis.length) return null;
  const sorted = [...midis].sort((a, b) => a - b);
  const names = lang === 'pt' ? PITCH_PT : PITCH_EN;
  const bass = sorted[0] % 12;
  const classes = [...new Set(sorted.map(m => m % 12))];
  if (classes.length === 1) return { title: names[bass], detail: `${PITCH_EN[bass]}${Math.floor(sorted[0] / 12) - 1}` };

  // Try every note as the root; prefer the bass when several roots fit (e.g. augmented chords).
  const roots = [bass, ...classes.filter(c => c !== bass)];
  for (const root of roots) {
    const shape = classes.map(c => (c - root + 12) % 12).sort((a, b) => a - b).join();
    const chord = CHORDS.find(ch => ch.intervals.join() === shape);
    if (chord) {
      const slash = root === bass ? '' : `/${PITCH_EN[bass]}`;
      return { title: `${names[root]} ${chord.name}`, detail: `${PITCH_EN[root]}${chord.symbol}${slash}` };
    }
  }
  if (classes.length === 2) {
    // Octave doublings don't change the interval: compare the bass with the lowest note of the other pitch.
    const low = sorted[0];
    const high = sorted.find(m => m % 12 !== bass);
    return { title: `${names[bass]} · ${names[high % 12]}`, detail: INTERVALS[(high - low) % 12] };
  }
  return { title: classes.map(c => names[c]).join(' · '), detail: '' };
}

// ---------------------------------------------------------------------------
// Stage renderer
// ---------------------------------------------------------------------------
export const FREE_LOOKS = {
  glass: { label: 'Vidro' },
  light: { label: 'Luz' },
};

const GROW_PX_PER_MS = 0.16;
// Released notes float like something buoyant: a gentle start that accelerates.
const FLOAT_START_PX_PER_MS = 0.1;
const FLOAT_ACCEL_PX_PER_MS2 = 0.0003;
const MIN_BAR_PX = 40;
const SPAWN_MS = 340;
const MAX_PARTICLES = 140;
const MAX_BLOOMS = 40;
const WHITE_KEY_COUNT = 15;
// Glass gap above the keys, and how far below the floor the lacquer reflection reaches.
const GLASS_LIFT = 4;
const REFLECT_RANGE = 70;
// Glass magnifies what sits behind it: the sampled region is this much smaller than the slab.
const LENS_X = 1.14;
const LENS_Y = 1.03;

const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

/** Time-based layout shared by the stage and its reflection: nothing here depends on frame rate. */
function barLayout(bar, now, width, glass, reducedMotion) {
  const heldUntil = bar.released ? bar.releaseTime : now;
  const length = Math.max(MIN_BAR_PX, (heldUntil - bar.startTime) * GROW_PX_PER_MS);
  const t = bar.released ? now - bar.releaseTime : 0;
  const floatY = t * FLOAT_START_PX_PER_MS + t * t * FLOAT_ACCEL_PX_PER_MS2;
  const laneX = (bar.left / 100) * width;
  const laneW = (bar.width / 100) * width;
  const spring = reducedMotion ? 1 : easeOutBack(Math.min(1, (now - bar.startTime) / SPAWN_MS));
  // Glass takes the shape of the key it came from; light is a slimmer beam.
  const share = glass ? (bar.isBlack ? 0.94 : 0.84) : (bar.isBlack ? 0.62 : 0.5);
  const w = Math.max(3, laneW * share * (0.72 + 0.28 * spring));
  return { length, floatY, laneW, w, x: laneX + (laneW - w) / 2, lift: glass ? GLASS_LIFT : 0 };
}

function fadeFor(length, floatY, height) {
  const fadeStart = Math.max(0, height - length - 40);
  return floatY < fadeStart ? 1 : Math.max(0, 1 - (floatY - fadeStart) / (height - fadeStart + length));
}

/** Rounded top, flat bottom: a beam rising out of the key. */
function pill(ctx, x, y, w, h) {
  const r = Math.min(w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const slabRadius = w => Math.min(w * 0.28, 12);

/** Static backdrop (lanes, octave marks, a faint staff), painted once per resize. */
function paintBackdrop(bg, width, height, dpr) {
  bg.width = Math.max(1, Math.round(width * dpr));
  bg.height = Math.max(1, Math.round(height * dpr));
  const g = bg.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  // A faint five-line staff across the stage: on theme, and something for the glass to bend.
  g.strokeStyle = 'rgba(243, 236, 224, 0.05)';
  g.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = Math.round(height * 0.34 + i * 16) + 0.5;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(width, y);
    g.stroke();
  }

  g.font = '500 10px ui-monospace, SFMono-Regular, Consolas, monospace';
  g.textBaseline = 'bottom';
  g.textAlign = 'left';
  for (let i = 0; i < WHITE_KEY_COUNT; i += 1) {
    const x = Math.round((i / WHITE_KEY_COUNT) * width) + 0.5;
    const isC = i % 7 === 0;
    if (i > 0) {
      const lane = g.createLinearGradient(0, 0, 0, height);
      lane.addColorStop(0, 'rgba(243, 236, 224, 0.02)');
      lane.addColorStop(1, isC ? 'rgba(243, 236, 224, 0.1)' : 'rgba(243, 236, 224, 0.045)');
      g.strokeStyle = lane;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.stroke();
    }
    if (isC) {
      g.fillStyle = 'rgba(217, 177, 106, 0.38)';
      g.fillText(`C${4 + i / 7}`, x + 8, height - 10);
    }
  }
}

function drawLightBar(ctx, { x, top, w, length, laneW, center, height, color, released }) {
  ctx.shadowColor = rgba(color, 0.55);
  ctx.shadowBlur = 26;
  const body = ctx.createLinearGradient(0, top, 0, top + length);
  body.addColorStop(0, lighten(color, 0.45));
  body.addColorStop(0.18, rgba(color, 0.92));
  body.addColorStop(1, rgba(color, released ? 0.06 : 0.32));
  ctx.fillStyle = body;
  pill(ctx, x, top, w, length);
  ctx.fill();
  ctx.shadowBlur = 0;

  const edge = ctx.createLinearGradient(0, top, 0, top + length);
  edge.addColorStop(0, 'rgba(255, 252, 245, 0.55)');
  edge.addColorStop(1, 'rgba(255, 252, 245, 0)');
  ctx.fillStyle = edge;
  ctx.fillRect(x + w * 0.22, top + w / 2, Math.max(1, w * 0.12), Math.max(0, length - w / 2));

  if (!released) {
    const radius = Math.max(40, laneW * 1.4);
    const pool = ctx.createRadialGradient(center, height, 0, center, height, radius);
    pool.addColorStop(0, rgba(color, 0.38));
    pool.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = pool;
    ctx.fillRect(center - radius, height - radius, radius * 2, radius);
  }
}

/**
 * A slab of glass shaped like its key. Ivory keys become clear crystal, ebony keys smoked glass;
 * the note's color is light entering from the key below, not paint on the glass.
 */
function drawGlassSlab(ctx, scene, dpr, { x, top, w, length: h, center, height, color, released, smoked }) {
  const r = slabRadius(w);

  // Light refracted through the slab spills onto the stage around it.
  ctx.save();
  ctx.shadowColor = rgba(color, released ? 0.2 : 0.5);
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = rgba(color, 0.04);
  roundedRect(ctx, x, top, w, h, r);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, top, w, h, r);
  ctx.clip();

  // Refraction: the lit stage behind the slab, magnified around its center and slightly frosted.
  const visTop = Math.max(0, top);
  const visBottom = Math.min(height, top + h);
  if (visBottom - visTop > 2) {
    const cy = top + h / 2;
    const srcW = w / LENS_X;
    const srcTop = Math.max(0, cy + (visTop - cy) / LENS_Y);
    const srcBottom = Math.min(height, cy + (visBottom - cy) / LENS_Y);
    if (srcBottom - srcTop > 1) {
      ctx.filter = smoked ? 'blur(2px) brightness(0.8) saturate(1.3)' : 'blur(1.4px) brightness(1.15) saturate(1.5)';
      ctx.drawImage(scene, (center - srcW / 2) * dpr, srcTop * dpr, srcW * dpr, (srcBottom - srcTop) * dpr, x, visTop, w, visBottom - visTop);
      ctx.filter = 'none';
    }
  }

  // The glass itself: nearly clear crystal, or smoked like ebony.
  ctx.fillStyle = smoked ? 'rgba(14, 11, 10, 0.55)' : 'rgba(255, 255, 255, 0.015)';
  ctx.fillRect(x, top, w, h);

  // Light entering from the key below, strongest while the note is held.
  const inner = ctx.createLinearGradient(0, top + h, 0, top + h * 0.2);
  inner.addColorStop(0, rgba(lighten(color, smoked ? 0.1 : 0.3), released ? 0.18 : (smoked ? 0.7 : 0.55)));
  inner.addColorStop(0.45, rgba(color, released ? 0.05 : 0.16));
  inner.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = inner;
  ctx.fillRect(x, top, w, h);

  // Bevel: lit along the left and top edges, shaded along the right; a caustic line at the base.
  const ex = Math.min(0.45, 5 / w);
  const bevelX = ctx.createLinearGradient(x, 0, x + w, 0);
  bevelX.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  bevelX.addColorStop(ex, 'rgba(255, 255, 255, 0)');
  bevelX.addColorStop(1 - ex, 'rgba(0, 0, 0, 0)');
  bevelX.addColorStop(1, 'rgba(0, 0, 0, 0.24)');
  ctx.fillStyle = bevelX;
  ctx.fillRect(x, top, w, h);
  const ey = Math.min(0.3, 6 / h);
  const bevelY = ctx.createLinearGradient(0, top, 0, top + h);
  bevelY.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  bevelY.addColorStop(ey, 'rgba(255, 255, 255, 0)');
  bevelY.addColorStop(1 - ey * 1.4, 'rgba(255, 255, 255, 0)');
  bevelY.addColorStop(1, rgba(lighten(color, 0.6), released ? 0.25 : 0.55));
  ctx.fillStyle = bevelY;
  ctx.fillRect(x, top, w, h);

  // Dispersion: a red fringe just inside the top-left edge, blue toward the bottom-right.
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 96, 110, 0.22)';
  roundedRect(ctx, x + 1.2, top + 1.2, w - 3.2, h - 3.2, r);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(96, 170, 255, 0.24)';
  roundedRect(ctx, x + 2, top + 2, w - 3.2, h - 3.2, r);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';

  // Specular: a bright line wrapping the top-left corner, and a faint sheen across the top.
  const specLen = Math.min(h * 0.45, r + 36);
  const spec = ctx.createLinearGradient(x, top, x + w * 0.65, top + specLen);
  spec.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  spec.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.strokeStyle = spec;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 2.5, top + specLen);
  ctx.lineTo(x + 2.5, top + r);
  ctx.arcTo(x + 2.5, top + 2.5, x + r, top + 2.5, Math.max(0, r - 2.5));
  ctx.lineTo(x + w * 0.62, top + 2.5);
  ctx.stroke();
  const sheen = ctx.createLinearGradient(x, top, x + w, top + w);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, top, w, Math.min(h, w * 1.2));
  ctx.restore();

  // Hairline rim, brightest toward the light.
  const rim = ctx.createLinearGradient(x, top, x + w, top + Math.min(h, w * 3));
  rim.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
  rim.addColorStop(0.4, 'rgba(255, 255, 255, 0.12)');
  rim.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  roundedRect(ctx, x + 0.5, top + 0.5, w - 1, h - 1, r);
  ctx.stroke();

  if (!released) {
    const radius = Math.max(36, w * 1.3);
    const pool = ctx.createRadialGradient(center, height, 0, center, height, radius);
    pool.addColorStop(0, rgba(color, 0.3));
    pool.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = pool;
    ctx.fillRect(center - radius, height - radius, radius * 2, radius);
  }
}

/** Ivory slabs first, then ebony, so smoked glass always sits on top like the keys themselves. */
const byKeyLayer = bars => [...bars].sort((a, b) => Number(a.isBlack) - Number(b.isBlack));

function useLiveRefs(values) {
  const ref = useRef(values);
  useEffect(() => { ref.current = values; });
  return ref;
}

/**
 * Canvas renderer for Free Mode. Reads bars straight from `barsRef` (mutated by note events)
 * so the 3k-line parent never re-renders per frame; prunes bars once they leave the screen.
 */
export default function FreeModeStage({ barsRef, getAudioFrame, palette = 'gold', look = 'glass' }) {
  const canvasRef = useRef(null);
  const live = useLiveRefs({ getAudioFrame, palette, look });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const backdrop = document.createElement('canvas');
    // The lit stage (backdrop + blooms + floor light), redrawn each frame; glass refracts this.
    const scene = document.createElement('canvas');
    const sceneCtx = scene.getContext('2d');
    const particles = [];
    const blooms = [];
    const seen = new Set();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId;
    let previous = performance.now();
    let glow = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.width = canvas.width;
      scene.height = canvas.height;
      sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBackdrop(backdrop, width, height, dpr);
    };

    // Light look: slow gold dust. Glass look: small glass bubbles that sway as they rise.
    const spawn = (x, y, color, count, spread) => {
      const glass = live.current.look === 'glass';
      for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
        particles.push({
          x: x + (Math.random() - 0.5) * spread,
          y,
          vx: (Math.random() - 0.5) * 0.02,
          vy: -(glass ? 0.04 + Math.random() * 0.07 : 0.03 + Math.random() * 0.07),
          life: 0,
          ttl: 1600 + Math.random() * 1400,
          size: glass ? 1.4 + Math.random() * 2.6 : 0.6 + Math.random() * 1.1,
          sway: Math.random() * Math.PI * 2,
          color,
          glass,
        });
      }
    };

    const paintScene = (now) => {
      sceneCtx.clearRect(0, 0, width, height);
      sceneCtx.drawImage(backdrop, 0, 0, width, height);
      // Each note leaves a soft stage light that lingers and drifts up; glass passing over it bends it.
      for (let i = blooms.length - 1; i >= 0; i -= 1) {
        const b = blooms[i];
        const age = now - b.born;
        if (age > b.ttl) { blooms.splice(i, 1); continue; }
        const k = age / b.ttl;
        const alpha = 0.2 * Math.min(1, age / 220) * (1 - k) ** 1.5;
        const y = b.y - age * 0.03;
        const radius = b.r * (0.8 + 0.5 * k);
        const g = sceneCtx.createRadialGradient(b.x, y, 0, b.x, y, radius);
        g.addColorStop(0, rgba(b.color, alpha));
        g.addColorStop(1, rgba(b.color, 0));
        sceneCtx.fillStyle = g;
        sceneCtx.fillRect(b.x - radius, y - radius, radius * 2, radius * 2);
      }
      // Floor light breathes with the real output level.
      const level = live.current.getAudioFrame?.()?.level || 0;
      glow += (Math.min(1, level * 9) - glow) * 0.06;
      const floor = sceneCtx.createLinearGradient(0, height, 0, height * 0.45);
      floor.addColorStop(0, `rgba(217, 177, 106, ${0.04 + glow * 0.16})`);
      floor.addColorStop(1, 'rgba(217, 177, 106, 0)');
      sceneCtx.fillStyle = floor;
      sceneCtx.fillRect(0, height * 0.45, width, height * 0.55);
    };

    const draw = (now) => {
      const dt = Math.min(64, now - previous);
      previous = now;
      const { look, palette } = live.current;
      const glass = look === 'glass';

      const bars = barsRef.current;
      const alive = [];
      const shapes = [];
      for (const bar of byKeyLayer(bars)) {
        const layout = barLayout(bar, now, width, glass, reducedMotion);
        if (layout.floatY > layout.length + height) { seen.delete(bar.id); continue; }
        alive.push(bar);
        const color = bar.color || noteColor(bar.midi, palette);
        const bottom = height - layout.floatY - layout.lift;
        const center = layout.x + layout.w / 2;
        if (!seen.has(bar.id)) {
          seen.add(bar.id);
          if (blooms.length < MAX_BLOOMS) blooms.push({ x: center, y: height - 40, r: Math.max(70, layout.laneW * 2.6), color, born: now, ttl: 3200 });
          if (!reducedMotion) spawn(center, height - 6, color, glass ? 4 : 4, layout.w);
        }
        shapes.push({
          x: layout.x, top: bottom - layout.length, w: layout.w, length: layout.length, laneW: layout.laneW,
          center, height, color, released: bar.released, smoked: bar.isBlack,
          opacity: fadeFor(layout.length, layout.floatY, height),
        });
      }
      if (alive.length !== bars.length) barsRef.current = bars.filter(b => alive.includes(b));

      paintScene(now);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(scene, 0, 0, width, height);

      if (!glass) ctx.globalCompositeOperation = 'screen';
      for (const shape of shapes) {
        ctx.globalAlpha = shape.opacity;
        if (glass) drawGlassSlab(ctx, scene, dpr, shape);
        else drawLightBar(ctx, shape);
        if (!shape.released && !reducedMotion && Math.random() < dt / (glass ? 360 : 260)) {
          spawn(shape.center, glass ? height - 8 : shape.top + shape.w, shape.color, 1, shape.w * 0.6);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.ttl) { particles.splice(i, 1); continue; }
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        const t = p.life / p.ttl;
        const fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        if (p.glass) {
          const px = p.x + Math.sin(p.life / 190 + p.sway) * 3;
          const s = p.size;
          ctx.globalAlpha = fade;
          const fill = ctx.createRadialGradient(px - s * 0.3, p.y - s * 0.3, s * 0.1, px, p.y, s);
          fill.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
          fill.addColorStop(0.7, rgba(p.color, 0.08));
          fill.addColorStop(1, rgba(lighten(p.color, 0.4), 0.35));
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(px, p.y, s, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(px - s * 0.35, p.y - s * 0.35, Math.max(0.5, s * 0.2), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = rgba(lighten(p.color, 0.5), fade * 0.7);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Schedule first so one bad frame can't stop the loop, and skip frames until the canvas has a size
    // (drawImage throws on a 0×0 canvas, e.g. while the overlay is still laying out).
    const tick = (now) => {
      frameId = requestAnimationFrame(tick);
      if (width > 0 && height > 0) draw(now);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frameId = requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [barsRef, live]);

  return <canvas ref={canvasRef} className="free-stage__canvas" aria-hidden="true" />;
}

/**
 * Mirror of the slabs in the piano's black lacquer, drawn inside the fallboard just below the stage.
 * Only notes near the floor reflect, fading with distance like a real glossy surface.
 */
export function FreeModeReflection({ barsRef, palette = 'gold', look = 'glass' }) {
  const canvasRef = useRef(null);
  const live = useLiveRefs({ palette, look });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let frameId;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      frameId = requestAnimationFrame(draw);
      if (!width || !height) return;
      const { look, palette } = live.current;
      const glass = look === 'glass';
      ctx.clearRect(0, 0, width, height);
      for (const bar of byKeyLayer(barsRef.current)) {
        const layout = barLayout(bar, now, width, glass, reducedMotion);
        const gap = layout.floatY + layout.lift;
        if (gap > REFLECT_RANGE) continue;
        const color = bar.color || noteColor(bar.midi, palette);
        const strength = (1 - gap / REFLECT_RANGE) * (bar.released ? 0.6 : 1);
        const top = gap;
        const reach = Math.min(layout.length, height - top);
        if (reach <= 0) continue;
        const r = glass ? slabRadius(layout.w) : 0;
        // Lacquer reflections are faint and fall off within a few pixels.
        const fill = ctx.createLinearGradient(0, top, 0, top + Math.min(reach, height * 0.7));
        fill.addColorStop(0, rgba(lighten(color, 0.3), 0.28 * strength));
        fill.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = fill;
        roundedRect(ctx, layout.x, top, layout.w, layout.length, r);
        ctx.fill();
        if (glass) {
          // The slab's lit base edge, mirrored.
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * strength})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(layout.x + r, top + 0.5);
          ctx.lineTo(layout.x + layout.w - r, top + 0.5);
          ctx.stroke();
        }
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frameId = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [barsRef, live]);

  return <canvas ref={canvasRef} className="free-reflection" aria-hidden="true" />;
}

/** Large, quiet "now playing" line at the top of the stage. Keeps the last value while fading out. */
export function NowPlaying({ midis, lang }) {
  const lastRef = useRef(null);
  const current = describeNotes(midis, lang);
  if (current) lastRef.current = current;
  const shown = current || lastRef.current;
  return (
    <div className={`free-now${current ? ' is-on' : ''}`} aria-live="polite">
      {shown && <>
        <span className="free-now__title">{shown.title}</span>
        {shown.detail && <span className="free-now__detail">{shown.detail}</span>}
      </>}
    </div>
  );
}
