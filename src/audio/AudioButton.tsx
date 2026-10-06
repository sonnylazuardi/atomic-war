// Speaker button + tiny popover (Music / SFX sliders, Mute). Hotkey M toggles mute (see wire.ts).
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getSettings, setSettings, subscribeSettings } from './engine.ts';
import { PerfSetting } from '../ui/components/PerfSetting.tsx';

const CSS = `
.aw-audio{position:relative;display:inline-flex;flex:none}
.aw-audio.floating{position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:50}
.aw-audio-btn{width:32px;height:32px;display:grid;place-items:center;padding:0;border-radius:50%;cursor:pointer;
 color:var(--gold,#ffcf5a);background:radial-gradient(circle,#2a2112,#0f0c07);border:1px solid var(--hud-line,rgba(201,164,92,.42));
 box-shadow:0 0 8px rgba(255,207,90,.12)}
.aw-audio-btn:hover{filter:brightness(1.25)}
.aw-audio-btn:focus-visible{outline:2px solid var(--gold,#ffcf5a);outline-offset:2px}
.aw-audio-btn.muted{color:var(--text-faint,#6b7280)}
.aw-audio-btn svg{width:18px;height:18px}
.aw-audio-pop{position:absolute;top:calc(100% + 8px);right:-6px;z-index:1000;width:236px;padding:10px 12px;border-radius:8px;
 background:linear-gradient(180deg,rgba(22,26,34,.97),rgba(9,11,15,.97));border:1px solid var(--hud-line,rgba(201,164,92,.42));
 box-shadow:0 6px 20px rgba(0,0,0,.6);font:12px var(--font-body,system-ui,sans-serif);color:var(--text,#e8e2d4);text-align:left}
.aw-audio-row{display:grid;grid-template-columns:44px 1fr 28px;align-items:center;gap:6px;margin:4px 0}
.aw-audio-row input{width:100%;accent-color:var(--gold,#ffcf5a);margin:0}
.aw-audio-row span:last-child{text-align:right;font-variant-numeric:tabular-nums;color:var(--text-dim,#9aa1ad)}
.aw-audio-mute{display:flex;align-items:center;gap:6px;margin-top:6px;cursor:pointer;user-select:none}
.aw-audio-mute input{accent-color:var(--gold,#ffcf5a);margin:0}
.aw-audio-hint{margin-top:6px;color:var(--text-faint,#6b7280);font-size:11px}
.mplay .aw-audio-btn{width:28px;height:28px}
.mplay .aw-audio-pop{right:0}
`;

function Speaker({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" strokeWidth="1.5" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      ) : (
        <>
          <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
          <path d="M18.3 6.5a7.8 7.8 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}

export function AudioButton({ floating = false }: { floating?: boolean }) {
  const s = useSyncExternalStore(subscribeSettings, getSettings, getSettings);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  // inside the game stage the HUD is its own stacking context (under the log toasts): portal the
  // popover to the stage root, placed under the button in stage (unscaled) coordinates
  const [host, setHost] = useState<{ el: HTMLElement; style: CSSProperties } | null>(null);
  useLayoutEffect(() => {
    const btn = ref.current;
    const stage = open ? (btn?.closest('#stage') as HTMLElement | null) : null;
    if (!btn || !stage) {
      setHost(null);
      return;
    }
    const b = btn.getBoundingClientRect();
    const r = stage.getBoundingClientRect();
    const k = stage.offsetWidth > 0 ? r.width / stage.offsetWidth : 1;
    setHost({ el: stage, style: { top: (b.bottom - r.top) / k + 8, right: Math.max(4, (r.right - b.right) / k - 6) } });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const portal = (node: ReactNode) => (host ? createPortal(node, host.el) : node);
  return (
    <div ref={ref} className={`aw-audio${floating ? ' floating' : ''}`}>
      <style>{CSS}</style>
      <button
        type="button"
        className={`aw-audio-btn${s.muted ? ' muted' : ''}`}
        data-testid="audio-toggle"
        data-muted={s.muted ? '1' : '0'}
        aria-label={s.muted ? 'Sound off (M)' : 'Sound on (M)'}
        aria-expanded={open}
        title="Sound (M mutes)"
        onClick={() => setOpen((o) => !o)}
      >
        <Speaker muted={s.muted} />
      </button>
      {open && portal(
        <div ref={popRef} className="aw-audio-pop" style={host?.style} data-testid="audio-popover" role="dialog" aria-label="Sound settings">
          <label className="aw-audio-row">
            <span>Music</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(s.music * 100)}
              data-testid="audio-music"
              onChange={(e) => setSettings({ music: Number(e.target.value) / 100, muted: false })}
            />
            <span>{Math.round(s.music * 100)}</span>
          </label>
          <label className="aw-audio-row">
            <span>Effects</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(s.sfx * 100)}
              data-testid="audio-sfx"
              onChange={(e) => setSettings({ sfx: Number(e.target.value) / 100, muted: false })}
            />
            <span>{Math.round(s.sfx * 100)}</span>
          </label>
          <label className="aw-audio-mute">
            <input type="checkbox" checked={s.muted} data-testid="audio-mute" onChange={(e) => setSettings({ muted: e.target.checked })} />
            Mute all
          </label>
          <div className="aw-audio-hint">Press M to mute / unmute</div>
          <PerfSetting />
        </div>,
      )}
    </div>
  );
}
