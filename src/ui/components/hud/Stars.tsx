import { MAX_SHOP_LEVEL, TAVERN_ODDS } from '../../../core/constants.ts';
import { starColor } from '../defs.ts';

/** ★ row colored by the star count (1 white … 6 red). */
export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={`stars ${className ?? ''}`} style={{ color: starColor(n) }} aria-label={`${n} star`}>
      {'★'.repeat(Math.max(1, Math.min(6, n)))}
    </span>
  );
}

/** % chance of each star 1★..6★ at a tavern level. */
export function oddsFor(level: number): readonly number[] {
  return TAVERN_ODDS[Math.max(1, Math.min(MAX_SHOP_LEVEL, level)) - 1] ?? TAVERN_ODDS[0]!;
}

export function OddsTable({ level }: { level: number }) {
  const odds = oddsFor(level);
  return (
    <div className="tip-body odds-tip">
      <div className="tip-title">Tavern · level {level}</div>
      <div className="tip-sub">Every Mystery offer rolls its star first.</div>
      <ul className="odds">
        {odds.map((p, i) => (
          <li key={i} style={{ color: starColor(i + 1), opacity: p > 0 ? 1 : 0.4 }}>
            Chance for {i + 1}★ <b>{p}%</b>
          </li>
        ))}
      </ul>
      {level < MAX_SHOP_LEVEL && (
        <div className="tip-foot">
          Next level:{' '}
          {oddsFor(level + 1)
            .map((p, i) => (p > 0 ? `${i + 1}★ ${p}%` : null))
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
    </div>
  );
}
