import React, { useState, useEffect } from 'react';
import CONFIG from '../config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AnalyticsTab = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${CONFIG.API_BASE}/api/analytics?email=${user.email}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch analytics:', err);
        setLoading(false);
      });
  }, [user?.email]);

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Analyzing business performance...</div>;
  if (!stats || stats.error) return <div style={{ color: '#ff4d4d', padding: '20px' }}>Failed to load analytics: {stats?.error || 'Unknown error'}</div>;

  const MetricCard = ({ title, value, subtext, icon }) => (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div style={{ fontSize: '2rem', width: '60px', height: '60px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>{title}</p>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: '1.2' }}>{value}</h3>
        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--success))', marginTop: '2px' }}>{subtext}</p>
      </div>
    </div>
  );

  const maxDist = Math.max(...Object.values(stats.distribution));

  return (
    <div className="fade-in" style={{ color: 'white' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{t('business_intelligence')}</h2>
        <p style={{ color: 'hsl(var(--text-muted))' }}>{t('visualize_rep')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <MetricCard 
          title={t('avg_rating')} 
          value={`${stats.averageRating} / 5.0`} 
          subtext="+0.2 this month" 
          icon="⭐" 
        />
        <MetricCard 
          title={t('reply_efficiency')} 
          value={`${stats.replyRate}%`} 
          subtext="Goal: 100%" 
          icon="⚡" 
        />
        <MetricCard 
          title={t('time_saved')} 
          value={`${stats.timeSavedHours}h`} 
          subtext="By AI Automation" 
          icon="⏳" 
        />
        <MetricCard 
          title={t('lead_conversion')} 
          value={`${stats.leadStats.leadsContacted}`} 
          subtext={`Out of ${stats.leadStats.totalLeads} prospects`} 
          icon="🏹" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Rating Distribution Chart */}
        <div className="glass" style={{ padding: '30px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>{t('rating_dist')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '20px', fontSize: '0.85rem', fontWeight: '700' }}>{star}★</span>
                <div style={{ 
                  flex: 1, 
                  height: '8px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(stats.distribution[star] / (maxDist || 1)) * 100}%`, 
                    height: '100%', 
                    background: star >= 4 ? 'hsl(var(--success))' : star === 3 ? 'hsl(var(--warning))' : 'hsl(var(--danger))',
                    borderRadius: '4px',
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
                <span style={{ width: '30px', textAlign: 'right', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  {stats.distribution[star]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Message */}
        <div className="glass" style={{ 
          padding: '30px', 
          borderRadius: '20px', 
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px' }}>{t('operational_impact')}</h3>
          <p style={{ lineHeight: '1.6', color: 'hsl(var(--text-muted))' }}>
            {t('operational_desc', { count: stats.totalReviews, hours: stats.timeSavedHours })}
          </p>
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid hsl(var(--border))' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>{t('system_health')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
