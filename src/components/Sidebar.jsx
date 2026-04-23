import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const tabs = [
    { id: 'reviews', label: 'Reviews', icon: '💬' },
    { id: 'leads', label: 'Prospects', icon: '🚀' },
    { id: 'settings', label: 'Automation', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
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
