// "Graphics: Auto / High / Battery saver" (lives in the speaker popover). Auto shows what it resolved to.
import { setPerfMode, usePerf, usePerfMode, type PerfMode } from '../perf.ts';

const CSS = `
.aw-perf{margin-top:9px;padding-top:8px;border-top:1px solid var(--line,#2e3646)}
.aw-perf-head{display:flex;justify-content:space-between;gap:6px;margin-bottom:5px}
.aw-perf-head span:last-child{color:var(--text-faint,#6b7280);font-size:11px}
.aw-perf-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:2px;border-radius:6px;background:rgba(0,0,0,.35);border:1px solid var(--line,#2e3646)}
.aw-perf-seg button{height:24px;padding:0 2px;border:0;border-radius:4px;background:none;color:var(--text-dim,#9aa1ad);font:600 11px var(--font-body,system-ui);cursor:pointer;white-space:nowrap}
.aw-perf-seg button[aria-pressed=true]{background:linear-gradient(180deg,#3a2f17,#241c0d);color:var(--gold,#ffcf5a);box-shadow:inset 0 0 0 1px var(--gold-deep,#d9a12a)}
.aw-perf-seg button:focus-visible{outline:2px solid var(--gold,#ffcf5a);outline-offset:1px}
`;

const OPTS: { m: PerfMode; label: string }[] = [
  { m: 'auto', label: 'Auto' },
  { m: 'high', label: 'High' },
  { m: 'saver', label: 'Battery saver' },
];

export function PerfSetting() {
  const mode = usePerfMode();
  const tier = usePerf().tier;
  const resolved = tier === 'saver' ? 'Battery saver' : 'High';
  return (
    <div className="aw-perf" data-testid="perf-mode" data-mode={mode} data-tier={tier}>
      <style>{CSS}</style>
      <div className="aw-perf-head">
        <span>Graphics</span>
        <span data-testid="perf-resolved">{mode === 'auto' ? `Auto · ${resolved}` : resolved}</span>
      </div>
      <div className="aw-perf-seg" role="group" aria-label="Graphics quality">
        {OPTS.map((o) => (
          <button key={o.m} type="button" aria-pressed={mode === o.m} data-mode={o.m} onClick={() => setPerfMode(o.m)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
