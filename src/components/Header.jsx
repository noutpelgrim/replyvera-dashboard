import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Header = ({ autoReply, setAutoReply }) => {
  const { signOut, user } = useAuth();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 0',
      marginBottom: '32px'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-1px' }}>
          Welcome back, {user?.email?.split('@')[0] || 'Vera'}
        </h1>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Manage your review automation and AI responses.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="glass" style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            Auto-Reply {autoReply ? 'Active' : 'Paused'}
          </span>
          <button
            onClick={() => setAutoReply(!autoReply)}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              background: autoReply ? 'hsl(var(--success))' : 'hsl(var(--border))',
              position: 'relative',
              padding: '2px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'white',
              transform: autoReply ? 'translateX(24px)' : 'translateX(0)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </button>
        </div>

        <button 
          onClick={signOut}
          title="Sign Out"
          style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.2)',
            color: '#ff4444',
            padding: '12px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;
