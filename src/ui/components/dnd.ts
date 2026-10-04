// Tiny HTML5 drag-and-drop helper. The payload lives in a module variable because
// dataTransfer contents are not readable during dragover.
import { useRef, useState, type DragEvent } from 'react';
import { isTouch } from './hud/layout.ts';
import { hideTip } from './Tooltip.tsx';

export type DragPayload =
  | { kind: 'hero'; uid: string }
  | { kind: 'spellInv'; idx: number }
  | { kind: 'itemInv'; idx: number }
  | { kind: 'spellSlot'; uid: string; slot: number }
  | { kind: 'itemSlot'; uid: string; slot: number };

let current: DragPayload | null = null;

function endDrag() {
  current = null;
  document.body.className = document.body.className
    .split(' ')
    .filter((c) => c !== 'dragging' && !c.startsWith('drag-'))
    .join(' ');
}
// The drag source may unmount on drop (hero moved to another cell), so its dragend never fires.
if (typeof document !== 'undefined') {
  document.addEventListener('drop', () => setTimeout(endDrag, 0), true);
  document.addEventListener('dragend', endDrag, true);
}

export function dragProps(p: DragPayload | null) {
  // iOS Safari has no HTML5 drag-and-drop: touch screens use tap-to-assign instead
  if (!p || isTouch()) return {};
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.stopPropagation();
      current = p;
      hideTip();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', p.kind);
      document.body.classList.add('dragging', `drag-${p.kind}`);
    },
    onDragEnd: endDrag,
  };
}

/** Returns props for a drop target plus whether a valid payload is hovering it. */
export function useDrop(accept: (p: DragPayload) => boolean, onDrop: (p: DragPayload) => void) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const props = {
    onDragEnter: (e: DragEvent) => {
      if (!current || !accept(current)) return;
      e.preventDefault();
      depth.current++;
      setOver(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!current || !accept(current)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    },
    onDragLeave: () => {
      if (depth.current > 0) depth.current--;
      if (depth.current === 0) setOver(false);
    },
    onDrop: (e: DragEvent) => {
      depth.current = 0;
      setOver(false);
      const p = current;
      if (!p || !accept(p)) return;
      e.preventDefault();
      e.stopPropagation();
      onDrop(p);
    },
  };
  return { props, over };
}

/** The payload currently being dragged (valid during drop handlers, incl. World's). */
export const currentDrag = (): DragPayload | null => current;
