import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config';

const SettingsPanel = ({ settings, setSettings, onSave }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);
  
  const tones = ['Friendly', 'Professional', 'Premium'];

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${CONFIG.API_BASE}/auth/status/${user.email}`);
        const data = await response.json();
        setIsConnected(data.connected);
        
        if (data.connected) {
          // Only fetch enrolled data from OUR database on mount (it's fast and has no quota)
          const enrolledRes = await fetch(`${CONFIG.API_BASE}/google/enrolled?email=${user.email}`);
          const enrolledData = await enrolledRes.json();
          if (enrolledData.length > 0) {
            setLocations(enrolledData);
          }
        }
      } catch (err) {
        console.error('Failed to check Google connection status');
      } finally {
        setChecking(false);
      }
    };

    if (user?.email) checkConnection();
  }, [user?.email]);

  const fetchGoogleData = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      // 1. Fetch Accounts from Google
      const accRes = await fetch(`${CONFIG.API_BASE}/google/accounts?email=${user.email}`);
      const accData = await accRes.json();
      
      if (accData.error) {
        if (accRes.status === 429) {
          setError('Google rate limit reached. Please wait 10-15 minutes.');
        } else {
          setError(accData.error);
        }
        return;
      }
      
      setAccounts(accData);

      if (accData.length > 0) {
        const locRes = await fetch(`${CONFIG.API_BASE}/google/locations/${accData[0].name.split('/')[1]}?email=${user.email}`);
        const locData = await locRes.json();
        if (!locData.error) setLocations(locData);
      }
    } catch (err) {
      console.error('Error fetching Google Business data:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `${CONFIG.API_BASE}/auth/google?email=${user.email}`;
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google account?')) return;
    try {
      const response = await fetch(`${CONFIG.API_BASE}/auth/disconnect/${user.email}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setIsConnected(false);
        setAccounts([]);
        setLocations([]);
      }
    } catch (err) {
      console.error('Failed to disconnect Google account:', err);
    }
  };

  const handleSync = async () => {
    if (locations.length === 0) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      // Just send the request - the backend is now smart enough to resolve missing IDs
      const response = await fetch(`${CONFIG.API_BASE}/google/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          locationId: locations[0].name.split('/').pop(),
          // Pass accountId only if we have it locally, otherwise backend handles it
          accountId: locations[0].accountId || (accounts.length > 0 ? accounts[0].name : null)
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setSyncResult(`Successfully synced ${data.count} reviews! Refreshing...`);
        // Trigger a refresh of the dashboard reviews
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncResult(`Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSyncResult('Failed to reach the server. Check your connection.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fade-in" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Automation Settings */}
      <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', height: 'fit-content' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>Automation Settings</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Customize how Vera interacts with your customers.</p>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Brand Tone</label>
            <div style={{ display: 'flex', gap: '8px', background: 'hsl(var(--bg-dark))', padding: '4px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
              {tones.map(tone => (
                <button
                  key={tone}
                  onClick={() => setSettings({ ...settings, tone })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: settings.tone === tone ? 'hsl(var(--primary))' : 'transparent',
                    color: settings.tone === tone ? 'white' : 'hsl(var(--text-muted))',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Minimum Rating to Auto-Reply</label>
            <input
              type="number"
              min="1"
              max="5"
              value={settings.minRating}
              onChange={(e) => setSettings({ ...settings, minRating: parseInt(e.target.value) })}
              style={{ width: '80px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Custom Instructions</label>
            <textarea
              placeholder="e.g. Never mention discounts, always invite them back for Friday live music..."
              value={settings.instructions}
              onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
              style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <button 
            onClick={() => onSave(settings)}
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '12px',
              background: 'hsl(var(--primary))',
              color: 'white',
              fontWeight: '700',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
            }}
          >
            Save Automation Settings
          </button>
        </div>
      </div>

      {/* Connected Services */}
      <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', height: 'fit-content' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>Connected Services</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Link your business profiles to enable live review management.</p>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', background: '#4285F4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontWeight: '700' }}>Google Business Profile</h3>
              <p style={{ fontSize: '0.85rem', color: isConnected ? '#00C9A7' : 'hsl(var(--text-muted))' }}>
                {checking ? 'Checking status...' : isConnected ? '● Connected' : 'Not connected'}
              </p>
            </div>
          </div>

          {isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {locations.length > 0 ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Managing Location</label>
                  <div style={{ fontWeight: '600' }}>{locations[0].title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{locations[0].name}</div>
                </div>
              ) : (
                <div style={{ padding: '20px', background: error ? 'rgba(255,68,68,0.05)' : 'rgba(255,165,0,0.05)', border: error ? '1px solid rgba(255,68,68,0.2)' : '1px solid rgba(255,165,0,0.2)', borderRadius: '16px', fontSize: '0.85rem' }}>
                  <div style={{ color: error ? '#ff4d4d' : '#FFA500', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {error ? '❌ API Error' : '⚠️ No locations found'}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                    {error || (
                      <>
                        Vera couldn't find any verified profiles. Please ensure:
                        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                          <li>Your business is verified on Google</li>
                          <li>You are the Owner or Manager</li>
                          <li>Google API quotas aren't exceeded (retry in 10 mins)</li>
                        </ul>
                      </>
                    )}
                  </p>
                </div>
              )}

              <button 
                onClick={handleSync}
                disabled={syncing || locations.length === 0}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: 'hsl(var(--primary))', 
                  color: 'white',
                  fontWeight: '600',
                  opacity: (syncing || locations.length === 0) ? 0.5 : 1
                }}
              >
                {syncing ? 'Syncing Reviews...' : 'Sync Reviews Now'}
              </button>

              {syncResult && (
                <div style={{ fontSize: '0.85rem', textAlign: 'center', color: syncResult.includes('Successfully') ? '#00C9A7' : '#ff4d4d' }}>
                  {syncResult}
                </div>
              )}

              <button 
                className="btn-secondary" 
                onClick={handleDisconnect}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'rgba(255,255,255,0.6)', 
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Disconnect Account
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnect}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: '#4285F4',
                color: 'white',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Connect with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
