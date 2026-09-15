import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'signup') {
        if (!form.fullName.trim()) throw new Error('Please enter your full name.');
        if (form.password.length < 8) throw new Error('Password must be at least 8 characters.');
        const data = await signUp(form);
        if (!data.session) {
          setMessage('Account created. Check your email to confirm your account, then sign in.');
          setMode('login');
        }
      } else {
        await signIn(form);
      }
    } catch (e) {
      setError(e.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authShell">
      <div className="authGlow" />
      <section className="authCard">
        <div className="brand authBrand">THREESIXTY<span>FX</span><small>TRADE SMART. TRADE THREESIXTY.</small></div>
        <div className="authTabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Sign In</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Create Account</button>
        </div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="authIntro">{mode === 'login' ? 'Sign in to your THREESIXTYFX control center.' : 'Create your THREESIXTYFX account to manage your automation platform.'}</p>
        <form onSubmit={submit} className="authForm">
          {mode === 'signup' && <label>Full Name<input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Your full name" autoComplete="name" /></label>}
          <label>Email<input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label>Password<input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
          {error && <div className="authError">{error}</div>}
          {message && <div className="authSuccess">{message}</div>}
          <button className="gold authSubmit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        <p className="authFoot">Your account will later control your bots, trading accounts, subscriptions and trade history.</p>
      </section>
    </div>
  );
}