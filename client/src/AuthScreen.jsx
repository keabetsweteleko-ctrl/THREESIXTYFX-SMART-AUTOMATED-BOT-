import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'signup') {
        await signUp({ email, password, fullName });
        alert('Account created. Check your email if confirmation is required.');
        setMode('login');
      } else {
        await signIn({ email, password });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="brand">
          THREESIXTY<span>FX</span>
          <small>TRADE SMART. TRADE THREESIXTY.</small>
        </div>

        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>

        <p className="authIntro">
          {mode === 'login'
            ? 'Sign in to access your THREESIXTYFX control center.'
            : 'Create your THREESIXTYFX account to get started.'}
        </p>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Full Name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>

          {error && <div className="errorBox">{error}</div>}

          <button className="gold authButton" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <div className="authSwitch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}