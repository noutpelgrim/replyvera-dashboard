import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/dashboard',
      });
      if (resetError) throw resetError;
      alert('Password reset link sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error: authError } = await signIn(email, password);
        if (authError) throw authError;
        navigate('/dashboard');
      } else {
        const { error: registerError } = await signUp(email, password);
        if (registerError) throw registerError;
        alert('Check your email for confirmation.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 0% 0%, rgba(108, 71, 255, 0.05) 0%, transparent 50%), #0A0A14', 
      color: 'white', fontFamily: "'Inter', sans-serif"
    }}>
      <div className="glass card-shadow" style={{
        background: '#1A1A32', padding: '50px 40px', borderRadius: '24px', 
        width: '100%', maxWidth: '420px', border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Logo Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #6C47FF 0%, #00C9A7 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(108, 71, 255, 0.3)',
            marginBottom: '16px'
          }}>
            <i className="fa-solid fa-reply"></i>
          </div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '900', 
            letterSpacing: '-0.03em',
            margin: 0
          }}>
            Reply<span style={{ color: '#8B6FFF' }}>Vera</span>
          </h1>
          <p style={{ marginTop: '8px', color: '#8888AA', fontSize: '0.9rem' }}>
            {isLogin ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', padding: '12px', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', border: '1px solid rgba(255,68,68,0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#8888AA' }}>Email Address</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" required 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0A0A14', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#8888AA' }}>Password</label>
              {isLogin && <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#6C47FF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Forgot password?</button>}
            </div>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0A0A14', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button type="submit" disabled={isLoading} style={{
            width: '100%', padding: '16px', borderRadius: '50px', border: 'none', 
            background: 'linear-gradient(135deg, #6C47FF 0%, #00C9A7 100%)',
            color: 'white', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', 
            boxShadow: '0 8px 20px rgba(108, 71, 255, 0.25)',
            opacity: isLoading ? 0.5 : 1
          }}>
            {isLoading ? 'Wait a second...' : (isLogin ? 'Sign In' : 'Get Started')}
          </button>
        </form>

        <div style={{ margin: '30px 0', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: '#1A1A32', padding: '0 15px', color: '#5A5A7A', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
        </div>

        <button 
          onClick={signInWithGoogle}
          disabled={isLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', 
            background: 'transparent', color: 'white', fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '14px', color: '#8888AA' }}>
          {isLogin ? "Don't have an account yet?" : "Already have an account?"} 
          <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#8B6FFF', fontWeight: '800', cursor: 'pointer', marginLeft: '8px' }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
