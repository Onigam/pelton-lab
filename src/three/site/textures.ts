import * as THREE from 'three';
import { canvasTexture, rng } from '@onigam/lab-kit/three';

// Procedural canvas textures for the buildings (1 UV unit = 1 tile, see boxUV()).

function repeatable(t: THREE.Texture): THREE.Texture {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Rubble stone masonry (Pyrenean house walls), 2 m tile. */
export function stoneWallTexture(): THREE.Texture {
  return repeatable(
    canvasTexture(512, 512, (ctx, w, h) => {
      const r = rng(31);
      ctx.fillStyle = '#6d665b';
      ctx.fillRect(0, 0, w, h);
      let y = 0;
      while (y < h) {
        const ch = 26 + r() * 30;
        let x = -r() * 40;
        while (x < w) {
          const cw = 34 + r() * 70;
          const g = 110 + r() * 70;
          const tint = r();
          ctx.fillStyle = `rgb(${g + tint * 18},${g + 4 - tint * 6},${g - 8 - tint * 14})`;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, cw - 4, ch - 4, 6 + r() * 6);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(x + 3, y + ch - 8, cw - 6, 4);
          x += cw;
        }
        y += ch;
      }
    }).texture,
  );
}

/** Slate roof: overlapping rows of small dark slates, 1.5 m tile. */
export function slateTexture(): THREE.Texture {
  return repeatable(
    canvasTexture(256, 256, (ctx, w, h) => {
      const r = rng(17);
      ctx.fillStyle = '#2b2f33';
      ctx.fillRect(0, 0, w, h);
      const rows = 16;
      const rh = h / rows;
      for (let j = 0; j < rows; j++) {
        const off = (j % 2) * 8;
        for (let x = -off; x < w; x += 16) {
          const g = 70 + r() * 30;
          ctx.fillStyle = `rgb(${g - 6},${g},${g + 8})`;
          ctx.beginPath();
          ctx.roundRect(x + 1, j * rh, 14, rh + 3, [0, 0, 5, 5]);
          ctx.fill();
        }
      }
    }).texture,
  );
}

/** Vertical wooden boards, 1 m tile. */
export function plankTexture(base = '#6b4a2e'): THREE.Texture {
  return repeatable(
    canvasTexture(256, 256, (ctx, w, h) => {
      const r = rng(5);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) {
        ctx.fillStyle = `rgba(255,230,200,${0.04 + r() * 0.08})`;
        ctx.fillRect(x + 2, 0, 28, h);
        ctx.strokeStyle = 'rgba(30,18,8,0.25)';
        for (let k = 0; k < 6; k++) {
          ctx.beginPath();
          const gx = x + 4 + r() * 24;
          ctx.moveTo(gx, 0);
          ctx.bezierCurveTo(gx + 3, h * 0.3, gx - 3, h * 0.6, gx + 1, h);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(20,12,6,0.6)';
        ctx.fillRect(x, 0, 2, h);
      }
    }).texture,
  );
}

/** Cement render (annex walls), 2 m tile. */
export function renderTexture(): THREE.Texture {
  return repeatable(
    canvasTexture(256, 256, (ctx, w, h) => {
      const r = rng(9);
      ctx.fillStyle = '#b9b2a3';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2500; i++) {
        const g = 150 + r() * 70;
        ctx.fillStyle = `rgba(${g},${g - 4},${g - 12},0.3)`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
      }
      ctx.fillStyle = 'rgba(70,60,40,0.12)';
      for (let i = 0; i < 6; i++) ctx.fillRect(r() * w, h * 0.8 + r() * h * 0.2, 30 + r() * 60, 12);
    }).texture,
  );
}

/** Mono PV cells: 6 x 10 cells with busbars, for one panel (UV 0..1). */
export function pvCellTexture(): THREE.Texture {
  const { texture } = canvasTexture(192, 320, (ctx, w, h) => {
    ctx.fillStyle = '#d8dde2';
    ctx.fillRect(0, 0, w, h);
    const cw = w / 6;
    const ch = h / 10;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 10; j++) {
        const g = ctx.createLinearGradient(i * cw, j * ch, (i + 1) * cw, (j + 1) * ch);
        g.addColorStop(0, '#1b2b4d');
        g.addColorStop(1, '#13203a');
        ctx.fillStyle = g;
        ctx.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3);
        ctx.fillStyle = 'rgba(190,200,210,0.55)';
        for (const b of [0.3, 0.7]) ctx.fillRect(i * cw + cw * b, j * ch + 1.5, 1, ch - 3);
      }
    }
  });
  return texture;
}
