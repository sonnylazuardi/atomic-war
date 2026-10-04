// The human's formation tiles (4 lanes x 3 depth rows) on the BOTTOM half (prep only). Subtle glowing floor plates; brighter
// while a hero is being dragged, gold on the hovered tile. Each tile is an HTML5 drop target.
import type { DragEvent } from 'react';
import type { BoardSlot } from '../../../core/types.ts';
import { BOARD_COLS, BOARD_ROWS, slotToArena } from '../../../core/constants.ts';

export const TILE_W = 118;
export const TILE_H = 54;

export const ALL_SLOTS: BoardSlot[] = [];
for (let row = 0; row < BOARD_ROWS; row++) for (let col = 0; col < BOARD_COLS; col++) ALL_SLOTS.push({ col, row });

export const slotPos = (s: BoardSlot) => slotToArena(s.col, s.row, 'left');
export const sameSlot = (a: BoardSlot | null | undefined, b: BoardSlot | null | undefined) => !!a && !!b && a.col === b.col && a.row === b.row;

/** nearest formation tile to an arena point, or null if too far from every tile */
export function slotAt(x: number, y: number): BoardSlot | null {
  let best: BoardSlot | null = null;
  let bd = Infinity;
  for (const s of ALL_SLOTS) {
    const p = slotPos(s);
    const dx = (x - p.x) / 72;
    const dy = (y - p.y) / 40;
    const d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return bd <= 1 ? best : null;
}

export interface TilesProps {
  opacity: number;
  active: boolean; // a drag is in progress
  hover: BoardSlot | null;
  t: number;
  onDragOverSlot?: (slot: BoardSlot, e: DragEvent) => void;
  onDropSlot?: (slot: BoardSlot, e: DragEvent) => void;
}

export function FormationTiles({ opacity, active, hover, t, onDragOverSlot, onDropSlot }: TilesProps) {
  if (opacity <= 0) return null;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <g opacity={opacity}>
      {ALL_SLOTS.map((s) => {
        const p = slotPos(s);
        const hot = sameSlot(s, hover);
        const front = s.col === 0;
        const fill = hot ? 'rgba(255,214,110,0.30)' : active ? 'rgba(150,215,255,0.13)' : 'rgba(12,24,44,0.16)';
        const stroke = hot ? '#ffd76a' : active ? 'rgba(170,225,255,0.75)' : `rgba(170,225,255,${(0.22 + pulse * 0.1).toFixed(3)})`;
        return (
          <g
            key={`${s.col}-${s.row}`}
            transform={`translate(${p.x},${p.y})`}
            onDragOver={onDragOverSlot ? (e) => onDragOverSlot(s, e) : undefined}
            onDrop={onDropSlot ? (e) => onDropSlot(s, e) : undefined}
            data-testid={`world-tile-${s.col}-${s.row}`}
          >
            <rect x={-TILE_W / 2} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={10} fill={fill} stroke={stroke} strokeWidth={hot ? 2.5 : 1.5} />
            <rect x={-TILE_W / 2 + 6} y={-TILE_H / 2 + 5} width={TILE_W - 12} height={TILE_H - 10} rx={6} fill="none" stroke={stroke} strokeOpacity={0.35} strokeWidth={1} strokeDasharray={front ? undefined : '4 4'} />
            {hot && <ellipse rx={TILE_W * 0.42} ry={TILE_H * 0.32} fill="#ffd76a" opacity={0.16 + pulse * 0.1} />}
          </g>
        );
      })}
    </g>
  );
}
