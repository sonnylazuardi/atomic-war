// Shared backdrop + scroll container for the lobby screens, plus small bits (avatar, connection badge).
import type { ReactNode } from 'react';
import { SummonerBackdrop } from '../../../art/lords/index.ts';
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
  return (
    <div className={`conn-badge${inGame ? ' game' : ''}`} data-testid="conn-status" data-status={conn === 'idle' ? 'offline' : conn}>
      <style>{ONLINE_CSS}</style>
      <span className="ol-dot" />
      {LABEL[conn]}
    </div>
  );
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
