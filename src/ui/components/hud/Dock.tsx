// Bottom-left dock: lord portrait + V (lord ability) / F (Tavern) / Space (Mystery shop) keys.
import type { ReactNode } from 'react';
import { MAX_SHOP_LEVEL, shopUpgradeCost } from '../../../core/constants.ts';
import { lordActiveAvailable, refreshCostFor } from '../../../core/game/lords.ts';
import { useMe } from '../../me.ts';
import { useGame } from '../../store.ts';
import { lordDef, starColor } from '../defs.ts';
import { LordTip, tip } from '../Tooltip.tsx';
import { useUi } from '../uiState.ts';
import { safe, triggerLord } from './actions.ts';
import { OddsTable } from './Stars.tsx';
import { lordStatus } from './lordStatus.ts';

interface KeyProps {
  k: string;
  label: string;
  testid: string;
  disabled?: boolean;
  active?: boolean;
  badge?: ReactNode;
  poor?: boolean;
  onClick: () => void;
  tipBody?: () => ReactNode;
  children: ReactNode;
}

function KeyButton({ k, label, testid, disabled, active, badge, poor, onClick, tipBody, children }: KeyProps) {
  return (
    <div className="key-wrap">
      <button
        className={`key-btn ${active ? 'active' : ''}`}
        data-testid={testid}
        disabled={disabled}
        onClick={(e) => {
          e.currentTarget.blur();
          onClick();
        }}
        {...(tipBody ? tip(tipBody) : {})}
      >
        <span className="key-letter">{k}</span>
        <span className="key-face">{children}</span>
        {badge !== undefined && badge !== null && <span className={`key-badge ${poor ? 'poor' : ''}`}>{badge}</span>}
      </button>
      <span className="key-label">{label}</span>
    </div>
  );
}

export function Dock({ shopOpen, onToggleShop }: { shopOpen: boolean; onToggleShop: () => void }) {
  const me = useMe();
  const phase = useGame((s) => s.phase);
  const round = useGame((s) => s.round);
  const upgradeShop = useGame((s) => s.upgradeShop);
  const lordTargeting = useUi((s) => s.lordTargeting);
  const prep = phase === 'prep';
  const lord = me.lordId ? lordDef(me.lordId) : null;
  const lordActive = lord?.kind === 'active';
  const ls = lordStatus(me, lord, round);
  const lordReady = lordActive && !ls.poor && safe(() => lordActiveAvailable(me), true);
  const upCost = shopUpgradeCost(me.shopLevel);
  const maxed = me.shopLevel >= MAX_SHOP_LEVEL;
  const refresh = safe(() => refreshCostFor(me), 1);

  const lordTipBody = lord
    ? () => (
        <>
          <LordTip id={lord.id} />
          {ls.line && <div className="tip-body lord-status">{ls.line}</div>}
        </>
      )
    : undefined;

  return (
    <div className="hud-dock">
      <div className="dock-lord" style={{ ['--lord-c' as string]: lord?.color ?? '#8a6a3c' }} {...(lord ? tip(() => <LordTip id={lord.id} />) : {})}>
        <span className="dock-lord-glyph">{lord?.glyph ?? '👑'}</span>
        <span className="dock-lord-name">{lord?.name ?? 'Lord'}</span>
      </div>
      <KeyButton
        k="V"
        label={ls.short ?? lord?.title ?? 'Lord'}
        testid="lord-ability"
        disabled={!prep || !lordActive || (!lordReady && !lordTargeting)}
        active={lordTargeting}
        badge={ls.badge}
        poor={ls.poor}
        onClick={triggerLord}
        tipBody={lordTipBody}
      >
        <span className="key-glyph">{lordTargeting ? '🎯' : lord?.glyph ?? '✦'}</span>
      </KeyButton>
      <KeyButton
        k="F"
        label="Tavern"
        testid="upgrade-shop"
        disabled={!prep || maxed}
        badge={maxed ? 'MAX' : `$${upCost}`}
        poor={!maxed && me.coins < upCost}
        onClick={() => upgradeShop()}
        tipBody={() => <OddsTable level={me.shopLevel} />}
      >
        <span className="key-glyph tavern">🍺</span>
        <span className="tavern-stars">
          {Array.from({ length: MAX_SHOP_LEVEL }, (_, i) => (
            <i key={i} style={i < me.shopLevel ? { color: starColor(me.shopLevel) } : undefined} className={i < me.shopLevel ? 'on' : ''}>
              ★
            </i>
          ))}
        </span>
      </KeyButton>
      <KeyButton
        k="Space"
        label="Mystery"
        testid="open-shop"
        disabled={!prep}
        active={shopOpen}
        badge={`⟳$${refresh}`}
        onClick={onToggleShop}
        tipBody={() => (
          <div className="tip-body">
            <div className="tip-title">Mystery Shop</div>
            <p>Heroes, items and spells. Space toggles · R refreshes · Esc closes.</p>
          </div>
        )}
      >
        <span className="key-glyph mys">?</span>
      </KeyButton>
    </div>
  );
}
