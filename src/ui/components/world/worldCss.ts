// Scoped styles for <World/> (banners + floating battle controls). Injected once by World.
export const WORLD_CSS = `
.aw-world{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;background:#0b0c10;user-select:none;-webkit-user-select:none;font-family:system-ui,'Segoe UI',sans-serif;color:#e8ecf3;touch-action:manipulation;container-type:inline-size;container-name:awworld}
.aw-world-stage{position:absolute;inset:0;will-change:transform}
.aw-world-ground{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.aw-world-svg{position:absolute;inset:0;width:100%;height:100%;display:block}
/* dynamic layers get their own compositor layers so moving units never repaint the terrain */
.aw-world-live,.aw-world-amb{will-change:transform;contain:strict}
.aw-world-amb{pointer-events:none}
.aw-world-svg .aw-hero-hit{cursor:grab;touch-action:none}
/* SVG children ignore touch-action in Chrome: the whole svg opts out of panning while heroes are draggable */
.aw-world.prep .aw-world-svg{touch-action:none}
.aw-world.dragging .aw-world-svg,.aw-world.dragging .aw-hero-hit{cursor:grabbing}
.aw-flicker{transform-box:fill-box;transform-origin:50% 100%;animation:aw-flicker .35s ease-in-out infinite alternate}
@keyframes aw-flicker{from{transform:scale(1,1)}to{transform:scale(.88,1.12)}}
.aw-wb{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;text-align:center;padding:0 16px}
.aw-wb-intro{padding:12px 16px;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(4,6,12,.62) 22%,rgba(4,6,12,.62) 78%,rgba(0,0,0,0));animation:aw-wb-life var(--life,1.6s) ease-out both}
.aw-wb-round{font-weight:900;font-size:clamp(18px,4.4cqw,44px);letter-spacing:.06em;color:#ffe6a6;text-shadow:0 3px 0 rgba(0,0,0,.65),0 0 24px rgba(255,200,90,.45);animation:aw-wb-drop .45s cubic-bezier(.2,1.4,.4,1) both}
.aw-wb-sub{font-weight:700;font-size:clamp(12px,1.8cqw,18px);color:#bfe4ff;background:rgba(6,8,14,.66);border:1px solid rgba(140,200,255,.25);padding:4px 14px;border-radius:999px;animation:aw-wb-drop .45s .12s cubic-bezier(.2,1.4,.4,1) both}
.aw-wb-sub.invade{color:#ffc2b8;border-color:rgba(255,120,100,.35)}
.aw-wb-result{top:0;bottom:0;transform:none;justify-content:center;background:radial-gradient(ellipse at center,rgba(0,0,0,.5),rgba(0,0,0,0) 62%);animation:aw-wb-life 1.55s ease-out both}
.aw-wb-big{font-weight:900;font-size:clamp(38px,11cqw,104px);letter-spacing:.08em;animation:aw-wb-slam .55s cubic-bezier(.2,1.6,.4,1) both;text-shadow:0 4px 0 rgba(0,0,0,.6),0 0 30px currentColor}
.aw-wb-win .aw-wb-big{color:#ffd54a}
.aw-wb-loss .aw-wb-big{color:#ff4a4a}
.aw-wb-draw .aw-wb-big{color:#c9ced8}
@keyframes aw-wb-slam{0%{transform:scale(2.6);opacity:0;filter:blur(6px)}60%{opacity:1;filter:blur(0)}100%{transform:scale(1)}}
@keyframes aw-wb-drop{0%{transform:translateY(-14px) scale(1.15);opacity:0}100%{transform:none;opacity:1}}
@keyframes aw-wb-life{0%{opacity:0}8%{opacity:1}82%{opacity:1}100%{opacity:0}}
.aw-wctl{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;gap:4px;align-items:center;background:rgba(8,9,13,.74);border:1px solid rgba(255,255,255,.1);padding:4px;border-radius:10px;backdrop-filter:blur(3px)}
.aw-wctl-time{font:700 12px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#aab3c2;padding:0 6px;min-width:34px;text-align:center}
.aw-wbtn{appearance:none;border:1px solid rgba(255,255,255,.12);background:#1b1e27;color:#cfd6e3;font:600 12px/1 system-ui,sans-serif;padding:6px 9px;border-radius:6px;cursor:pointer;min-width:32px}
.aw-wbtn:hover{background:#262a36;color:#fff}
.aw-wbtn.on{background:#2f4f8a;border-color:#5b8cff;color:#fff}
.aw-wbtn.skip{background:#3a2a14;border-color:#a8782a;color:#ffd99a}
.aw-wbtn.skip:hover{background:#4d3718}
@container awworld (max-width: 599px){
.aw-wctl{top:auto;bottom:6px;right:4px;left:auto;transform:none;flex-direction:column;gap:3px;padding:3px;border-radius:9px}
.aw-wctl-time{display:none}
.aw-wbtn{min-width:36px;min-height:36px;padding:0 6px;font-size:11px;border-radius:7px}
.aw-wb-sub{padding:3px 10px}
}
@media (prefers-reduced-motion: reduce){.aw-wb-big,.aw-wb-round,.aw-wb-sub,.aw-flicker{animation:none}}
`;
