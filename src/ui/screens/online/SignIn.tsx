// Sign in: guest name (one click), or email login / sign up. Remembers the session (localStorage).
import { useState, type FormEvent } from 'react';
import { SERVER } from '../../../net/config.ts';
import { googleLoginUrl, signIn, signInGuest, signOut, signUp, useNet } from '../../../net/session.ts';
import { useMode } from '../../mode.ts';
import { LobbyShell, errText } from './Shell.tsx';

type Tab = 'guest' | 'login' | 'signup';

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function SignIn() {
  const session = useNet((s) => s.session);
  const netErr = useNet((s) => s.error);
  const [tab, setTab] = useState<Tab>('guest');
  const [name, setName] = useState(() => session?.user.name ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const setMode = useMode((s) => s.setMode);

  const run = async (e: FormEvent, fn: () => Promise<void>) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await fn();
      useNet.setState({ error: null });
      setMode('online-rooms');
    } catch (x) {
      setErr(errText(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <LobbyShell center testId="sign-in">
      <h1 className="ol-logo" style={{ fontSize: 'clamp(34px, 6vw, 56px)' }}>
        Atomic War
      </h1>
      <div className="panel ol-panel">
        <h3 className="panel-title">
          Play Online<span className="hint">{SERVER.replace(/^https?:\/\//, '')}</span>
        </h3>
        {session && (
          <div className="ol-row-actions" style={{ marginBottom: 12 }}>
            <span className="ol-user">
              Signed in as <b>{session.user.name ?? session.user.email}</b>
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn" onClick={() => setMode('online-rooms')}>
              Continue
            </button>
            <button className="btn btn-ghost" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        )}
        <button
          type="button"
          className="ol-google"
          data-testid="google-login"
          onClick={() => {
            location.href = googleLoginUrl();
          }}
        >
          <GoogleG />
          Continue with Google
        </button>
        <div className="ol-or">
          <span>or</span>
        </div>
        <div className="ol-tabs" role="tablist">
          {(['guest', 'login', 'signup'] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`btn btn-ghost${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
              {k === 'guest' ? 'Guest' : k === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>
        {tab === 'guest' && (
          <form className="ol-form" onSubmit={(e) => run(e, () => signInGuest(name))}>
            <label>
              Your name
              <input
                className="ol-input"
                data-testid="guest-name"
                value={name}
                maxLength={24}
                autoFocus
                placeholder="e.g. Sonny"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="btn btn-ready" data-testid="guest-go" disabled={busy || !name.trim()}>
              {busy ? 'Joining…' : 'Play as guest'}
            </button>
          </form>
        )}
        {tab !== 'guest' && (
          <form
            className="ol-form"
            onSubmit={(e) => run(e, () => (tab === 'login' ? signIn(email, password) : signUp(email, password, name)))}
          >
            {tab === 'signup' && (
              <label>
                Display name
                <input className="ol-input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label>
              Email
              <input className="ol-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input
                className="ol-input"
                type="password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="btn btn-ready" disabled={busy || !email || !password || (tab === 'signup' && !name.trim())}>
              {busy ? '…' : tab === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        )}
        {(err ?? netErr) && (
          <div className="ol-err" style={{ marginTop: 10 }}>
            {err ?? netErr}
          </div>
        )}
      </div>
      <button className="btn btn-ghost" onClick={() => setMode('title')}>
        ← Back
      </button>
    </LobbyShell>
  );
}
