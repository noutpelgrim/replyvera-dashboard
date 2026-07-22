import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config';

const Sidebar = ({ activeTab, setActiveTab, locations, selectedLocation, setSelectedLocation }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState('starter');
  
  useEffect(() => {
    if (!user?.email) return;
    // Query active user status (which returns their subscription_tier)
    fetch(`${CONFIG.API_BASE}/auth/status/${user.email}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.tier) {
          setTier(data.tier);
        }
      })
      .catch(err => console.error('Failed to fetch user tier:', err));
  }, [user?.email]);

  const isAdmin = user?.email === 'noutpelgrim@hotmail.com';
  const isAgency = tier === 'agency';

  const tabs = [
    { id: 'reviews', label: 'Reviews', icon: '💬' },
    ...((isAdmin || isAgency) ? [{ id: 'leads', label: 'Prospects', icon: '🚀' }] : []),
    { id: 'settings', label: 'Automation', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  // Format the subscription tier names and colors beautifully
  const getTierStyles = (plan) => {
    switch (plan?.toLowerCase()) {
      case 'agency':
        return {
          bg: 'rgba(16, 185, 129, 0.08)', // Green
          border: 'rgba(16, 185, 129, 0.25)',
          color: '#10B981',
          name: 'Agency'
        };
      case 'multi_location':
      case 'multilocation':
        return {
          bg: 'rgba(6, 182, 212, 0.08)', // Cyan
          border: 'rgba(6, 182, 212, 0.25)',
          color: '#06B6D4',
          name: 'Multi-Location'
        };
      case 'autopilot':
        return {
          bg: 'rgba(139, 92, 246, 0.08)', // Purple
          border: 'rgba(139, 92, 246, 0.25)',
          color: '#A78BFA',
          name: 'Vera Autopilot'
        };
      case 'professional':
        return {
          bg: 'rgba(99, 102, 241, 0.08)', // Indigo
          border: 'rgba(99, 102, 241, 0.25)',
          color: '#818CF8',
          name: 'Professional'
        };
      case 'starter':
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.03)', // Grey
          border: 'rgba(255, 255, 255, 0.06)',
          color: '#94A3B8',
          name: plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Starter'
        };
    }
  };

  const currentTier = getTierStyles(tier);

  return (
    <div className="glass card-shadow" style={{
      width: '240px',
      height: 'calc(100vh - 40px)',
      margin: '20px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed'
    }}>
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '34px',
          height: '34px',
          background: 'linear-gradient(135deg, #6C47FF 0%, #00C9A7 100%)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(108, 71, 255, 0.4)'
        }}>
          <i className="fa-solid fa-reply"></i>
        </div>
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontWeight: '800', 
          letterSpacing: '-0.02em',
          color: '#F0F0FF'
        }}>
          Reply<span style={{ color: '#8B6FFF' }}>Vera</span>
        </h2>
      </div>

      {/* Location Selector (Dropdown) */}
      {locations && locations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📍 Active Location
          </label>
          <select
            value={selectedLocation ? selectedLocation.name : ''}
            onChange={(e) => {
              const loc = locations.find(l => l.name === e.target.value);
              if (loc) setSelectedLocation(loc);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {locations.map(loc => (
              <option key={loc.name} value={loc.name} style={{ background: '#1A1A32', color: 'white' }}>
                {loc.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '12px',
              background: activeTab === tab.id ? 'hsl(var(--primary) / 0.1)' : 'transparent',
              color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab.id ? '600' : '400'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div style={{
          margin: '0 0 12px 0',
          padding: '10px 14px',
          borderRadius: '12px',
          background: currentTier.bg,
          border: `1px solid ${currentTier.border}`,
          color: currentTier.color,
          fontSize: '0.78rem',
          fontWeight: '700',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          💎 {currentTier.name} Plan
        </div>
        <div className="glass" style={{ padding: '16px', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', overflow: 'hidden' }}>
          <p>Logged in as</p>
          <p style={{ 
            color: 'white', 
            fontWeight: '600', 
            marginTop: '4px', 
            textOverflow: 'ellipsis', 
            overflow: 'hidden', 
            whiteSpace: 'nowrap' 
          }}>
            {user?.email || 'Guest User'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
