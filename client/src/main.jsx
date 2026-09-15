import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { AuthProvider, useAuth } from './AuthContext';
import AuthScreen from './AuthScreen';

const bots = [
  { name: 'EUR/USD Trend Following', pair: 'EUR/USD', strategy: 'Trend Following', risk: 'Medium', lot: '0.10', tp: 50, sl: 25, profit: 842.50, win: '68.4%', status: 'Paused' },
  { name: 'GBP Scalper Pro', pair: 'GBP/USD', strategy: 'Scalping', risk: 'High', lot: '0.20', tp: 15, sl: 10, profit: 210.75, win: '72.1%', status: 'Paused' },
  { name: 'JPY Grid Hunter', pair: 'USD/JPY', strategy: 'Grid', risk: 'Medium', lot: '0.05', tp: 30, sl: 20, profit: 126.20, win: '64.8%', status: 'Stopped' }
];

const accounts = [
  { broker: 'IC Markets', platform: 'MetaTrader 5', number: '••••4821', server: 'ICMarketsSC-Demo', leverage: '1:500', equity: '$16,053.25', status: 'Connected' },
  { broker: 'Pepperstone', platform: 'MetaTrader 5', number: '••••1930', server: 'Pepperstone-Demo', leverage: '1:500', equity: '$8,420.10', status: 'Connected' }
];

const trades = [
  ['GBP/USD', 'SELL', '0.20', '1.2705', '—'],
  ['EUR/USD', 'BUY', '0.10', '1.0850', '—'],
  ['USD/JPY', 'BUY', '0.05', '146.20', '146.05'],
  ['GBP/USD', 'SELL', '0.20', '1.2710', '1.2695'],
  ['EUR/USD', 'BUY', '0.10', '1.0842', '1.0892']
];

function App() {
  const { user, profile, loading, signOut } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference');
  const [page, setPage] = useState(reference ? 'Payment' : 'Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return <div className="authLoading"><div className="brand">THREESIXTY<span>FX</span><small>LOADING CONTROL CENTER…</small></div></div>;
  if (!user) return <AuthScreen />;

  const nav = ['Dashboard', 'Trading Bots', 'Accounts', 'Trade History', 'Pricing', 'Settings'];
  const go = (next) => { setPage(next); setMenuOpen(false); if (!reference) window.history.replaceState({}, '', window.location.pathname); };
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Trader';

  return <div className="app">
    <button className="mobileMenu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
    <aside className={menuOpen ? 'open' : ''}>
      <div className="brand">THREESIXTY<span>FX</span><small>TRADE SMART. TRADE THREESIXTY.</small></div>
      <div className="sideUser">Signed in as<br /><b>{displayName}</b></div>
      {nav.map(n => <button className={page === n ? 'nav active' : 'nav'} onClick={() => go(n)} key={n}>{n}</button>)}
      <button className="nav signout" onClick={() => signOut()}>Sign Out</button>
    </aside>
    <main>
      <header>
        <div><h1>{page}</h1><p>{page === 'Dashboard' ? `Welcome back, ${displayName}` : 'THREESIXTYFX control center'}</p></div>
        {page !== 'Pricing' && page !== 'Payment' && <button className="gold" onClick={() => go('Trading Bots')}>Manage Bots</button>}
      </header>
      {page === 'Dashboard' && <Dashboard />}
      {page === 'Trading Bots' && <Bots />}
      {page === 'Accounts' && <Accounts />}
      {page === 'Trade History' && <Trades />}
      {page === 'Pricing' && <Pricing />}
      {page === 'Settings' && <Settings />}
      {page === 'Payment' && <Payment reference={reference} />}
    </main>
  </div>;
}

function Card({ title, value, sub }) { return <div className="card"><small>{title}</small><strong>{value}</strong><span>{sub}</span></div>; }

function Dashboard() {
  return <><section className="grid"><Card title="Total Equity" value="$16,053.25" sub="↗ 8.40% this week" /><Card title="Total Profit" value="$97.50" sub="↗ 12.30% this week" /><Card title="Win Rate" value="75.0%" sub="Across closed trades" /><Card title="Active Bots" value="0/3" sub="No bots currently running" /></section><section className="panel"><h2>Performance</h2><p>Your performance analytics will appear here once live trading data is connected.</p></section></>;
}

function Bots() {
  return <><div className="toolbar"><button className="gold" onClick={() => alert('Bot creation is the next database-backed feature.')}>+ Create Bot</button></div><div className="list">{bots.map(b => <div className="panel" key={b.name}><div className="row"><div><h2>{b.name}</h2><p>{b.pair} · {b.strategy}</p></div><span className="badge">{b.status}</span></div><div className="stats"><span>Risk <b>{b.risk}</b></span><span>Lot <b>{b.lot}</b></span><span>TP <b>{b.tp} pips</b></span><span>SL <b>{b.sl} pips</b></span><span>Profit <b>${b.profit}</b></span><span>Win Rate <b>{b.win}</b></span></div><div className="actions"><button>Start</button><button>Stop</button><button className="danger">Delete</button></div></div>)}</div></>;
}

function Accounts() {
  return <><div className="toolbar"><button className="gold" onClick={() => alert('Secure MT5 account connection is planned for the trading bridge phase.')}>+ Connect Account</button></div><div className="list">{accounts.map(a => <div className="panel" key={a.broker}><div className="row"><div><h2>{a.broker}</h2><p>{a.platform} · {a.status}</p></div><span className="badge">Connected</span></div><div className="stats"><span>Account <b>{a.number}</b></span><span>Server <b>{a.server}</b></span><span>Leverage <b>{a.leverage}</b></span><span>Equity <b>{a.equity}</b></span></div><button>Remove</button></div>)}</div></>;
}

function Trades() {
  return <div className="panel tablewrap"><div className="tabs"><button>All</button><button>Open</button><button>Closed</button></div><table><thead><tr>{['Pair', 'Type', 'Volume', 'Open Price', 'Close Price'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{trades.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>;
}

function Pricing() {
  const [busy, setBusy] = useState(false);

  const pay = async (plan) => {
    const email = window.prompt('Enter your email for Paystack checkout:');
    if (!email) return;
    setBusy(true);
    try {
      const r = await fetch('/api/paystack/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, plan }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to initialize payment.');
      window.location.href = d.authorization_url;
    } catch (e) {
      alert(e.message);
      setBusy(false);
    }
  };

  return <div className="pricing">
    <div className="price panel"><span className="eyebrow">MONTHLY</span><h2>PRO</h2><strong>R699 <small>/ month</small></strong><p>Full automation, advanced dashboard, alerts and multi-account features.</p><ul><li>Trading bots & strategies</li><li>MetaTrader 5 account management</li><li>Trade history & analytics</li><li>Email/trade alerts</li></ul><button className="gold" disabled={busy} onClick={() => pay('pro')}>{busy ? 'Opening checkout…' : 'Pay with Paystack'}</button></div>

    <div className="price panel"><span className="eyebrow">ONE TIME</span><h2>LIFETIME</h2><strong>R1,999</strong><p>One-time software license for the lifetime tier.</p><ul><li>All Pro features</li><li>Lifetime access</li><li>Priority updates</li><li>No monthly subscription</li></ul><button className="gold" disabled={busy} onClick={() => pay('lifetime')}>{busy ? 'Opening checkout…' : 'Pay with Paystack'}</button></div>

    <div className="notice">Pricing is currently configurable in the server environment. For South African Paystack accounts, checkout is processed in ZAR; we will set the final production prices before launch.</div>
  </div>;
}

function Payment({ reference }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!reference) return;
    fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`)
      .then(async r => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => setState({ loading: false, ok, data }))
      .catch(error => setState({ loading: false, ok: false, error: error.message }));
  }, [reference]);

  if (state.loading) return <div className="panel center"><h2>Checking your payment…</h2><p>We are verifying the Paystack transaction securely.</p></div>;

  const success = state.ok && state.data?.data?.status === 'success';

  return <div className="panel center"><div className={success ? 'successIcon' : 'errorIcon'}>{success ? '✓' : '!'}</div><h2>{success ? 'Payment successful' : 'Payment not confirmed'}</h2><p>{success ? 'Your transaction has been verified. Account entitlement will be connected in the database phase.' : (state.error || state.data?.message || 'Please contact support if you believe you were charged.')}</p><button className="gold" onClick={() => { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); }}>Back to THREESIXTYFX</button></div>;
}

function Settings() {
  return <div className="panel"><h2>Risk Management</h2><div className="form"><label>Default Risk Level<select><option>Medium</option><option>Low</option><option>High</option></select></label><label>Max Daily Loss ($)<input defaultValue="500" /></label><label>Max Open Trades<input defaultValue="5" /></label><label>Trading Hours<select><option>24/5</option><option>Custom</option></select></label></div><button className="gold">Save Settings</button></div>;
}

createRoot(document.getElementById('root')).render(<AuthProvider><App /></AuthProvider>);