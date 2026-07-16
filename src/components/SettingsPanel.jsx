import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config';

const SettingsPanel = ({ settings, setSettings, onSave }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [facebookRequested, setFacebookRequested] = useState(false);
  const [trustpilotRequested, setTrustpilotRequested] = useState(false);
  const [tier, setTier] = useState('starter');
  const [checking, setChecking] = useState(true);
  const [notification, setNotification] = useState(null);
  
  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [previewReview, setPreviewReview] = useState('Super nice stay! Friendly staff and great atmosphere.');
  const [previewRating, setPreviewRating] = useState(5);
  const [previewResult, setPreviewResult] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const handleGeneratePreview = async () => {
    setLoadingPreview(true);
    setPreviewResult('');
    try {
      const businessName = locations.length > 0 ? locations[0].title : 'The Mudhouse Hostel';
      const response = await fetch(`${CONFIG.API_BASE}/api/settings/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: previewReview,
          rating: previewRating,
          tone: settings.tone,
          instructions: settings.instructions,
          businessName: businessName
        })
      });
      const data = await response.json();
      if (data.preview) {
        setPreviewResult(data.preview);
      } else {
        setPreviewResult(data.error || 'Failed to generate preview.');
      }
    } catch (err) {
      console.error(err);
      setPreviewResult('Failed to reach the server.');
    } finally {
      setLoadingPreview(false);
    }
  };
  
  const tones = ['Friendly', 'Professional', 'Premium'];

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

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${CONFIG.API_BASE}/auth/status/${user.email}`);
        const data = await response.json();
        setIsConnected(data.googleConnected);
        setFacebookRequested(data.facebookRequested);
        setTrustpilotRequested(data.trustpilotRequested);
        if (data && data.tier) setTier(data.tier);
        
        if (data.googleConnected) {
          // Fetch enrolled data from OUR database on mount (it's fast and has no quota)
          const enrolledRes = await fetch(`${CONFIG.API_BASE}/google/enrolled?email=${user.email}`);
          const enrolledData = await enrolledRes.json();
          if (enrolledData.length > 0) {
            setLocations(enrolledData);
          } else {
            // Fetch from Google if nothing enrolled yet
            fetchGoogleData();
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

  const handleRequestPlatform = async (platform) => {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/auth/request-platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, platform })
      });
      const data = await res.json();
      if (data.success) {
        if (platform === 'facebook') setFacebookRequested(true);
        if (platform === 'trustpilot') setTrustpilotRequested(true);
        triggerNotification(`We'll notify you as soon as the ${platform === 'facebook' ? 'Facebook' : 'Trustpilot'} integration goes live!`);
      }
    } catch (err) {
      console.error('Failed to request platform:', err);
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
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Reply Language</label>
            <select
              value={settings.language || 'auto'}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="auto" style={{ background: '#1A1A32', color: 'white' }}>Auto-Detect (Reply in customer's language)</option>
              <option value="en" style={{ background: '#1A1A32', color: 'white' }}>Always English</option>
              <option value="nl" style={{ background: '#1A1A32', color: 'white' }}>Always Dutch (Nederlands)</option>
              <option value="es" style={{ background: '#1A1A32', color: 'white' }}>Always Spanish (Español)</option>
              <option value="de" style={{ background: '#1A1A32', color: 'white' }}>Always German (Deutsch)</option>
              <option value="fr" style={{ background: '#1A1A32', color: 'white' }}>Always French (Français)</option>
              <option value="it" style={{ background: '#1A1A32', color: 'white' }}>Always Italian (Italiano)</option>
              <option value="pt" style={{ background: '#1A1A32', color: 'white' }}>Always Portuguese (Português)</option>
              <option value="zh" style={{ background: '#1A1A32', color: 'white' }}>Always Mandarin Chinese (中文)</option>
            </select>
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

          {/* AI Preview Section */}
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> Live AI Reply Preview
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                Test how Vera replies using your current tone and instructions.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Sample Review</label>
                <textarea
                  value={previewReview}
                  onChange={(e) => setPreviewReview(e.target.value)}
                  placeholder="Type a sample customer review here..."
                  style={{ width: '100%', minHeight: '60px', padding: '10px', fontSize: '0.85rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'white' }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Star Rating</label>
                <select
                  value={previewRating}
                  onChange={(e) => setPreviewRating(parseInt(e.target.value))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer',
                    height: '42px'
                  }}
                >
                  <option value="5" style={{ background: '#1A1A32', color: 'white' }}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value="4" style={{ background: '#1A1A32', color: 'white' }}>⭐⭐⭐⭐ (4)</option>
                  <option value="3" style={{ background: '#1A1A32', color: 'white' }}>⭐⭐⭐ (3)</option>
                  <option value="2" style={{ background: '#1A1A32', color: 'white' }}>⭐⭐ (2)</option>
                  <option value="1" style={{ background: '#1A1A32', color: 'white' }}>⭐ (1)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGeneratePreview}
              disabled={loadingPreview || !previewReview.trim()}
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '600',
                opacity: (loadingPreview || !previewReview.trim()) ? 0.5 : 1,
                cursor: 'pointer'
              }}
            >
              {loadingPreview ? 'Generating draft...' : 'Test AI Response'}
            </button>

            {previewResult && (
              <div style={{
                padding: '16px',
                background: 'rgba(108, 71, 255, 0.05)',
                border: '1px solid rgba(108, 71, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                color: '#E0E0FF'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'hsl(var(--primary))', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Vera's Draft Response
                </div>
                "{previewResult}"
              </div>
            )}
          </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              
              <div style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                fontSize: '0.8rem',
                color: 'hsl(var(--text-muted))',
                lineHeight: '1.4'
              }}>
                <div style={{ fontWeight: '700', color: 'white', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span> Waarom vraagt Google om beheer- en verwijderrechten?
                </div>
                Google bundelt alle review- en profielrechten in één standaardpakket genaamd <i>'Business Profile Management'</i>. ReplyVera gebruikt dit <b>uitsluitend</b> om je reviews in te laden en antwoorden te kunnen plaatsen. Wij zullen nooit wijzigingen aanbrengen in je bedrijfsinformatie of je listings verwijderen.
              </div>
            </div>
          )}
        </div>

        {/* Facebook Platform Gated Card */}
        <div className="glass-card" style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', background: '#1877F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontWeight: '700' }}>Facebook Page</h3>
                {tier === 'starter' && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818CF8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>
                    🔒 Pro/Agency
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: facebookRequested ? '#00C9A7' : '#FFB800' }}>
                {facebookRequested ? '✓ Interest registered' : '● Coming soon'}
              </p>
            </div>
          </div>
          <button 
            disabled={tier === 'starter' || facebookRequested}
            onClick={facebookRequested ? null : () => handleRequestPlatform('facebook')}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '12px', 
              background: tier === 'starter' ? 'rgba(255,255,255,0.03)' : facebookRequested ? 'rgba(255,255,255,0.05)' : '#1877F2', 
              color: tier === 'starter' ? 'rgba(255,255,255,0.3)' : facebookRequested ? 'rgba(255,255,255,0.5)' : 'white',
              border: (tier === 'starter' || facebookRequested) ? '1px solid rgba(255,255,255,0.1)' : 'none',
              fontWeight: '600',
              cursor: tier === 'starter' ? 'not-allowed' : facebookRequested ? 'default' : 'pointer',
              outline: 'none'
            }}
          >
            {tier === 'starter' ? 'Upgrade to unlock' : facebookRequested ? 'Interest Registered ✓' : 'Notify me when available'}
          </button>
        </div>

        {/* Trustpilot Platform Gated Card */}
        <div className="glass-card" style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', background: '#00B67A', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>⭐</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontWeight: '700' }}>Trustpilot</h3>
                {tier === 'starter' && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818CF8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>
                    🔒 Pro/Agency
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: trustpilotRequested ? '#00C9A7' : '#FFB800' }}>
                {trustpilotRequested ? '✓ Interest registered' : '● Coming soon'}
              </p>
            </div>
          </div>
          <button 
            disabled={tier === 'starter' || trustpilotRequested}
            onClick={trustpilotRequested ? null : () => handleRequestPlatform('trustpilot')}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '12px', 
              background: tier === 'starter' ? 'rgba(255,255,255,0.03)' : trustpilotRequested ? 'rgba(255,255,255,0.05)' : '#00B67A', 
              color: tier === 'starter' ? 'rgba(255,255,255,0.3)' : trustpilotRequested ? 'rgba(255,255,255,0.5)' : 'white',
              border: (tier === 'starter' || trustpilotRequested) ? '1px solid rgba(255,255,255,0.1)' : 'none',
              fontWeight: '600',
              cursor: tier === 'starter' ? 'not-allowed' : trustpilotRequested ? 'default' : 'pointer',
              outline: 'none'
            }}
          >
            {tier === 'starter' ? 'Upgrade to unlock' : trustpilotRequested ? 'Interest Registered ✓' : 'Notify me when available'}
          </button>
        </div>
      </div>
      {/* Custom Glassmorphic Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: 'rgba(30, 30, 46, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px 24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: 'white',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          maxWidth: '380px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0, 201, 167, 0.15)',
            border: '1px solid rgba(0, 201, 167, 0.3)',
            color: '#00C9A7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'white' }}>Request Registered</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px', lineHeight: '1.4' }}>{notification}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
