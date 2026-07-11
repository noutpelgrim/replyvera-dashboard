import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ activeTab, setActiveTab, locations, selectedLocation, setSelectedLocation }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = user?.email === 'noutpelgrim@hotmail.com';

  const tabs = [
    { id: 'reviews', label: t('reviews'), icon: '💬' },
    ...(isAdmin ? [{ id: 'leads', label: t('prospects'), icon: '🚀' }] : []),
    { id: 'settings', label: t('automation'), icon: '⚙️' },
    { id: 'analytics', label: t('analytics'), icon: '📊' }
  ];

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
            📍 {t('active_location')}
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

      {/* UI Language Switcher */}
      <div style={{ marginTop: 'auto', marginBottom: '16px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🌐 {t('ui_language')}
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: '600',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="en" style={{ background: '#1A1A32', color: 'white' }}>English 🇬🇧</option>
          <option value="nl" style={{ background: '#1A1A32', color: 'white' }}>Nederlands 🇳🇱</option>
          <option value="es" style={{ background: '#1A1A32', color: 'white' }}>Español 🇪🇸</option>
        </select>
      </div>

      <div>
        <div className="glass" style={{ padding: '16px', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', overflow: 'hidden' }}>
          <p>{t('logged_in_as')}</p>
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
