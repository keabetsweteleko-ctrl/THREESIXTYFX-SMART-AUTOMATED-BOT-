import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { AuthProvider, useAuth } from './AuthContext';
import AuthScreen from './AuthScreen';
import { supabase } from './lib/supabaseClient';

const bots = [
  {
    name: 'EUR/USD Trend Following',
    pair: 'EUR/USD',
    strategy: 'Trend Following',
    risk: 'Medium',
    lot: '0.10',
    tp: 50,
    sl: 25,
    profit: 842.5,
    win: '68.4%',
    status: 'Paused'
  },
  {
    name: 'GBP Scalper Pro',
    pair: 'GBP/USD',
    strategy: 'Scalping',
    risk: 'High',
    lot: '0.20',
    tp: 15,
    sl: 10,
    profit: 210.75,
    win: '72.1%',
    status: 'Paused'
  },
  {
    name: 'JPY Grid Hunter',
    pair: 'USD/JPY',
    strategy: 'Grid',
    risk: 'Medium',
    lot: '0.05',
    tp: 30,
    sl: 20,
    profit: 126.2,
    win: '64.8%',
    status: 'Stopped'
  }
];

const accounts = [
  {
    broker: 'IC Markets',
    platform: 'MetaTrader 5',
    number: '••••4821',
    server: 'ICMarketsSC-Demo',
    leverage: '1:500',
    equity: '$16,053.25',
    status: 'Connected'
  },
  {
    broker: 'Pepperstone',
    platform: 'MetaTrader 5',
    number: '••••1930',
    server: 'Pepperstone-Demo',
    leverage: '1:500',
    equity: '$8,420.10',
    status: 'Connected'
  }
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

  const [page, setPage] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const reference = new URLSearchParams(window.location.search).get(
    'reference'
  );

  useEffect(() => {
    if (reference) {
      setPage('Payment');
    }
  }, [reference]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }

    let active = true;

    async function loadSubscription() {
      setSubscriptionLoading(true);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(
          'id, plan, status, starts_at, expires_at, license_id'
        )
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error(
          'THREESIXTYFX subscription error:',
          error
        );
        setSubscription(null);
      } else {
        setSubscription(data);
      }

      setSubscriptionLoading(false);
    }

    loadSubscription();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="authLoading">
        <div className="brand">
          THREESIXTY<span>FX</span>
          <small>LOADING CONTROL CENTER...</small>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const navigation = [
    'Dashboard',
    'Trading Bots',
    'Accounts',
    'Trade History',
    'Pricing',
    'Settings',
    'Admin Licenses'
  ];

  function navigate(nextPage) {
    setPage(nextPage);
    setMenuOpen(false);

    if (!reference) {
      window.history.replaceState(
        {},
        '',
        window.location.pathname
      );
    }
  }

  const displayName =
    profile?.full_name ||
    user.email?.split('@')[0] ||
    'Trader';

  let planLabel = 'NO PLAN';

  if (subscription?.plan === 'pro') {
    planLabel = 'PRO';
  }

  if (subscription?.plan === 'lifetime') {
    planLabel = 'LIFETIME';
  }

  return (
    <div className="app">
      <button
        className="mobileMenu"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        ☰
      </button>

      <aside className={menuOpen ? 'open' : ''}>
        <div className="brand">
          THREESIXTY<span>FX</span>
          <small>TRADE SMART. TRADE THREESIXTY.</small>
        </div>

        <div className="sideUser">
          Signed in as
          <br />
          <b>{displayName}</b>

          <div style={{ marginTop: '8px' }}>
            <span className="badge">
              {subscriptionLoading
                ? 'CHECKING PLAN...'
                : planLabel}
            </span>
          </div>
        </div>

        {navigation.map((item) => (
          <button
            key={item}
            className={
              page === item
                ? 'nav active'
                : 'nav'
            }
            onClick={() => navigate(item)}
          >
            {item}
          </button>
        ))}

        <button
          className="nav signout"
          onClick={signOut}
        >
          Sign Out
        </button>
      </aside>

      <main>
        <header>
          <div>
            <h1>{page}</h1>

            <p>
              {page === 'Dashboard'
                ? `Welcome back, ${displayName}`
                : 'THREESIXTYFX control center'}
            </p>
          </div>

          {page !== 'Pricing' &&
            page !== 'Payment' && (
              <button
                className="gold"
                onClick={() =>
                  navigate('Trading Bots')
                }
              >
                Manage Bots
              </button>
            )}
        </header>

        {page === 'Dashboard' && (
          <Dashboard subscription={subscription} />
        )}

        {page === 'Trading Bots' && <Bots />}

        {page === 'Accounts' && <Accounts />}

        {page === 'Trade History' && <Trades />}

        {page === 'Pricing' && (
          <Pricing
            subscription={subscription}
            onSubscriptionUpdated={setSubscription}
          />
        )}

        {page === 'Settings' && <Settings />}

        {page === 'Admin Licenses' && <AdminLicenses />}

        {page === 'Payment' && (
          <Payment reference={reference} />
        )}
      </main>
    </div>
  );
}

function Card({ title, value, sub }) {
  return (
    <div className="card">
      <small>{title}</small>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

function Dashboard({ subscription }) {
  let plan = 'No active plan';

  if (subscription?.plan === 'pro') {
    plan = 'Pro';
  }

  if (subscription?.plan === 'lifetime') {
    plan = 'Lifetime';
  }

  let expiry = '—';

  if (subscription?.plan === 'lifetime') {
    expiry = 'Never';
  } else if (subscription?.expires_at) {
    expiry = new Date(
      subscription.expires_at
    ).toLocaleDateString();
  }

  const active = subscription?.status === 'active';

  return (
    <>
      <section className="grid">
        <Card
          title="Total Equity"
          value="$16,053.25"
          sub="↗ 8.40% this week"
        />

        <Card
          title="Total Profit"
          value="$97.50"
          sub="↗ 12.30% this week"
        />

        <Card
          title="Win Rate"
          value="75.0%"
          sub="Across closed trades"
        />

        <Card
          title="Active Bots"
          value="0/3"
          sub="No bots currently running"
        />
      </section>

      <section className="panel">
        <div className="row">
          <div>
            <div className="eyebrow">
              ACCOUNT ACCESS
            </div>

            <h2>{plan} Plan</h2>

            <p>
              {active
                ? subscription.plan === 'lifetime'
                  ? 'Your THREESIXTYFX Lifetime access is active.'
                  : `Your THREESIXTYFX Pro access is active until ${expiry}.`
                : 'Activate a THREESIXTYFX license to unlock your trading platform access.'}
            </p>
          </div>

          <span className="badge">
            {active
              ? 'ACTIVE'
              : 'NO ACTIVE PLAN'}
          </span>
        </div>
      </section>

      <section className="panel">
        <h2>Performance</h2>

        <p>
          Your performance analytics will appear
          here once live trading data is connected.
        </p>
      </section>
    </>
  );
}

function Bots() {
  return (
    <>
      <div className="toolbar">
        <button
          className="gold"
          onClick={() =>
            alert(
              'Bot creation is the next database-backed feature.'
            )
          }
        >
          + Create Bot
        </button>
      </div>

      <div className="list">
        {bots.map((bot) => (
          <div
            className="panel"
            key={bot.name}
          >
            <div className="row">
              <div>
                <h2>{bot.name}</h2>
                <p>
                  {bot.pair} · {bot.strategy}
                </p>
              </div>

              <span className="badge">
                {bot.status}
              </span>
            </div>

            <div className="stats">
              <span>
                Risk <b>{bot.risk}</b>
              </span>

              <span>
                Lot <b>{bot.lot}</b>
              </span>

              <span>
                TP <b>{bot.tp} pips</b>
              </span>

              <span>
                SL <b>{bot.sl} pips</b>
              </span>

              <span>
                Profit <b>${bot.profit}</b>
              </span>

              <span>
                Win Rate <b>{bot.win}</b>
              </span>
            </div>

            <div className="actions">
              <button>Start</button>
              <button>Stop</button>
              <button className="danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Accounts() {
  return (
    <>
      <div className="toolbar">
        <button
          className="gold"
          onClick={() =>
            alert(
              'Secure MT5 account connection is planned for the trading bridge phase.'
            )
          }
        >
          + Connect Account
        </button>
      </div>

      <div className="list">
        {accounts.map((account) => (
          <div
            className="panel"
            key={account.broker}
          >
            <div className="row">
              <div>
                <h2>{account.broker}</h2>
                <p>
                  {account.platform} ·{' '}
                  {account.status}
                </p>
              </div>

              <span className="badge">
                Connected
              </span>
            </div>

            <div className="stats">
              <span>
                Account <b>{account.number}</b>
              </span>

              <span>
                Server <b>{account.server}</b>
              </span>

              <span>
                Leverage <b>{account.leverage}</b>
              </span>

              <span>
                Equity <b>{account.equity}</b>
              </span>
            </div>

            <button>Remove</button>
          </div>
        ))}
      </div>
    </>
  );
}

function Trades() {
  return (
    <div className="panel tablewrap">
      <div className="tabs">
        <button>All</button>
        <button>Open</button>
        <button>Closed</button>
      </div>

      <table>
        <thead>
          <tr>
            {[
              'Pair',
              'Type',
              'Volume',
              'Open Price',
              'Close Price'
            ].map((heading) => (
              <th key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {trades.map((trade, index) => (
            <tr key={index}>
              {trade.map((value, valueIndex) => (
                <td key={valueIndex}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pricing({
  subscription,
  onSubscriptionUpdated
}) {
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  let activePlan = null;

  if (subscription?.plan === 'pro') {
    activePlan = 'Pro';
  }

  if (subscription?.plan === 'lifetime') {
    activePlan = 'Lifetime';
  }

  let expiry = null;

  if (subscription?.expires_at) {
    expiry = new Date(
      subscription.expires_at
    ).toLocaleDateString();
  }

  async function activateLicense() {
    if (!user) {
      setError(
        'Please sign in before activating a license.'
      );
      return;
    }

    if (!code.trim()) {
      setError(
        'Please enter your activation code.'
      );
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const { data, error: rpcError } =
        await supabase.rpc(
          'activate_license',
          {
            p_code: code.trim()
          }
        );

      if (rpcError) {
        throw rpcError;
      }

      if (data?.plan === 'lifetime') {
        setMessage(
          'Lifetime license activated successfully. Your access has no expiry.'
        );
      } else if (data?.expires_at) {
        const date = new Date(
          data.expires_at
        ).toLocaleDateString();

        setMessage(
          `Pro license activated successfully. Your access is active until ${date}.`
        );
      } else {
        setMessage(
          'Pro license activated successfully.'
        );
      }

      setCode('');

      const {
        data: updatedSubscription,
        error: subscriptionError
      } = await supabase
        .from('subscriptions')
        .select(
          'id, plan, status, starts_at, expires_at, license_id'
        )
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!subscriptionError) {
        onSubscriptionUpdated(
          updatedSubscription
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          'License activation failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="eyebrow">
            THREESIXTYFX ACCESS
          </div>

          <h1>Choose Your Plan</h1>

          <p>
            Activate your THREESIXTYFX access using
            an activation code.
          </p>
        </div>
      </div>

      {activePlan && (
        <div className="panel">
          <div className="row">
            <div>
              <div className="eyebrow">
                CURRENT ACCESS
              </div>

              <h2>
                THREESIXTYFX {activePlan}
              </h2>

              <p>
                {activePlan === 'Lifetime'
                  ? 'Your Lifetime access is active with no expiry.'
                  : `Your Pro access is active until ${expiry}.`}
              </p>
            </div>

            <span className="badge">
              ACTIVE
            </span>
          </div>
        </div>
      )}

      <div className="pricingGrid">
        <div className="card">
          <div className="cardTitle">
            THREESIXTYFX Pro
          </div>

          <div className="price">$49</div>

          <div className="muted">
            per month
          </div>

          <ul className="featureList">
            <li>
              Trading automation platform
            </li>
            <li>Bot management</li>
            <li>
              Trading account management
            </li>
            <li>Trade history</li>
            <li>
              30 days of access per activation
            </li>
          </ul>
        </div>

        <div className="card featuredCard">
          <div className="cardTitle">
            THREESIXTYFX Lifetime
          </div>

          <div className="price">$100</div>

          <div className="muted">
            one-time
          </div>

          <ul className="featureList">
            <li>
              Full THREESIXTYFX platform access
            </li>
            <li>
              Trading automation platform
            </li>
            <li>Bot management</li>
            <li>
              Trading account management
            </li>
            <li>
              No subscription expiry
            </li>
          </ul>
        </div>
      </div>

      <div className="card activationCard">
        <div className="cardTitle">
          Activate Your License
        </div>

        <p className="muted">
          If you have received an activation code
          after purchasing access, enter it below.
        </p>

        <div className="activationForm">
          <input
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            placeholder="Enter your activation code"
            autoComplete="off"
          />

          <button
            className="gold"
            onClick={activateLicense}
            disabled={busy}
          >
            {busy
              ? 'Activating...'
              : 'Activate License'}
          </button>
        </div>

        {error && (
          <div className="authError">
            {error}
          </div>
        )}

        {message && (
          <div className="authSuccess">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

function Payment({ reference }) {
  const [state, setState] = useState({
    loading: true
  });

  useEffect(() => {
    if (!reference) {
      return;
    }

    let active = true;

    fetch(
      `/api/paystack/verify/${encodeURIComponent(
        reference
      )}`
    )
      .then(async (response) => ({
        ok: response.ok,
        data: await response.json()
      }))
      .then(({ ok, data }) => {
        if (active) {
          setState({
            loading: false,
            ok,
            data
          });
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            ok: false,
            error: error.message
          });
        }
      });

    return () => {
      active = false;
    };
  }, [reference]);

  if (state.loading) {
    return (
      <div className="panel center">
        <h2>Checking your payment...</h2>
        <p>
          We are verifying the Paystack transaction
          securely.
        </p>
      </div>
    );
  }

  const success =
    state.ok &&
    state.data?.data?.status === 'success';

  return (
    <div className="panel center">
      <div
        className={
          success
            ? 'successIcon'
            : 'errorIcon'
        }
      >
        {success ? '✓' : '!'}
      </div>

      <h2>
        {success
          ? 'Payment successful'
          : 'Payment not confirmed'}
      </h2>

      <p>
        {success
          ? 'Your transaction has been verified. Account entitlement will be connected in the payment integration phase.'
          : state.error ||
            state.data?.message ||
            'Please contact support if you believe you were charged.'}
      </p>

      <button
        className="gold"
        onClick={() => {
          window.history.replaceState(
            {},
            '',
            window.location.pathname
          );
          window.location.reload();
        }}
      >
        Back to THREESIXTYFX
      </button>
    </div>
  );
}

function AdminLicenses() {
  const { user } = useAuth();

  const [plan, setPlan] = useState('pro');
  const [days, setDays] = useState(30);
  const [license, setLicense] = u