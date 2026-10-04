// Styles for the "Choose Your Summoner" screen (injected via <style>; styles.css belongs to the HUD).
export const LORD_SELECT_CSS = `
.summoner-select {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0d0814;
  color: #efe8dc;
  font-family: var(--font-body, system-ui, sans-serif);
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  container: summoner / size;
}
.summoner-select button { touch-action: manipulation; }
.summoner-select .sb-layer { position: absolute; inset: 0; pointer-events: none; }
.summoner-select .sb-layer.static { contain: strict; will-change: transform; }
.summoner-select .sb-svg { width: 100%; height: 100%; display: block; }
.sm-content {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1366px;
  height: 768px;
  transform: translate(-50%, -50%);
}
.sm-timer {
  position: absolute;
  left: 50%;
  top: 14px;
  width: 64px;
  height: 64px;
  margin-left: -32px;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.7));
}
.sm-timer svg { width: 100%; height: 100%; display: block; }
.sm-timer span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font: 600 25px/1 var(--font-head, Georgia, serif);
  color: #f4efe6;
  text-shadow: 0 2px 4px rgba(0,0,0,.8);
}
.sm-timer.low span { color: #ffb38a; }
.sm-title {
  position: absolute;
  left: 0;
  right: 0;
  top: 84px;
  margin: 0;
  text-align: center;
  font: 600 40px/1 var(--font-head, Georgia, serif);
  letter-spacing: .02em;
  color: #f1ebe0;
  text-shadow: 0 3px 10px rgba(0,0,0,.85), 0 0 30px rgba(190,150,255,.25);
}
.sm-row {
  position: absolute;
  left: 43px;
  right: 43px;
  top: 142px;
  align-items: start;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.sm-card {
  --lord-c: #c9a45c;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0 14px 18px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .18s, border-color .18s, box-shadow .18s, transform .18s;
  animation: sm-in .5s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes sm-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.sm-card:hover {
  background: linear-gradient(180deg, rgba(235,225,255,.06), rgba(235,225,255,.12) 55%, rgba(20,14,30,.35));
  border-color: rgba(230,220,255,.14);
}
.sm-card.sel {
  background: linear-gradient(180deg, rgba(240,232,255,.10), rgba(240,232,255,.2) 55%, rgba(20,14,30,.45));
  border-color: rgba(240,232,255,.32);
  box-shadow: 0 0 40px rgba(200,170,255,.18), inset 0 0 40px rgba(255,255,255,.05);
}
.sm-card:focus-visible { outline: 2px solid #e8dcff; outline-offset: 2px; }
.sm-fig {
  position: relative;
  height: 320px;
  margin: 0 -14px;
}
.sm-fig::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 14px;
  width: 210px;
  height: 260px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at 50% 70%, color-mix(in srgb, var(--lord-c) 30%, transparent), transparent 65%);
  opacity: 0;
  transition: opacity .25s;
  pointer-events: none;
}
.sm-card:hover .sm-fig::before, .sm-card.sel .sm-fig::before { opacity: 1; }
.sm-fig svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.sm-fig svg ellipse[stroke="#5fd068"], .sm-fig svg ellipse[stroke="#e5484d"] { display: none; }
.sm-name {
  margin: 6px 0 10px;
  text-align: center;
  font: 600 26px/1.1 var(--font-head, Georgia, serif);
  color: #f6f0e4;
  text-shadow: 0 2px 6px rgba(0,0,0,.9);
}
.sm-ability { display: flex; gap: 10px; align-items: flex-start; }
.sm-icon {
  flex: none;
  width: 54px;
  height: 54px;
  border-radius: 4px;
  padding: 4px;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--lord-c) 85%, #fff 15%), color-mix(in srgb, var(--lord-c) 45%, #000) 80%);
  border: 2px solid #0b0910;
  box-shadow: inset 2px 2px 0 rgba(255,255,255,.35), inset -2px -2px 0 rgba(0,0,0,.45), 0 0 0 1px color-mix(in srgb, var(--lord-c) 60%, #000), 0 3px 8px rgba(0,0,0,.6);
}
.sm-text { min-width: 0; }
.sm-ab-title {
  font-weight: 800;
  font-size: 13px;
  font-variant: small-caps;
  letter-spacing: .06em;
  color: #fff7e6;
  text-shadow: 0 1px 3px rgba(0,0,0,.9);
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.sm-kind {
  font-size: 9px;
  font-weight: 700;
  font-variant: normal;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--lord-c) 70%, #fff);
  opacity: .85;
}
.sm-desc {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.38;
  color: rgba(238,230,218,.82);
  text-shadow: 0 1px 2px rgba(0,0,0,.9);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.sm-actions {
  position: absolute;
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}
.sm-btn {
  height: 56px;
  border: 2px solid #0c1a08;
  border-radius: 4px;
  color: #fff;
  background: linear-gradient(180deg, #74c84a, #3f9a25 55%, #2b7516);
  box-shadow: inset 0 2px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(0,0,0,.3), 0 4px 14px rgba(0,0,0,.6), 0 0 22px rgba(110,220,80,.18);
  cursor: pointer;
  font: 800 22px/1 var(--font-head, Georgia, serif);
  letter-spacing: .12em;
  text-shadow: 0 2px 2px rgba(0,0,0,.6);
  transition: filter .15s, transform .1s;
}
.sm-btn:hover:not(:disabled) { filter: brightness(1.12); }
.sm-btn:active:not(:disabled) { transform: translateY(1px); }
.sm-btn:disabled { filter: grayscale(.85) brightness(.6); cursor: default; }
.sm-btn.reroll { width: 56px; padding: 0; font: 700 30px/1 system-ui, sans-serif; letter-spacing: 0; }
.sm-btn.start { width: 300px; }
.sm-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  text-align: center;
  font-size: 11px;
  color: rgba(230,220,240,.5);
  letter-spacing: .04em;
}
/* ---------- fluid layout: unscaled phones / small parents (desktop 1366x768 stage never matches) */
@container summoner (max-width: 1000px) or (max-height: 640px) {
  .sm-content {
    inset: 0;
    left: 0;
    top: 0;
    width: auto;
    height: auto;
    transform: none;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left));
  }
  .sm-timer {
    position: absolute;
    left: max(10px, env(safe-area-inset-left));
    top: max(8px, env(safe-area-inset-top));
    width: 40px;
    height: 40px;
    margin: 0;
  }
  .sm-timer span { font-size: 16px; }
  .sm-title { position: static; font-size: 20px; line-height: 40px; height: 40px; flex: none; }
  .sm-row {
    position: static;
    flex: 1 1 auto;
    min-height: 0;
    gap: 6px;
    align-content: center;
    overflow-y: auto;
    padding: 2px 0;
  }
  .sm-card { padding: 0 8px 8px; animation-duration: .35s; }
  .sm-fig { height: clamp(96px, calc(100cqh - 250px), 170px); margin: 0 -8px; }
  .sm-fig::before { width: 70%; height: 90%; bottom: 4px; }
  .sm-name { font-size: 16px; margin: 2px 0 6px; }
  .sm-ability { display: grid; grid-template-columns: 30px 1fr; column-gap: 7px; row-gap: 4px; align-items: center; }
  .sm-text { display: contents; }
  .sm-icon { width: 30px; height: 30px; padding: 2px; border-width: 1px; }
  .sm-ab-title { font-size: 12px; flex-wrap: wrap; row-gap: 0; line-height: 1.15; }
  .sm-desc { grid-column: 1 / -1; margin: 0; font-size: 12px; line-height: 1.3; -webkit-line-clamp: 2; }
  .sm-actions {
    position: static;
    transform: none;
    flex: none;
    align-self: center;
    width: min(100%, 420px);
    padding: 6px 0 max(8px, env(safe-area-inset-bottom));
  }
  .sm-btn { height: 46px; font-size: 18px; }
  .sm-btn.reroll { width: 52px; font-size: 26px; }
  .sm-btn.start { width: auto; flex: 1; }
  .sm-hint { display: none; }
}
/* phone portrait: 2x2 grid, bigger text */
@container summoner (max-width: 760px) and (min-height: 560px) {
  .sm-content { padding-top: max(10px, env(safe-area-inset-top)); }
  .sm-timer { position: static; align-self: center; width: 46px; height: 46px; }
  .sm-timer span { font-size: 18px; }
  .sm-title { font-size: 24px; line-height: 1.2; height: auto; margin: 4px 0 6px; }
  .sm-row { grid-template-columns: repeat(2, 1fr); gap: 10px 8px; align-content: center; }
  .sm-fig { height: clamp(112px, calc(50cqh - 250px), 175px); }
  .sm-name { font-size: 18px; }
  .sm-ability { grid-template-columns: 34px 1fr; }
  .sm-icon { width: 34px; height: 34px; }
  .sm-ab-title { font-size: 13px; }
  .sm-desc { -webkit-line-clamp: 3; }
  .sm-btn { height: 54px; font-size: 20px; }
  .sm-btn.reroll { width: 58px; }
  .sm-actions { width: 100%; padding-top: 8px; padding-bottom: max(12px, env(safe-area-inset-bottom)); }
}
`;
