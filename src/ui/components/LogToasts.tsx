import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store.ts';

const TOAST_MS = 2500;

interface Toast {
  id: number;
  msg: string;
  until: number;
}

/** Shows new log lines briefly (prep phase only); old lines never resurface. */
export function LogToasts() {
  const log = useGame((s) => s.log) ?? [];
  const phase = useGame((s) => s.phase);
  const seen = useRef(log.length);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (log.length < seen.current) seen.current = 0; // new game reset the log
    const fresh = log.slice(seen.current);
    seen.current = log.length;
    if (!fresh.length) return;
    const now = performance.now();
    setToasts((ts) => [...ts, ...fresh.map((msg, i) => ({ id: now + i, msg, until: now + TOAST_MS }))].slice(-3));
  }, [log]);

  useEffect(() => {
    if (!toasts.length) return;
    const next = Math.min(...toasts.map((t) => t.until)) - performance.now();
    const h = setTimeout(() => setToasts((ts) => ts.filter((t) => t.until > performance.now())), Math.max(0, next));
    return () => clearTimeout(h);
  }, [toasts]);

  useEffect(() => {
    if (phase !== 'prep') setToasts([]);
  }, [phase]);

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.msg}
        </div>
      ))}
    </div>
  );
}
