// Styles for the player-facing Gallery (/gallery). Same temple backdrop + Cinzel/gold look as the menu.
export const CODEX_CSS = `
.cx-screen { position: fixed; inset: 0; overflow: hidden; background: #0d0814; color: var(--text);
  -webkit-tap-highlight-color: transparent; }
.cx-screen button { touch-action: manipulation; font: inherit; }
.cx-bg { position: absolute; inset: 0; pointer-events: none; }
.cx-bg svg { width: 100%; height: 100%; display: block; }
.cx-dim { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 30%, rgba(10,6,16,.55), rgba(10,6,16,.9) 70%); }
.cx-scroll { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }

/* ---------- header */
.cx-head { position: sticky; top: 0; z-index: 5; padding: max(14px, env(safe-area-inset-top)) 16px 12px;
  background: linear-gradient(180deg, rgba(13,8,20,.96) 60%, rgba(13,8,20,.82));
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(201,164,92,.22); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.cx-head-row { width: min(1240px, 100%); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; }
.cx-head-sp { display: block; }
.cx-back { justify-self: start; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 6px;
  border: 1px solid var(--line); background: rgba(20,16,28,.7); color: var(--text-dim); font-weight: 600; font-size: 13px; cursor: pointer;
  transition: color .12s, border-color .12s; white-space: nowrap; }
.cx-back:hover { color: var(--gold); border-color: var(--bronze-hi); }
.cx-back:focus-visible, .cx-tab:focus-visible, .cx-chip:focus-visible, .cx-card:focus-visible, .cx-pop-close:focus-visible {
  outline: 2px solid var(--gold); outline-offset: 2px; }
.cx-title { margin: 0; font-family: var(--font-head); font-weight: 900; font-size: clamp(26px, 4vw, 40px); letter-spacing: .1em;
  text-transform: uppercase; line-height: 1;
  background: linear-gradient(180deg, #fff3c4 0%, var(--gold) 40%, var(--gold-deep) 65%, #7a4f12 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 3px 0 rgba(0,0,0,.55)); }
.cx-tabs { display: flex; gap: 4px; padding: 3px; border-radius: 8px; background: rgba(0,0,0,.35); border: 1px solid rgba(201,164,92,.25); }
.cx-tab { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 16px; border: 0; border-radius: 6px;
  background: transparent; color: var(--text-dim); cursor: pointer; font-family: var(--font-head) !important; font-weight: 700;
  font-size: 14px !important; letter-spacing: .08em; text-transform: uppercase; transition: color .12s, background .12s; }
.cx-tab:hover { color: var(--text); }
.cx-tab.on { color: #2a1a02; background: linear-gradient(180deg, #ffd977, #c98d1d); box-shadow: 0 0 12px rgba(255,207,90,.25); }
.cx-count { font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 0; padding: 1px 6px; border-radius: 99px;
  background: rgba(255,255,255,.08); color: inherit; font-variant-numeric: tabular-nums; }
.cx-tab.on .cx-count { background: rgba(0,0,0,.18); }
.cx-filter { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.cx-chip { --c: var(--bronze-hi); display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 11px; border-radius: 99px;
  border: 1px solid var(--line); background: rgba(20,16,28,.6); color: var(--text-dim); cursor: pointer; font-size: 12px; font-weight: 600;
  transition: color .12s, border-color .12s, background .12s; }
.cx-chip:hover { color: var(--text); border-color: color-mix(in srgb, var(--c) 60%, var(--line)); }
.cx-chip.on { color: #fff; border-color: var(--c); background: color-mix(in srgb, var(--c) 22%, rgba(20,16,28,.8)); }
.cx-chip-ic { color: var(--c); }

/* ---------- body */
.cx-main { width: min(1240px, 100%); margin: 0 auto; padding: 18px 16px max(40px, env(safe-area-inset-bottom)); }
.cx-hint { text-align: center; color: var(--text-faint); font-size: 12px; margin: 22px 0 0; }
.cx-grid { display: grid; gap: 12px; }
.cx-grid.heroes { grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); }
.cx-grid.lords { grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
.cx-grid.items { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }
.cx-card { --c: var(--bronze-hi); position: relative; border-radius: 8px; border: 1px solid rgba(201,164,92,.2); color: inherit; text-align: left;
  background: linear-gradient(180deg, rgba(36,30,48,.78), rgba(16,12,22,.88)); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
button.cx-card { cursor: pointer; transition: border-color .15s, transform .15s, box-shadow .15s; }
button.cx-card:hover, button.cx-card.on { border-color: color-mix(in srgb, var(--c) 70%, #fff 10%);
  box-shadow: 0 8px 24px rgba(0,0,0,.45), 0 0 0 1px color-mix(in srgb, var(--c) 40%, transparent), 0 0 22px color-mix(in srgb, var(--c) 18%, transparent); }
button.cx-card:hover { transform: translateY(-2px); }
.cx-stars { letter-spacing: -1px; font-size: 11px; text-shadow: 0 0 3px rgba(0,0,0,.9); white-space: nowrap; }
.cx-name { font-family: var(--font-head); font-weight: 700; font-size: 16px; color: #f6f0e4; text-shadow: 0 2px 4px rgba(0,0,0,.8); line-height: 1.15; }
.cx-name.lg { font-size: 22px; text-align: center; margin: 4px 0 10px; }
.cx-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.cx-cls { color: var(--c); padding: 1px 7px; border-radius: 99px; background: color-mix(in srgb, var(--c) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); white-space: nowrap; }
.cx-attr, .cx-range { padding: 1px 6px; border-radius: 4px; background: rgba(0,0,0,.35); white-space: nowrap; }
.cx-range { color: var(--text-dim); }

/* hero card */
.cx-hero { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 10px 12px; text-align: center; overflow: hidden; }
.cx-hero::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 130px; pointer-events: none;
  background: radial-gradient(ellipse at 50% 85%, color-mix(in srgb, var(--pal) 30%, transparent), transparent 70%); }
.cx-hero-fig { position: relative; width: 100%; height: 124px; margin-bottom: 2px; }
.cx-hero-fig .portrait { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.cx-hero .cx-badges { justify-content: center; }
.cx-kit { display: flex; gap: 6px; margin-top: 6px; }
.cx-sk { position: relative; display: grid; place-items: center; flex: none; border-radius: 4px; border: 1px solid rgba(0,0,0,.9);
  background: linear-gradient(160deg, #2c3240, #0e1014); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
.cx-sk.sm { width: 32px; height: 32px; font-size: 17px; }
.cx-sk.lg { width: 46px; height: 46px; font-size: 25px; }
.cx-sk.ult { box-shadow: inset 0 0 0 1.5px var(--gold), inset 0 0 10px rgba(255,207,90,.4), 0 0 8px rgba(255,207,90,.25); }
.cx-sk-g { line-height: 1; }
.cx-sk i { position: absolute; left: -1px; bottom: -1px; font-style: normal; font-size: 9px; font-weight: 900; line-height: 11px; padding: 0 3px;
  color: #e8e2d4; background: rgba(0,0,0,.85); border-radius: 0 3px 0 3px; }
.cx-sk.ult i { color: #2a1d02; background: var(--gold); }
.cx-sk.lg i { font-size: 10px; line-height: 13px; padding: 0 4px; }

/* lord card */
.cx-lord { padding: 0 16px 16px; overflow: hidden; }
.cx-lord::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 230px; pointer-events: none;
  background: radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--c) 28%, transparent), transparent 65%); }
.cx-lord-fig { position: relative; height: 220px; margin: 0 -16px; }
.cx-lord-fig svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.cx-lord-fig svg ellipse[stroke="#5fd068"], .cx-lord-fig svg ellipse[stroke="#e5484d"] { display: none; }
.cx-lord-ab { position: relative; display: flex; gap: 11px; align-items: flex-start; }
.cx-lord-ic { flex: none; width: 48px; height: 48px; border-radius: 4px; padding: 4px;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c) 85%, #fff 15%), color-mix(in srgb, var(--c) 45%, #000) 80%);
  border: 2px solid #0b0910; box-shadow: inset 2px 2px 0 rgba(255,255,255,.35), inset -2px -2px 0 rgba(0,0,0,.45), 0 3px 8px rgba(0,0,0,.6); }
.cx-lord-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 7px; font-weight: 800; font-size: 14px; font-variant: small-caps;
  letter-spacing: .05em; color: #fff7e6; }
.cx-kind { font-size: 9.5px; font-weight: 800; font-variant: normal; letter-spacing: .1em; text-transform: uppercase; padding: 1px 6px; border-radius: 99px; }
.cx-kind.active { color: #c8f5cc; background: rgba(95,208,104,.18); }
.cx-kind.passive { color: #cfd8ff; background: rgba(120,140,255,.16); }
.cx-lord-desc { margin: 4px 0 0; font-size: 12.5px; line-height: 1.45; color: rgba(238,230,218,.85); }

/* items */
.cx-items { display: flex; flex-direction: column; gap: 22px; }
.cx-group-h { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(201,164,92,.2);
  font-family: var(--font-head); font-weight: 700; font-size: 15px; letter-spacing: .1em; text-transform: uppercase; color: var(--bronze-hi); }
.cx-group-h .cx-stars { font-size: 14px; letter-spacing: 0; }
.cx-item { display: flex; gap: 11px; align-items: flex-start; padding: 10px 12px; min-height: 76px; }
.cx-item-ic { flex: none; width: 44px; height: 44px; display: grid; place-items: center; font-size: 24px; border-radius: 6px;
  border: 1px solid rgba(0,0,0,.9); background: linear-gradient(160deg, #2c3240, #0e1014);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 70%, transparent), inset 0 0 10px color-mix(in srgb, var(--c) 30%, transparent); }
.cx-item.agh .cx-item-ic { box-shadow: inset 0 0 0 1px #5aa8ff, inset 0 0 10px rgba(77,163,255,.5); }
.cx-item.bkb .cx-item-ic { box-shadow: inset 0 0 0 1px var(--gold), inset 0 0 10px rgba(255,207,90,.45); }
.cx-item-txt { min-width: 0; flex: 1; }
.cx-item-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.cx-item-name { font-size: 13.5px; font-weight: 700; }
.cx-item-stats { margin-top: 2px; font-size: 11.5px; font-weight: 600; color: #bfe3c3; }
.cx-item-desc { margin: 3px 0 0; font-size: 12px; line-height: 1.38; color: var(--text-dim);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ---------- popover / bottom sheet */
.cx-pop { position: fixed; z-index: 50; width: 300px; max-height: calc(100dvh - 16px); overflow-y: auto; overscroll-behavior: contain;
  background: linear-gradient(180deg, #1f1a2a, #120e18); border: 1px solid var(--bronze); border-radius: 10px;
  box-shadow: 0 16px 44px rgba(0,0,0,.7), 0 0 0 1px rgba(0,0,0,.6); font-size: 12.5px; line-height: 1.45; animation: cx-pop-in .14s ease-out; }
.cx-pop.peek { pointer-events: none; }
.cx-pop.pinned:not(.sheet) { border-color: var(--bronze-hi); }
.cx-pop.wide { width: 660px; max-width: calc(100vw - 16px); }
.cx-pop-body { padding: 12px 14px 14px; }
.cx-pop .tip-body p { margin: 6px 0 0; }
@keyframes cx-pop-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.cx-pop.sheet { left: 0; right: 0; bottom: 0; top: auto; width: auto; max-height: 82dvh; border-radius: 16px 16px 0 0; border-bottom: 0;
  padding-bottom: env(safe-area-inset-bottom); animation: cx-sheet-in .2s cubic-bezier(.2,.8,.2,1); }
.cx-pop.sheet .cx-pop-body { padding: 16px 16px 20px; }
@keyframes cx-sheet-in { from { transform: translateY(100%); } to { transform: none; } }
.cx-sheet-backdrop { position: fixed; inset: 0; z-index: 49; background: rgba(4,2,8,.6); animation: cx-fade .2s; }
@keyframes cx-fade { from { opacity: 0; } }
.cx-pop-close { position: sticky; float: right; top: 8px; margin: 8px 8px -44px 0; z-index: 2; width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid var(--line); background: rgba(10,8,14,.9); color: var(--text); font-size: 15px; cursor: pointer; display: grid; place-items: center; }

/* hero detail: two columns in the desktop popover (portrait + stats | abilities), one column in the sheet */
.cx-pop.wide .cx-hd { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 16px; }
.cx-pop.wide .cx-hd-top { flex-direction: column; gap: 10px; }
.cx-pop.wide .cx-hd-fig { width: 100%; height: 170px; }
.cx-pop.wide .cx-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cx-pop.wide .cx-hd-main > .cx-sec:first-child, .cx-pop.wide .cx-hd-side > .cx-sec:first-child { margin-top: 0; }
.cx-hd-top { display: flex; gap: 14px; align-items: stretch; }
.cx-hd-fig { flex: none; width: 132px; height: 140px; border-radius: 8px; position: relative; overflow: hidden;
  background: radial-gradient(ellipse at 50% 85%, color-mix(in srgb, var(--c) 28%, transparent), rgba(0,0,0,.25) 75%);
  border: 1px solid rgba(255,255,255,.06); }
.cx-hd-fig .portrait { position: absolute; inset: 6px 0 4px; width: 100%; height: calc(100% - 10px); overflow: visible; }
.cx-hd-info { min-width: 0; display: flex; flex-direction: column; gap: 5px; padding-right: 34px; }
.cx-pop:not(.sheet) .cx-hd-info { padding-right: 0; }
.cx-hd-name { margin: 0; font-family: var(--font-head); font-weight: 900; font-size: 24px; line-height: 1.05; color: var(--gold); letter-spacing: .02em; }
.cx-blurb { margin: 2px 0 0; color: var(--text-dim); font-size: 12.5px; line-height: 1.42; }
.cx-sec { margin: 12px 0 6px; font-size: 10.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--bronze-hi);
  display: flex; align-items: center; gap: 8px; }
.cx-sec::after { content: ''; flex: 1; height: 1px; background: rgba(201,164,92,.22); }
.cx-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.cx-st { display: flex; flex-direction: column; padding: 5px 7px; border-radius: 5px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.05); }
.cx-st span { font-size: 10px; color: var(--text-faint); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
.cx-st b { font-size: 13.5px; font-variant-numeric: tabular-nums; color: var(--text); }
.cx-st.hp b { color: #8fe596; }
.cx-st.mana b { color: #7fbcff; }
.cx-skills { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.cx-skill { display: flex; gap: 11px; align-items: flex-start; padding: 8px 10px; border-radius: 7px; background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.05); }
.cx-skill.ult { border-color: rgba(255,207,90,.35); background: linear-gradient(90deg, rgba(255,207,90,.08), rgba(255,207,90,.02)); }
.cx-skill-txt { min-width: 0; flex: 1; }
.cx-skill-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.cx-key { font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; padding: 1px 6px; border-radius: 3px;
  background: rgba(0,0,0,.5); color: var(--text-dim); }
.cx-skill.ult .cx-key { background: var(--gold); color: #2a1d02; }
.cx-skill-name { font-size: 14px; color: #f6f0e4; }
.cx-skill-meta { display: inline-flex; gap: 10px; margin-left: auto; font-size: 11.5px; color: var(--text-dim); font-weight: 600; white-space: nowrap; }
.cx-passive { color: #c8b7ff; }
.cx-skill p { margin: 3px 0 0; font-size: 12.5px; line-height: 1.42; color: var(--text); }
.cx-agh { display: flex; gap: 7px; align-items: flex-start; margin-top: 6px; padding: 5px 8px; border-radius: 5px;
  border: 1px solid rgba(77,163,255,.35); background: rgba(30,70,120,.25); color: #bfe0ff; font-size: 12px; line-height: 1.38; }
.cx-agh b { color: #7fc4ff; font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; margin-right: 3px; }

/* ---------- phones */
@media (max-width: 640px) {
  .cx-head { padding: max(10px, env(safe-area-inset-top)) 12px 10px; gap: 8px; }
  .cx-head-row { grid-template-columns: auto 1fr auto; }
  .cx-head-row .cx-title { text-align: center; }
  .cx-head-sp { width: 0; }
  .cx-back { height: 32px; padding: 0 10px; font-size: 12px; }
  .cx-title { font-size: 24px; }
  .cx-tabs { width: 100%; }
  .cx-tab { flex: 1; justify-content: center; padding: 0 6px; font-size: 12.5px !important; gap: 5px; }
  .cx-filter { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; width: calc(100% + 24px); margin: 0 -12px; padding: 0 12px 2px;
    scrollbar-width: none; }
  .cx-filter::-webkit-scrollbar { display: none; }
  .cx-chip { flex: none; }
  .cx-main { padding: 12px 12px max(32px, env(safe-area-inset-bottom)); }
  .cx-grid.heroes { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .cx-hero { padding: 0 6px 10px; }
  .cx-hero-fig { height: 104px; }
  .cx-name { font-size: 14.5px; }
  .cx-kit { gap: 4px; }
  .cx-sk.sm { width: 30px; height: 30px; font-size: 16px; }
  .cx-grid.lords { grid-template-columns: minmax(0, 1fr); }
  .cx-lord-fig { height: 180px; }
  .cx-grid.items { grid-template-columns: minmax(0, 1fr); }
  .cx-hd-fig { width: 104px; height: 116px; }
  .cx-hd-name { font-size: 21px; }
  .cx-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cx-hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .cx-pop, .cx-pop.sheet, .cx-sheet-backdrop { animation: none; }
  button.cx-card:hover { transform: none; }
}
`;
