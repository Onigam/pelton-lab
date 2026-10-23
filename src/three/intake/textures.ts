import * as THREE from 'three';
import { canvasTexture, rng } from '@onigam/lab-kit/three';

// Procedural canvas textures of the intake diorama (deterministic: seeded PRNG).

const wrap = (t: THREE.Texture, rx = 1, ry = 1) => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
};

/** Sawn, weathered treated-pine grain running along U (1 tile = 1 m × 0.25 m). */
export function woodTexture(seed = 3): THREE.Texture {
  const r = rng(seed);
  const { texture } = canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b07a4c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y0 = r() * h;
      const amp = 2 + r() * 6;
      const f = 0.004 + r() * 0.01;
      const ph = r() * 6;
      ctx.strokeStyle = `rgba(${70 + r() * 40},${38 + r() * 20},${18},${0.12 + r() * 0.25})`;
      ctx.lineWidth = 0.6 + r() * 2.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const y = y0 + Math.sin(x * f + ph) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // a few knots and weathered grey streaks
    for (let i = 0; i < 4; i++) {
      const x = r() * w;
      const y = r() * h;
      const g = ctx.createRadialGradient(x, y, 1, x, y, 10 + r() * 8);
      g.addColorStop(0, 'rgba(60,32,14,0.9)');
      g.addColorStop(1, 'rgba(90,50,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(150,140,120,0.12)';
    for (let i = 0; i < 30; i++) ctx.fillRect(r() * w, r() * h, 60 + r() * 200, 1 + r() * 3);
  });
  return wrap(texture);
}

/**
 * Cut faces of the block: horizontal strata in absolute height (V: 0..1 m, U: 1 m per tile):
 * slate bedrock, river cobbles, ochre clay, sandy loam, brown earth.
 */
export function strataTexture(): THREE.Texture {
  const r = rng(11);
  const { texture } = canvasTexture(512, 1024, (ctx, w, h) => {
    const yPx = (m: number) => h - m * h; // metres → px (canvas Y is down)
    const layers: [number, string][] = [
      [0.0, '#4a4b4c'],
      [0.1, '#8c8577'],
      [0.27, '#a77d4a'],
      [0.38, '#8f6e4a'],
      [0.6, '#6e5038'],
      [1.0, '#6e5038'],
    ];
    for (let i = 0; i < layers.length - 1; i++) {
      const [y0, col] = layers[i];
      const y1 = layers[i + 1][0];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, yPx(y0));
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, yPx(y1) + Math.sin(x * 0.03 + i) * 6 + Math.sin(x * 0.11) * 2);
      ctx.lineTo(w, yPx(y0));
      ctx.closePath();
      ctx.fill();
    }
    // bedrock cracks and slate lamination
    ctx.strokeStyle = 'rgba(25,25,28,0.55)';
    for (let i = 0; i < 40; i++) {
      const y = yPx(r() * 0.1);
      ctx.lineWidth = 0.6 + r();
      ctx.beginPath();
      ctx.moveTo(r() * w, y);
      ctx.lineTo(r() * w, y + (r() - 0.5) * 8);
      ctx.stroke();
    }
    // cobbles in the gravel layer, grains everywhere
    for (let i = 0; i < 260; i++) {
      const y = yPx(0.1 + r() * 0.17);
      const rad = 3 + r() * 9;
      const g = 110 + r() * 70;
      ctx.fillStyle = `rgb(${g},${g - 6},${g - 16})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, y, rad * (1 + r() * 0.6), rad * 0.7, r(), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,36,30,0.35)';
      ctx.stroke();
    }
    for (let i = 0; i < 9000; i++) {
      const v = r();
      ctx.fillStyle = v > 0.5 ? `rgba(255,240,210,${0.05 + r() * 0.1})` : `rgba(20,14,8,${0.06 + r() * 0.12})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    // a few roots in the topsoil
    ctx.strokeStyle = 'rgba(40,26,14,0.5)';
    for (let i = 0; i < 18; i++) {
      let x = r() * w;
      let y = yPx(0.62 + r() * 0.35);
      ctx.lineWidth = 0.5 + r() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) ctx.lineTo((x += (r() - 0.5) * 30), (y += 6 + r() * 14));
      ctx.stroke();
    }
  });
  return wrap(texture);
}

/** Neutral gravel / soil speckle for the top surface (multiplied by vertex colours, 0.5 m tile). */
export function groundTexture(): THREE.Texture {
  const r = rng(23);
  const { texture } = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d8d4cc';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const g = 150 + r() * 105;
      ctx.fillStyle = `rgb(${g},${g - 4},${g - 12})`;
      const rad = 1 + r() * 4.5;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, rad * (1 + r()), rad, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(30,24,16,${0.05 + r() * 0.15})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  });
  return wrap(texture);
}

/** Far view of the wedge-wire screen: bright bar tops and dark slots, one bar per U unit. */
export function barsTexture(bars: number): THREE.Texture {
  const { texture } = canvasTexture(32, 8, (ctx, w, h) => {
    ctx.fillStyle = '#2b3036';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 22, 0);
    g.addColorStop(0, '#aab1b8');
    g.addColorStop(0.45, '#f3f5f7');
    g.addColorStop(1, '#bfc5cb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 22, h);
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return wrap(texture, bars, 1);
}

/** Water streaks (scrolled along U) for the pipe core and falling threads. */
export function streakTexture(): THREE.Texture {
  const r = rng(31);
  const { texture } = canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(120,180,220,0.55)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(235,248,255,${0.25 + r() * 0.6})`;
      ctx.fillRect(r() * w, r() * h, 8 + r() * 40, 1 + r() * 2);
    }
  });
  return wrap(texture);
}

/** Soft round drop sprite. */
export function dropSprite(): THREE.Texture {
  return canvasTexture(64, 64, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(215,238,255,0.85)');
    g.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  }).texture;
}

/** Air bubble sprite: bright rim, clear centre. */
export function bubbleSprite(): THREE.Texture {
  return canvasTexture(64, 64, (ctx, w) => {
    ctx.clearRect(0, 0, w, w);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,245,255,0.25)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(w * 0.38, w * 0.36, 5, 0, Math.PI * 2);
    ctx.fill();
  }).texture;
}

/** Alpha map of a perforated sheet (Ø6 mm holes on a 10 mm staggered pitch). */
export function perforatedAlpha(cols: number, rows: number): THREE.Texture {
  const { texture } = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    // two holes per tile → staggered grid once repeated
    ctx.fillStyle = '#000';
    for (const [x, y] of [
      [w / 4, h / 4],
      [(3 * w) / 4, (3 * h) / 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 9.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  texture.colorSpace = THREE.NoColorSpace;
  return wrap(texture, cols, rows);
}
