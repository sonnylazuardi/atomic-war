// "Choose Your Summoner": four animated lords over the temple-ruins backdrop, 30s countdown,
// one free reroll, START picks the selected lord (double-click picks immediately).
import { useEffect, useMemo, useRef, useState } from 'react';
import { LordIcon, SummonerAmbient, SummonerBackdrop, getLordArt, isHeroLordArt } from '../../art/lords/index.ts';
import type { LordId } from '../../core/types.ts';
import { lordDef } from '../components/defs.ts';
import { useGame } from '../store.ts';
import { useClock } from '../useClock.ts';
import { LORD_SELECT_CSS } from './lordSelect.css.ts';

const PICK_TIME = 30;

/** same flag as the prep timer: `?prep=0` disables the countdown */
function timerEnabled(): boolean {
  if (typeof location === 'undefined') return true;
  const v = new URLSearchParams(location.search).get('prep');
  return v === null || v === '' || Number(v) !== 0;
}

function LordFigure({ id, t, flip }: { id: LordId; t: number; flip: boolean }) {
  const Art = getLordArt(id);
  return (
    <svg viewBox="-55 -100 110 106" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <ellipse cx={0} cy={0} rx={34} ry={7} fill="#000" opacity={0.35} />
      <g transform={`scale(${flip ? -1 : 1},1)${isHeroLordArt(id) ? ' scale(1.13)' : ''}`}>
        <Art anim="idle" t={t} dur={0} team="left" />
      </g>
    </svg>
  );
}

function Countdown({ left, total }: { left: number; total: number }) {
  const R = 27;
  const C = 2 * Math.PI * R;
  const k = Math.max(0, Math.min(1, left / total));
  const secs = Math.max(0, Math.ceil(left));
  return (
    <div className={`sm-timer${secs <= 5 ? ' low' : ''}`} data-testid="lord-timer">
      <svg viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={R + 3} fill="rgba(10,6,16,.55)" />
        <circle cx={32} cy={32} r={R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={3} />
        <circle
          cx={32}
          cy={32}
          r={R}
          fill="none"
          stroke={secs <= 5 ? '#ffb38a' : '#f4efe6'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${(C * k).toFixed(1)} ${C.toFixed(1)}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span>{secs}</span>
    </div>
  );
}

export function LordSelect() {
  const g = useGame();
  const t = useClock();
  const choices = g.lordChoices ?? [];
  const choiceKey = choices.join(',');
  const [sel, setSel] = useState(0);
  const timer = useMemo(timerEnabled, []);
  const fired = useRef(false);

  useEffect(() => setSel(0), [choiceKey]);

  const pick = (i: number) => {
    const id = choices[i] ?? choices[0];
    if (!id || fired.current) return;
    fired.current = true;
    g.pickLord(id);
  };

  // online: the server's lord-select deadline (already converted to the local clock); offline: 30 s from mount
  const deadline = g.phaseDeadline ?? null;
  const left = deadline != null ? (deadline - Date.now()) / 1000 : PICK_TIME - t;
  const total = deadline != null ? Math.max(PICK_TIME, Math.ceil(left)) : PICK_TIME;
  const picked = deadline != null && !!g.players[g.selfId ?? 0]?.lordId;
  useEffect(() => {
    // online: send our selection a moment before the server's own auto-pick (first offered lord)
    if (deadline != null ? left <= 1 : timer && left <= 0) pick(sel);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) setSel(n - 1);
      else if (e.key === 'Enter') pick(sel);
      else if ((e.key === 'r' || e.key === 'R') && !g.lordRerollUsed) g.rerollLords();
      else if (e.key === 'ArrowRight') setSel((s) => Math.min(choices.length - 1, s + 1));
      else if (e.key === 'ArrowLeft') setSel((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="screen summoner-select" data-testid="lord-select">
      <style>{LORD_SELECT_CSS}</style>
      <div className="sb-layer static">
        <SummonerBackdrop />
      </div>
      <div className="sb-layer">
        <SummonerAmbient t={t} />
      </div>
      <div className="sm-content">
        {timer || deadline != null ? <Countdown left={left} total={total} /> : null}
        <h1 className="sm-title">Choose Your Summoner</h1>
        <div className="sm-row" role="listbox" aria-label="Summoners">
          {choices.map((id, i) => {
            const l = lordDef(id);
            return (
              <button
                key={`${choiceKey}-${i}`}
                type="button"
                role="option"
                aria-selected={sel === i}
                data-testid="lord-option"
                data-lord={id}
                className={`sm-card${sel === i ? ' sel' : ''}`}
                style={{ ['--lord-c' as string]: l.color, animationDelay: `${i * 90}ms` }}
                onClick={() => setSel(i)}
                onDoubleClick={() => pick(i)}
              >
                <div className="sm-fig">
                  <LordFigure id={id} t={t + i * 0.37} flip={i >= 2} />
                </div>
                <div className="sm-name">{l.name}</div>
                <div className="sm-ability">
                  <div className="sm-icon">
                    <LordIcon id={id} />
                  </div>
                  <div className="sm-text">
                    <div className="sm-ab-title">
                      {l.title}
                      <span className="sm-kind">{l.kind}</span>
                    </div>
                    <p className="sm-desc">{l.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="sm-actions">
          <button
            type="button"
            className="sm-btn reroll"
            data-testid="reroll-lords"
            disabled={g.lordRerollUsed}
            title={g.lordRerollUsed ? 'Reroll used' : 'Reroll summoners (1 free)'}
            aria-label="Reroll summoners"
            onClick={() => g.rerollLords()}
          >
            ⟳
          </button>
          <button type="button" className="sm-btn start" data-testid="lord-start" disabled={!choices.length} onClick={() => pick(sel)}>
            START
          </button>
        </div>
        <div className="sm-hint">Click to select · double-click or START to summon · 1–4 / Enter / R</div>
      </div>
      {picked && (
        <div className="sm-waiting" data-testid="lord-waiting">
          Waiting for the other summoners…
        </div>
      )}
    </div>
  );
}
