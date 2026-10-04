// Room browser: public rooms (name, host, seats, status), refresh, create, join / rejoin.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../net/api.ts';
import type { RoomInfo } from '../../../net/protocol.ts';
import { backToTitle, createRoom, joinRoom, signOut, useNet } from '../../../net/session.ts';
import { LobbyShell, errText } from './Shell.tsx';

export function Rooms() {
  const session = useNet((s) => s.session);
  const netErr = useNet((s) => s.error);
  const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const myId = session?.user.id;

  const refresh = useCallback(async () => {
    try {
      const r = await api.rooms();
      setRooms(r.rooms);
      setErr(null);
    } catch (e) {
      setErr(errText(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const h = setInterval(() => void refresh(), 5000);
    return () => clearInterval(h);
  }, [refresh]);

  const create = async () => {
    setBusy(true);
    try {
      useNet.setState({ error: null });
      await createRoom(name.trim() || undefined);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...(rooms ?? [])].sort((a, b) => {
    const order = { lobby: 0, playing: 1, finished: 2 } as const;
    return order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <LobbyShell testId="rooms">
      <div className="ol-head">
        <button className="btn btn-ghost" onClick={backToTitle}>
          ← Title
        </button>
        <h2>Rooms</h2>
        <span className="sp" />
        {session && (
          <span className="ol-user">
            <b>{session.user.name ?? session.user.email}</b>
            {session.user.guest ? ' · guest' : ''}
          </span>
        )}
        <button className="btn btn-ghost" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
      <div className="panel ol-panel wide">
        <h3 className="panel-title">
          Public rooms
          <span className="cap">{rooms ? `${rooms.length} open` : 'loading…'}</span>
          <button className="btn btn-ghost" data-testid="room-refresh" onClick={() => void refresh()}>
            Refresh
          </button>
        </h3>
        {(err ?? netErr) && <div className="ol-err" style={{ marginBottom: 10 }}>{err ?? netErr}</div>}
        <div className="ol-rooms">
          {sorted.length > 0 && (
            <div className="ol-room ol-room-head">
              <span>Room</span>
              <span>Host</span>
              <span>Seats</span>
              <span>Status</span>
              <span />
            </div>
          )}
          {sorted.map((r) => {
            const host = r.seats.find((s) => s.userId === r.hostId)?.name ?? '—';
            const mine = !!myId && r.seats.some((s) => s.userId === myId);
            const full = r.seats.length >= r.maxPlayers;
            const canJoin = mine ? r.status !== 'finished' : r.status === 'lobby' && !full;
            return (
              <div key={r.id} className={`ol-room${mine ? ' mine' : ''}`} data-testid="room-row" data-room={r.id}>
                <span className="nm">
                  {r.name}
                  <code>{r.id}</code>
                </span>
                <span className="host">{host}</span>
                <span className="seats">
                  {r.seats.length}/{r.maxPlayers}
                </span>
                <span className="st">
                  <span className={`ol-pill ${r.status}`}>{r.status === 'playing' ? `round ${r.round}` : r.status}</span>
                </span>
                <button className="btn" data-testid="room-join" disabled={!canJoin} onClick={() => joinRoom(r.id, r)}>
                  {mine ? 'Rejoin' : full ? 'Full' : 'Join'}
                </button>
              </div>
            );
          })}
          {rooms && rooms.length === 0 && <div className="ol-empty">No rooms yet. Create one and invite friends!</div>}
        </div>
        <form
          className="ol-create"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <input className="ol-input" placeholder="Room name (optional)" maxLength={32} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-ready" data-testid="room-create" disabled={busy}>
            Create room
          </button>
        </form>
      </div>
    </LobbyShell>
  );
}
