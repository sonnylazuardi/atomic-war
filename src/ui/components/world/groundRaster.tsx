// Static terrain Ground rendered ONCE into a raster (<canvas>) instead of living in the live SVG.
// Phones were repainting hundreds of terrain shapes every frame at 3x DPR whenever a unit moved;
// now the ground is a bitmap layer and only the (mostly empty) dynamic SVG above it repaints.
// The Ground's SVG markup is serialized per terrain id (renderToStaticMarkup) -> Blob URL -> decoded
// <img>, then drawn into a canvas with the same viewBox / preserveAspectRatio mapping as the World.
import { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TerrainId } from '../../../core/types.ts';
import { ARENA_H, ARENA_W } from '../../../core/constants.ts';
import { GroundLayer, fadeK } from './terrainLayers.tsx';
import type { TerrainFade } from './terrainLayers.tsx';

export interface ViewMap {
  vb: { x: number; y: number; w: number; h: number };
  fit: 'slice' | 'meet';
  w: number; // container css px
  h: number;
}

const images = new Map<TerrainId, Promise<HTMLImageElement>>();

/** decoded full-arena Ground image for a terrain (cached for the session) */
export function groundImage(id: TerrainId): Promise<HTMLImageElement> {
  let p = images.get(id);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      // render inside an <svg> root so React keeps SVG casing (linearGradient, radialGradient, ...)
      const markup = renderToStaticMarkup(
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox={`0 0 ${ARENA_W} ${ARENA_H}`} width={ARENA_W} height={ARENA_H}>
          <GroundLayer id={id} />
        </svg>,
      );
      const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => {
        images.delete(id);
        reject(new Error(`ground raster failed: ${id}`));
      };
      img.src = url;
    });
    images.set(id, p);
  }
  return p;
}

/** css-px transform of arena units for a viewBox + preserveAspectRatio xMidYMid {fit} */
export function arenaToPx(m: ViewMap) {
  const s = m.fit === 'meet' ? Math.min(m.w / m.vb.w, m.h / m.vb.h) : Math.max(m.w / m.vb.w, m.h / m.vb.h);
  const ox = (m.w - m.vb.w * s) / 2 - m.vb.x * s;
  const oy = (m.h - m.vb.h * s) / 2 - m.vb.y * s;
  return { s, ox, oy };
}

/** one terrain's ground as a canvas; falls back to the live SVG until the raster is ready */
function GroundCanvas({ id, map, dprCap, opacity }: { id: TerrainId; map: ViewMap; dprCap: number; opacity: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const { vb, fit, w, h } = map;
  useEffect(() => {
    let alive = true;
    if (w <= 0 || h <= 0) return;
    groundImage(id).then(
      (img) => {
        const c = ref.current;
        if (!alive || !c) return;
        const dpr = Math.max(1, Math.min(dprCap, window.devicePixelRatio || 1));
        // keep the bitmap within sane limits on huge screens
        const k = Math.min(dpr, 4096 / Math.max(w, h));
        const cw = Math.round(w * k);
        const ch = Math.round(h * k);
        if (c.width !== cw) c.width = cw;
        if (c.height !== ch) c.height = ch;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const { s, ox, oy } = arenaToPx({ vb, fit, w, h });
        ctx.fillStyle = '#0b0c10';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, ox * k, oy * k, ARENA_W * s * k, ARENA_H * s * k);
        setReady(true);
      },
      () => {
        // leave the SVG fallback in place
      },
    );
    return () => {
      alive = false;
    };
  }, [id, vb.x, vb.y, vb.w, vb.h, fit, w, h, dprCap]);
  return (
    <>
      <canvas ref={ref} className="aw-world-ground" style={{ opacity: ready ? (opacity < 1 ? opacity : undefined) : 0 }} aria-hidden="true" />
      {!ready && (
        <svg className="aw-world-ground" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio={`xMidYMid ${fit}`} style={{ opacity: opacity < 1 ? opacity : undefined }} aria-hidden="true">
          <GroundLayer id={id} />
        </svg>
      )}
    </>
  );
}

/** current terrain over the previous one while a cross-fade runs */
export function GroundStack({ f, now, map, dprCap }: { f: TerrainFade; now: number; map: ViewMap; dprCap: number }) {
  const k = fadeK(f, now);
  if (k >= 1 && f.prev) f.prev = null;
  return (
    <>
      {f.prev && <GroundCanvas key={f.prev} id={f.prev} map={map} dprCap={dprCap} opacity={1} />}
      <GroundCanvas key={f.cur} id={f.cur} map={map} dprCap={dprCap} opacity={k} />
    </>
  );
}
