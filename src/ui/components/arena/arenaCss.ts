// Scoped styles for the arena HUD overlay (injected once by <Arena/>).
export const ARENA_CSS = `
.aw-arena{position:relative;width:100%;height:100%;aspect-ratio:5/3;min-height:0;overflow:hidden;background:#0b0c10;border-radius:10px;user-select:none;font-family:system-ui,'Segoe UI',sans-serif;color:#e8ecf3}
.aw-arena-svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.aw-flicker{transform-box:fill-box;transform-origin:50% 100%;animation:aw-flicker .35s ease-in-out infinite alternate}
@keyframes aw-flicker{from{transform:scale(1,1)}to{transform:scale(.88,1.12)}}
.aw-hud-top{position:absolute;top:8px;left:10px;right:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;pointer-events:none}
.aw-hud-side{display:flex;align-items:center;gap:7px;background:rgba(8,9,13,.72);border:1px solid rgba(255,255,255,.08);padding:4px 10px;border-radius:8px;font-size:13px;min-width:0}
.aw-hud-right{flex-direction:row-reverse}
.aw-hud-dot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px currentColor}
.aw-hud-name{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:22vw}
.aw-hud-you{font-weight:500;color:#ffd76a}
.aw-hud-alive{font-variant-numeric:tabular-nums;color:#aab3c2;font-size:12px;white-space:nowrap}
.aw-hud-timer{background:rgba(8,9,13,.72);border:1px solid rgba(255,255,255,.08);padding:3px 12px;border-radius:8px;font-weight:700;font-variant-numeric:tabular-nums;font-size:15px;letter-spacing:.04em}
.aw-hud-controls{position:absolute;right:10px;bottom:10px;display:flex;gap:4px;background:rgba(8,9,13,.72);border:1px solid rgba(255,255,255,.08);padding:4px;border-radius:9px}
.aw-btn{appearance:none;border:1px solid rgba(255,255,255,.12);background:#1b1e27;color:#cfd6e3;font:600 12px/1 system-ui,sans-serif;padding:6px 9px;border-radius:6px;cursor:pointer;min-width:32px}
.aw-btn:hover{background:#262a36;color:#fff}
.aw-btn.on{background:#2f4f8a;border-color:#5b8cff;color:#fff}
.aw-skip{background:#3a2a14;border-color:#a8782a;color:#ffd99a}
.aw-skip:hover{background:#4d3718}
.aw-banner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,.55),rgba(0,0,0,0) 65%);animation:aw-fade .3s ease-out both}
.aw-banner-text{font-weight:900;font-size:clamp(36px,11vw,104px);letter-spacing:.08em;animation:aw-slam .55s cubic-bezier(.2,1.6,.4,1) both;text-shadow:0 4px 0 rgba(0,0,0,.6),0 0 30px currentColor}
.aw-banner-win .aw-banner-text{color:#ffd54a}
.aw-banner-loss .aw-banner-text{color:#ff4a4a}
.aw-banner-draw .aw-banner-text{color:#c9ced8}
@keyframes aw-slam{0%{transform:scale(2.6);opacity:0;filter:blur(6px)}60%{opacity:1;filter:blur(0)}100%{transform:scale(1)}}
@keyframes aw-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion: reduce){.aw-banner-text,.aw-flicker{animation:none}}
`;
