import * as THREE from 'three';
import { rng } from '../util';
import { tiledTexture } from './common';

// Procedural canvas textures of the room surfaces. Each tile is seamless enough for
// planar UVs; scales are given in metres per tile where the textures are used.

const hex = (r: number, g: number, b: number) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

/** Speckle noise: many tiny translucent dots (concrete, render). */
function speckle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  n: number,
  rand: () => number,
  light: number,
  dark: number,
) {
  for (let i = 0; i < n; i++) {
    const v = rand() < 0.5 ? light : dark;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.05 + rand() * 0.12})`;
    const s = 1 + rand() * 3;
    ctx.fillRect(rand() * w, rand() * h, s, s);
  }
}

/** Concrete blocks 50 × 20 cm, 1 tile = 1 m. */
export function blockTexture(): THREE.CanvasTexture {
  return tiledTexture(512, (ctx, w, h) => {
    const rand = rng(11);
    ctx.fillStyle = '#8f8d87';
    ctx.fillRect(0, 0, w, h);
    const bw = w / 2;
    const bh = h / 5;
    for (let row = 0; row < 5; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col < 3; col++) {
        const x = col * bw + off;
        const y = row * bh;
        const g = 160 + rand() * 18;
        ctx.fillStyle = hex(g, g - 2, g - 8);
        ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      }
    }
    speckle(ctx, w, h, 9000, rand, 210, 70);
  });
}

/** Rough cement render ("crépi"), 1 tile = 1 m. */
export function renderTexture(): THREE.CanvasTexture {
  return tiledTexture(512, (ctx, w, h) => {
    const rand = rng(23);
    ctx.fillStyle = '#c3bcae';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const r = 2 + rand() * 7;
      const v = 150 + rand() * 80;
      ctx.fillStyle = `rgba(${v},${v - 6},${v - 16},0.22)`;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 12000, rand, 230, 90);
  });
}

/** Oriented strand board, 1 tile = 0.6 m. */
export function osbTexture(): THREE.CanvasTexture {
  return tiledTexture(512, (ctx, w, h) => {
    const rand = rng(37);
    ctx.fillStyle = '#c9a36e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      const len = 18 + rand() * 46;
      const wid = 5 + rand() * 12;
      const tone = rand();
      const r = 165 + tone * 70;
      ctx.save();
      ctx.translate(rand() * w, rand() * h);
      ctx.rotate((rand() - 0.5) * Math.PI);
      ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(r * 0.74)},${Math.round(r * 0.45)},${0.45 + rand() * 0.45})`;
      ctx.fillRect(-len / 2, -wid / 2, len, wid);
      if (rand() < 0.25) {
        ctx.fillStyle = 'rgba(90,60,30,0.35)';
        ctx.fillRect(-len / 2, -wid / 2, len, 1.5);
      }
      ctx.restore();
    }
  });
}

/** Planed softwood boards with grain along u, 1 tile = 0.6 m. */
export function woodTexture(): THREE.CanvasTexture {
  return tiledTexture(512, (ctx, w, h) => {
    const rand = rng(51);
    ctx.fillStyle = '#d4a670';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y = rand() * h;
      const amp = 2 + rand() * 6;
      const freq = 0.004 + rand() * 0.01;
      const ph = rand() * 6.28;
      ctx.strokeStyle = `rgba(${120 + rand() * 40},${75 + rand() * 25},${35 + rand() * 15},${0.12 + rand() * 0.25})`;
      ctx.lineWidth = 0.6 + rand() * 2.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin(x * freq * 6.28 + ph) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // a couple of knots
    for (let k = 0; k < 2; k++) {
      const x = rand() * w;
      const y = rand() * h;
      for (let r = 14; r > 2; r -= 3) {
        ctx.strokeStyle = 'rgba(110,65,30,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.8, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
}

/** Smooth trowelled concrete floor, 1 tile = 1.5 m. */
export function floorTexture(): THREE.CanvasTexture {
  return tiledTexture(512, (ctx, w, h) => {
    const rand = rng(67);
    ctx.fillStyle = '#b2aea6';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const v = 150 + rand() * 60;
      ctx.fillStyle = `rgba(${v},${v},${v - 4},0.08)`;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 10 + rand() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, w, h, 7000, rand, 220, 80);
  });
}

/** Soft sky + distant hills seen through the window. */
export function skyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#cfe4f4');
  g.addColorStop(0.6, '#eef5f7');
  g.addColorStop(1, '#f6f3ea');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#9fb88a';
  ctx.beginPath();
  ctx.moveTo(0, 190);
  for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, 175 + Math.sin(x * 0.03) * 18 + Math.sin(x * 0.11) * 6);
  ctx.lineTo(256, 256);
  ctx.lineTo(0, 256);
  ctx.fill();
  ctx.fillStyle = '#7f9c72';
  ctx.beginPath();
  ctx.moveTo(0, 225);
  for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, 215 + Math.sin(x * 0.05 + 1) * 10);
  ctx.lineTo(256, 256);
  ctx.lineTo(0, 256);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
