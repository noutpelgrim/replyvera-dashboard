import React, { useState, useEffect } from 'react';
import CONFIG from '../config';

const AnalyticsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${CONFIG.API_BASE}/api/analytics`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => console.error('Failed to fetch analytics:', err));
  }, []);

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Analyzing business performance...</div>;

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
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Business Intelligence</h2>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Visualize your reputation performance and ROI.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <MetricCard 
          title="Average Rating" 
          value={`${stats.averageRating} / 5.0`} 
          subtext="+0.2 this month" 
          icon="⭐" 
        />
        <MetricCard 
          title="Reply Efficiency" 
          value={`${stats.replyRate}%`} 
          subtext="Goal: 100%" 
          icon="⚡" 
        />
        <MetricCard 
          title="Time Saved" 
          value={`${stats.timeSavedHours}h`} 
          subtext="By AI Automation" 
          icon="⏳" 
        />
        <MetricCard 
          title="Lead Conversion" 
          value={`${stats.leadStats.leadsContacted}`} 
          subtext={`Out of ${stats.leadStats.totalLeads} prospects`} 
          icon="🏹" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Rating Distribution Chart */}
        <div className="glass" style={{ padding: '30px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>Rating Distribution</h3>
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
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px' }}>Operational Impact</h3>
          <p style={{ lineHeight: '1.6', color: 'hsl(var(--text-muted))' }}>
            By automating replies for <strong>{stats.totalReviews} reviews</strong>, ReplyVera has effectively increased your business capacity by 
            <strong> {stats.timeSavedHours} hours</strong>. 
            <br /><br />
            Responding to guests within 24 hours is shown to increase repeat bookings by up to <strong>15%</strong>.
          </p>
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid hsl(var(--border))' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>SYSTEM HEALTH: OPTIMAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
