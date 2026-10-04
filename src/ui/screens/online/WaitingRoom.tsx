// Waiting room: 8 seats (humans + "Bot will fill"), host START, Leave, room chat.
import { useEffect, useRef, useState } from 'react';
import { MAX_SEATS } from '../../../net/protocol.ts';
import { leaveRoom, sendChat, startMatch, useNet } from '../../../net/session.ts';
import { Avatar, LobbyShell } from './Shell.tsx';

export function WaitingRoom() {
  const room = useNet((s) => s.room);
  const you = useNet((s) => s.you);
  const chat = useNet((s) => s.chat);
  const conn = useNet((s) => s.conn);
  const err = useNet((s) => s.error);
  const myId = you?.userId ?? useNet.getState().session?.user.id;
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.length]);

  const max = room?.maxPlayers ?? MAX_SEATS;
  const humans = room?.seats.length ?? 0;
  const isHost = !!room && !!myId && room.hostId === myId;
  const bySeat = new Map((room?.seats ?? []).map((s) => [s.seat, s]));
  const playing = room?.status === 'playing';

  return (
    <LobbyShell testId="waiting-room">
      <div className="ol-head">
        <button className="btn btn-ghost" data-testid="room-leave" onClick={() => leaveRoom('online-rooms')}>
          ← Leave
        </button>
        <h2>{room?.name ?? 'Joining room…'}</h2>
        {room && (
          <code className="ol-note" data-testid="room-code" data-room={room.id}>
            #{room.id}
          </code>
        )}
        <span className="sp" />
      </div>
      {err && <div className="ol-err ol-panel wide">{err}</div>}
      <div className="ol-wait">
        <div className="panel">
          <h3 className="panel-title">
            Seats
            <span className="cap">
              {humans}/{max} humans
            </span>
          </h3>
          <div className="ol-seats">
            {Array.from({ length: max }, (_, i) => {
              const s = bySeat.get(i);
              if (!s)
                return (
                  <div key={i} className="ol-seat empty" data-testid="seat" data-empty="1">
                    <span className="no">{i + 1}</span>
                    <div className="ol-av bot">⚙</div>
                    <div className="sub">Bot will fill</div>
                  </div>
                );
              const me = s.userId === myId;
              return (
                <div key={i} className={`ol-seat human${me ? ' me' : ''}`} data-testid="seat" data-user={s.userId}>
                  <span className="no">{i + 1}</span>
                  {room?.hostId === s.userId && (
                    <span className="crown" title="Host">
                      ♛
                    </span>
                  )}
                  <Avatar name={s.name} url={s.avatarUrl} seed={i} />
                  <div className="nm">
                    {s.name}
                    {me ? ' (you)' : ''}
                  </div>
                  <div className="sub">
                    <span className={`ol-dot ${s.connected ? 'on' : 'off'}`} />
                    {s.connected ? 'connected' : 'away'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ol-summary">
            <div className="txt" data-testid="room-summary">
              Starting with <b>{humans}</b> human{humans === 1 ? '' : 's'} + <b>{max - humans}</b> bot{max - humans === 1 ? '' : 's'}
            </div>
            {playing ? (
              <div className="ol-note">Match starting…</div>
            ) : isHost ? (
              <button className="btn btn-ready big" data-testid="room-start" disabled={humans < 1 || conn !== 'online'} onClick={startMatch}>
                Start
              </button>
            ) : (
              <div className="ol-note">Waiting for the host to start…</div>
            )}
          </div>
        </div>
        <div className="panel ol-chat">
          <h3 className="panel-title">Chat</h3>
          <div className="ol-chat-log" ref={logRef}>
            {chat.length === 0 && <div className="ol-note">Say hi to your opponents.</div>}
            {chat.map((c, i) => (
              <div key={i} className={`ln${c.from.userId === myId ? ' me' : ''}`}>
                <b>{c.from.name}</b>
                {c.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChat(text);
              setText('');
            }}
          >
            <input
              className="ol-input"
              data-testid="chat-input"
              placeholder="Message…"
              maxLength={200}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn" disabled={!text.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </LobbyShell>
  );
}
