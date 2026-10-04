// Shared backdrop + scroll container for the lobby screens, plus small bits (avatar, connection badge).
import type { ReactNode } from 'react';
import { SummonerBackdrop } from '../../../art/lords/index.ts';
import { SERVER } from '../../../net/config.ts';
import { pingLevel } from '../../../net/predict.ts';
import { useNet } from '../../../net/session.ts';
import { ONLINE_CSS } from './online.css.ts';

export function LobbyShell({ children, center, testId }: { children: ReactNode; center?: boolean; testId?: string }) {
  return (
    <div className="ol-screen" data-testid={testId}>
      <style>{ONLINE_CSS}</style>
      <div className="sb-layer">
        <SummonerBackdrop />
      </div>
      <div className="ol-dim" />
      <div className={`ol-scroll${center ? ' ol-center' : ''}`}>{children}</div>
    </div>
  );
}

const AV_COLORS = ['#ffcf5a', '#5fd068', '#4da3ff', '#e5484d', '#c58bff', '#ff9f43', '#2ed1c4', '#f78fb3'];

export function Avatar({ name, url, seed }: { name: string; url?: string | null; seed: number }) {
  if (url)
    return (
      <div className="ol-av">
        <img src={url} alt="" referrerPolicy="no-referrer" />
      </div>
    );
  return (
    <div className="ol-av" style={{ background: AV_COLORS[seed % AV_COLORS.length] }}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </div>
  );
}

const LABEL = { idle: 'offline', connecting: 'connecting', online: 'online', reconnecting: 'reconnecting', offline: 'offline' } as const;

export function ConnBadge({ inGame = false }: { inGame?: boolean }) {
  const conn = useNet((s) => s.conn);
  const ping = useNet((s) => s.ping);
  const showPing = conn === 'online' && ping !== null;
  const host = SERVER.replace(/^https?:\/\//, '');
  return (
    <div
      className={`conn-badge${inGame ? ' game' : ''}`}
      data-testid="conn-status"
      data-status={conn === 'idle' ? 'offline' : conn}
      data-ping={showPing ? pingLevel(ping) : undefined}
      title={`Server: ${host}${showPing ? ` · round trip ${ping} ms` : ''}`}
    >
      <style>{ONLINE_CSS}</style>
      <span className="ol-dot" />
      {showPing ? <span className="ms" data-testid="ping">{ping} ms</span> : LABEL[conn]}
    </div>
  );
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** the server speaks a newer protocol: this tab runs an old build */
export function UpdateOverlay() {
  const fatal = useNet((s) => s.fatal);
  if (fatal !== 'version') return null;
  return (
    <div className="ol-fatal" data-testid="update-required" role="alertdialog" aria-labelledby="ol-upd">
      <style>{ONLINE_CSS}</style>
      <div className="panel">
        <h3 id="ol-upd">Game updated</h3>
        <p>A new version of Atomic War is live. Reload to keep playing online.</p>
        <button className="btn btn-ready" onClick={() => location.reload()}>
          Reload
        </button>
        <button className="btn btn-ghost" onClick={() => useNet.setState({ fatal: null })}>
          Not now
        </button>
      </div>
    </div>
  );
}
