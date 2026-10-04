// Styles for the Title / Sign-in / Rooms / Waiting-room screens (same Dota-ish palette as the game HUD).
export const ONLINE_CSS = `
.ol-screen { position: absolute; inset: 0; overflow: hidden; background: #0d0814; color: var(--text); }
.ol-screen .sb-layer { position: absolute; inset: 0; pointer-events: none; }
.ol-screen .sb-layer svg { width: 100%; height: 100%; display: block; }
.ol-screen .ol-dim { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 40%, rgba(10,6,16,.35), rgba(10,6,16,.82) 75%); }
.ol-scroll { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column;
  align-items: center; padding: 28px 16px 40px; gap: 18px; user-select: text; -webkit-user-select: text; }
.ol-center { justify-content: center; }
.ol-logo { font-family: var(--font-head); font-weight: 900; text-align: center; line-height: .92; letter-spacing: .06em;
  font-size: clamp(44px, 9vw, 96px); text-transform: uppercase;
  background: linear-gradient(180deg, #fff3c4 0%, var(--gold) 38%, var(--gold-deep) 62%, #7a4f12 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 4px 0 rgba(0,0,0,.55)) drop-shadow(0 0 28px rgba(255,190,80,.25)); }
.ol-logo small { display: block; font-size: .34em; letter-spacing: .5em; margin-top: 10px; padding-left: .5em; }
.ol-tag { font-family: var(--font-head); color: var(--text-dim); letter-spacing: .22em; text-transform: uppercase; font-size: 12px; text-align: center; }
.ol-hero-row { display: flex; align-items: flex-end; justify-content: center; gap: clamp(8px, 4vw, 48px); }
.ol-fig { width: clamp(90px, 16vw, 170px); aspect-ratio: 110 / 106; }
.ol-fig svg { width: 100%; height: 100%; overflow: visible; }
.ol-menu { display: flex; flex-direction: column; gap: 12px; width: min(340px, 100%); }
.ol-menu .btn { justify-content: center; width: 100%; }
.btn-gold { height: 50px; font-family: var(--font-head); font-size: 18px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase;
  color: #2a1a02; border: 1px solid #ffe39a; background: linear-gradient(180deg, #ffd977, #c98d1d); box-shadow: 0 0 16px rgba(255,207,90,.3); }
.btn-gold:hover:not(:disabled) { background: linear-gradient(180deg, #ffe39a, #d99c28); border-color: #fff0c4; }
.ol-panel { width: min(560px, 100%); }
.ol-panel.wide { width: min(980px, 100%); }
.ol-head { display: flex; align-items: center; gap: 10px; width: min(980px, 100%); flex-wrap: wrap; }
.ol-head h2 { font-family: var(--font-head); color: var(--bronze-hi); letter-spacing: .1em; text-transform: uppercase; font-size: 22px; }
.ol-head .sp { flex: 1; }
.ol-user { display: inline-flex; align-items: center; gap: 8px; color: var(--text-dim); font-weight: 600; }
.ol-user b { color: var(--text); }
.ol-google { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 42px; border-radius: 6px;
  background: #fff; color: #1f1f1f; border: 1px solid #dadce0; font: 600 14px 'Roboto', var(--font-body); cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: background .12s, box-shadow .12s; }
.ol-google:hover { background: #f7f8f8; box-shadow: 0 1px 3px rgba(0,0,0,.4); }
.ol-google:active { background: #eceef0; }
.ol-or { display: flex; align-items: center; gap: 10px; margin: 12px 0; color: var(--text-faint); font-size: 11px; font-weight: 700;
  letter-spacing: .14em; text-transform: uppercase; }
.ol-or::before, .ol-or::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.ol-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.ol-tabs .btn { flex: 1; justify-content: center; }
.ol-form { display: flex; flex-direction: column; gap: 10px; }
.ol-form label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-dim); }
.ol-input { height: 38px; border-radius: 6px; border: 1px solid var(--line); background: #0e1118; color: var(--text); padding: 0 12px;
  font: 500 14px var(--font-body); outline: none; user-select: text; -webkit-user-select: text; min-width: 0; }
.ol-input:focus { border-color: var(--bronze-hi); box-shadow: 0 0 0 2px rgba(201,164,92,.18); }
.ol-err { color: #ffb4b6; background: rgba(229,72,77,.12); border: 1px solid rgba(229,72,77,.35); border-radius: 6px; padding: 7px 10px; font-weight: 600; }
.ol-note { color: var(--text-faint); font-size: 12px; }
.ol-row-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ol-rooms { display: flex; flex-direction: column; gap: 6px; }
.ol-room { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1.3fr) 70px 86px 92px; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 6px; background: rgba(255,255,255,.025); border: 1px solid var(--line); }
.ol-room.mine { border-color: var(--bronze-hi); }
.ol-room .nm { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ol-room .nm code { color: var(--text-faint); font-weight: 600; margin-left: 6px; font-size: 11px; }
.ol-room .host { color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ol-room .seats { font-variant-numeric: tabular-nums; font-weight: 700; }
.ol-room .btn { justify-content: center; }
.ol-room-head { color: var(--text-faint); font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; background: none; border: 0; padding: 0 10px; }
.ol-pill { display: inline-block; white-space: nowrap; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; text-align: center; }
.ol-pill.lobby { background: rgba(95,208,104,.14); color: var(--radiant); }
.ol-pill.playing { background: rgba(255,207,90,.14); color: var(--gold); }
.ol-pill.finished { background: rgba(255,255,255,.06); color: var(--text-faint); }
.ol-empty { color: var(--text-faint); text-align: center; padding: 26px 0; }
.ol-create { display: flex; gap: 8px; margin-top: 12px; }
.ol-create .ol-input { flex: 1; }
.ol-wait { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; width: min(980px, 100%); }
.ol-seats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.ol-seat { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 8px 12px; border-radius: 8px;
  border: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)); min-height: 128px; justify-content: center; }
.ol-seat.human { border-color: rgba(201,164,92,.55); }
.ol-seat.me { box-shadow: 0 0 0 1px var(--gold) inset, 0 0 18px rgba(255,207,90,.15); }
.ol-seat.empty { border-style: dashed; color: var(--text-faint); }
.ol-seat .no { position: absolute; top: 6px; left: 8px; font-size: 10px; font-weight: 700; color: var(--text-faint); }
.ol-seat .crown { position: absolute; top: 4px; right: 8px; color: var(--gold); font-size: 14px; }
.ol-seat .nm { font-weight: 700; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ol-seat .sub { font-size: 11px; color: var(--text-faint); display: inline-flex; align-items: center; gap: 5px; }
.ol-av { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; flex: none;
  font: 900 22px var(--font-head); color: #1a1206; border: 2px solid rgba(0,0,0,.35); }
.ol-av img { width: 100%; height: 100%; object-fit: cover; }
.ol-av.bot { background: #1b2029; color: var(--text-faint); border: 2px dashed var(--line); font-size: 18px; }
.ol-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-faint); display: inline-block; }
.ol-dot.on { background: var(--radiant); box-shadow: 0 0 6px var(--radiant); }
.ol-dot.off { background: var(--dire); }
.ol-summary { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
.ol-summary .txt { flex: 1; color: var(--text-dim); font-weight: 600; min-width: 200px; }
.ol-summary .txt b { color: var(--text); }
.ol-chat { display: flex; flex-direction: column; min-height: 320px; max-height: 460px; }
.ol-chat-log { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding: 4px 2px; min-height: 120px; }
.ol-chat-log .ln { line-height: 1.35; word-break: break-word; }
.ol-chat-log .ln b { color: var(--bronze-hi); margin-right: 6px; }
.ol-chat-log .ln.me b { color: var(--gold); }
.ol-chat form { display: flex; gap: 6px; margin-top: 8px; }
.ol-chat form .ol-input { flex: 1; }
.conn-badge { position: fixed; z-index: 60; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
  border-radius: 99px; background: rgba(10,12,18,.82); border: 1px solid var(--line); font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--text-dim); pointer-events: none; }
.conn-badge[data-status='online'] .ol-dot { background: var(--radiant); box-shadow: 0 0 6px var(--radiant); }
.conn-badge[data-status='connecting'] .ol-dot, .conn-badge[data-status='reconnecting'] .ol-dot { background: var(--gold); animation: ol-blink 1s infinite; }
.conn-badge[data-status='offline'] .ol-dot { background: var(--dire); }
.conn-badge.game { right: auto; left: 50%; transform: translateX(-50%); bottom: 4px; padding: 2px 9px; font-size: 10px; opacity: .85; }
.conn-badge .ms { font-variant-numeric: tabular-nums; }
.conn-badge[data-ping='good'] .ms { color: var(--radiant); }
.conn-badge[data-ping='ok'] .ms { color: var(--gold); }
.conn-badge[data-ping='bad'] .ms { color: var(--dire); }
.conn-badge[data-status='online'][data-ping='ok'] .ol-dot { background: var(--gold); box-shadow: 0 0 6px var(--gold); }
.conn-badge[data-status='online'][data-ping='bad'] .ol-dot { background: var(--dire); box-shadow: 0 0 6px var(--dire); }
.conn-badge { pointer-events: auto; cursor: default; }
.hp-row.watchable { cursor: pointer; position: relative; }
.hp-row.watchable:hover { background: rgba(255,207,90,.08); opacity: 1; }
.hp-row.watched { box-shadow: 0 0 0 1px var(--gold) inset; background: rgba(255,207,90,.1); opacity: 1; }
.hp-row .hp-watch { position: absolute; right: 6px; top: 3px; font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
  color: var(--gold); opacity: 0; transition: opacity .12s; pointer-events: none; }
.hp-row.watchable:hover .hp-watch, .hp-row.watched .hp-watch { opacity: 1; }
.spec-bar { position: absolute; left: 50%; top: 84px; transform: translateX(-50%); z-index: 31; display: flex; align-items: center; gap: 10px;
  padding: 5px 6px 5px 16px; border-radius: 99px; background: rgba(10,12,18,.88); border: 1px solid var(--gold-deep);
  font: 700 13px var(--font-head); letter-spacing: .08em; color: var(--gold); white-space: nowrap; }
.spec-bar.hint { padding: 7px 16px; color: var(--text-dim); border-color: var(--line); font-family: var(--font-body); letter-spacing: 0; }
.spec-bar .btn { height: 26px; font-size: 12px; }
.mplay .spec-bar { position: fixed; top: calc(58px + env(safe-area-inset-top)); max-width: calc(100vw - 24px); }
.ol-banner.low { top: 128px; }
.mplay .ol-banner.low { top: calc(100px + env(safe-area-inset-top)); }
.ol-fatal { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; background: rgba(5,6,10,.78); padding: 16px; }
.ol-fatal .panel { width: min(380px, 100%); text-align: center; display: flex; flex-direction: column; gap: 12px; align-items: center; padding: 22px; }
.ol-fatal h3 { font-family: var(--font-head); color: var(--gold); letter-spacing: .08em; font-size: 20px; }
.ol-fatal p { margin: 0; color: var(--text-dim); }
@keyframes ol-blink { 50% { opacity: .25; } }
.ol-banner { position: absolute; left: 50%; top: 92px; transform: translateX(-50%); z-index: 30; padding: 8px 18px; border-radius: 99px;
  background: rgba(10,12,18,.85); border: 1px solid var(--bronze); color: var(--bronze-hi); font: 700 13px var(--font-head);
  letter-spacing: .1em; text-transform: uppercase; pointer-events: none; white-space: nowrap; }
.mplay .ol-banner { position: fixed; top: calc(60px + env(safe-area-inset-top)); }
.sm-waiting { position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); z-index: 5; padding: 10px 22px; border-radius: 99px;
  background: rgba(10,6,16,.8); border: 1px solid rgba(255,255,255,.2); font: 700 15px var(--font-head); letter-spacing: .1em; color: #f4efe6; }
@media (max-width: 760px) {
  .ol-scroll { padding: 18px 12px 32px; gap: 14px; }
  .ol-wait { grid-template-columns: minmax(0, 1fr); }
  .ol-seats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ol-room { grid-template-columns: minmax(0, 1fr) 54px 80px; grid-template-areas: 'nm seats btn' 'host st btn'; row-gap: 4px; }
  .ol-room .nm { grid-area: nm; } .ol-room .host { grid-area: host; font-size: 12px; } .ol-room .seats { grid-area: seats; }
  .ol-room .st { grid-area: st; } .ol-room .btn { grid-area: btn; }
  .ol-room-head { display: none; }
  .ol-chat { min-height: 240px; }
  .ol-create { flex-direction: column; }
  .ol-seat { min-height: 0; padding: 10px 6px 8px; gap: 5px; }
  .ol-seat .ol-av { width: 40px; height: 40px; font-size: 17px; }
  .ol-seat.empty { flex-direction: row; gap: 8px; }
  .ol-seat.empty .ol-av { width: 26px; height: 26px; font-size: 12px; }
  .ol-summary .btn { width: 100%; justify-content: center; }
}
@media (max-width: 560px) {
  .ol-hero-row { flex-direction: column; align-items: center; }
  .ol-hero-row .ol-fig { display: none; }
}
`;
