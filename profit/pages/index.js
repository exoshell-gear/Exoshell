import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [data, setData] = useState({
    loading: true,
    error: null,
    whop: null,
    meta: null
  });

  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      const [whopRes, metaRes] = await Promise.all([
        fetch('/profit/api/whop').then(r => r.json()),
        fetch('/profit/api/meta-ads').then(r => r.json())
      ]);

      if (whopRes.error || metaRes.error) {
        throw new Error(whopRes.error || metaRes.error);
      }

      setData({
        loading: false,
        error: null,
        whop: whopRes,
        meta: metaRes
      });
      setLastUpdate(new Date());
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (data.loading && !data.whop) {
    return (
      <div style={{ 
        background: '#0a0a0a', 
        color: '#fff', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        Loading...
      </div>
    );
  }

  if (data.error) {
    return (
      <div style={{ 
        background: '#0a0a0a', 
        color: '#ff0000', 
        minHeight: '100vh', 
        padding: '40px',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <h1>Error</h1>
        <p>{data.error}</p>
        <button onClick={fetchData} style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#D0EB29',
          border: 'none',
          color: '#000',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          Retry
        </button>
      </div>
    );
  }

  const revenueToday = data.whop?.today || 0;
  const spendToday = data.meta?.today || 0;
  const profitToday = revenueToday - spendToday;

  const revenueMonth = data.whop?.month || 0;
  const spendMonth = data.meta?.month || 0;
  const profitMonth = revenueMonth - spendMonth;

  const margin = revenueMonth > 0 ? Math.round((profitMonth / revenueMonth) * 100) : 0;

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <>
      <Head>
        <title>Profit Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #0a0a0a;
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>

      <div style={{ padding: '3rem 2rem', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                PROFIT
              </h1>
              <div style={{ fontSize: '0.75rem', color: '#52525b' }}>LIVE</div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#52525b' }}>
              Last sync: {formatTime(lastUpdate)}
            </div>
          </div>

          <div style={{ marginBottom: '3rem', padding: '1.5rem', background: '#0f0f0f', border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', background: profitToday > 0 ? '#10b981' : '#71717a', borderRadius: '50%' }}></div>
                <div style={{ fontSize: '1.25rem' }}>{profitToday > 0 ? 'Making money' : 'No profit today'}</div>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#71717a' }}>Margin at {margin}%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            
            <div style={{ padding: '1.5rem', background: '#0f0f0f', border: revenueToday > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #27272a' }}>
              <div style={{ fontSize: '0.75rem', color: revenueToday > 0 ? '#10b981' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>REVENUE</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.25rem', color: revenueToday > 0 ? '#10b981' : '#fff' }}>
                ${revenueToday.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#52525b' }}>Today</div>
            </div>

            <div style={{ padding: '1.5rem', background: '#0f0f0f', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>SPEND</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#a1a1aa' }}>
                ${spendToday.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#52525b' }}>Today</div>
            </div>

            <div style={{ padding: '1.5rem', background: '#0f0f0f', border: profitToday > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #27272a' }}>
              <div style={{ fontSize: '0.75rem', color: profitToday > 0 ? '#10b981' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>PROFIT</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.25rem', color: profitToday > 0 ? '#10b981' : '#fff' }}>
                {profitToday > 0 ? '+' : ''}${profitToday.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#52525b' }}>Today</div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>This Month</h2>
              
              <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Revenue</span>
                  <span>${revenueMonth.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Ad Spend</span>
                  <span>${spendMonth.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Profit</span>
                  <span style={{ color: profitMonth > 0 ? '#10b981' : '#fff' }}>
                    {profitMonth > 0 ? '+' : ''}${profitMonth.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent</h2>
              
              {data.whop?.transactions.map((tx, i) => (
                <div key={i} style={{ padding: '1rem', background: '#0f0f0f', border: '1px solid #18181b', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{tx.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#52525b' }}>{tx.detail}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
                      +${tx.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button onClick={fetchData} disabled={data.loading} style={{
              padding: '12px 32px',
              background: data.loading ? '#27272a' : '#D0EB29',
              color: data.loading ? '#71717a' : '#000',
              border: 'none',
              cursor: data.loading ? 'not-allowed' : 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '14px',
              fontWeight: 700
            }}>
              {data.loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
