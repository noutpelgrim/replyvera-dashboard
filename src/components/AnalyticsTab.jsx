import React, { useState, useEffect } from 'react';
import CONFIG from '../config';
import { useAuth } from '../context/AuthContext';

const AnalyticsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);

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

  // --- SVG Chart Calculations ---
  const history = stats.history || [];
  const maxValue = Math.max(...history.map(d => d.total), 5); // Ensure scale goes up to at least 5
  
  const chartWidth = 800;
  const chartHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const widthArea = chartWidth - paddingLeft - paddingRight;
  const heightArea = chartHeight - paddingTop - paddingBottom;
  const stepX = widthArea / Math.max(history.length - 1, 1);

  const pointsTotal = history.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = chartHeight - paddingBottom - (d.total / maxValue) * heightArea;
    return { x, y, date: d.date, val: d.total };
  });

  const pointsReplies = history.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = chartHeight - paddingBottom - (d.replies / maxValue) * heightArea;
    return { x, y, date: d.date, val: d.replies };
  });

  // Generate path coordinates
  const totalLine = pointsTotal.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const repliesLine = pointsReplies.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Generate closed areas for gradient backgrounds
  const totalArea = totalLine ? `${totalLine} L ${pointsTotal[pointsTotal.length - 1].x} ${chartHeight - paddingBottom} L ${pointsTotal[0].x} ${chartHeight - paddingBottom} Z` : '';
  const repliesArea = repliesLine ? `${repliesLine} L ${pointsReplies[pointsReplies.length - 1].x} ${chartHeight - paddingBottom} L ${pointsReplies[0].x} ${chartHeight - paddingBottom} Z` : '';

  // Filter X axis labels to avoid crowding (every 6 days)
  const xLabels = history.filter((_, i) => i % 6 === 0 || i === history.length - 1);

  // Y axis ticks (0, half, max)
  const yTicks = [0, Math.round(maxValue / 2), maxValue];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fade-in" style={{ color: 'white' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Business Intelligence</h2>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Visualize your reputation performance and ROI.</p>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <MetricCard 
          title="Average Rating" 
          value={`${stats.averageRating} / 5.0`} 
          subtext="Overall score" 
          icon="⭐" 
        />
        <MetricCard 
          title="Reply Efficiency" 
          value={`${stats.replyRate}%`} 
          subtext="Auto-reply rate" 
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

      {/* 30-Day Activity Line Chart */}
      <div className="glass" style={{ padding: '30px', borderRadius: '20px', marginBottom: '40px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Review Activity (Last 30 Days)</h3>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Track daily customer reviews and AI automated replies.</p>
          </div>
          {/* Chart Legend */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#00C9A7' }}></span>
              <span style={{ color: 'hsl(var(--text-muted))', fontWeight: '600' }}>Total Reviews</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8B6FFF' }}></span>
              <span style={{ color: 'hsl(var(--text-muted))', fontWeight: '600' }}>AI Replies Posted</span>
            </div>
          </div>
        </div>

        {/* SVG Container */}
        <div style={{ width: '100%', height: `${chartHeight}px`, position: 'relative' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
            <defs>
              {/* Gradients */}
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00C9A7" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="repliesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B6FFF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8B6FFF" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y Labels */}
            {yTicks.map((tick, index) => {
              const y = chartHeight - paddingBottom - (tick / maxValue) * heightArea;
              return (
                <g key={index}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth - paddingRight} 
                    y2={y} 
                    stroke="rgba(255,255,255,0.06)" 
                    strokeWidth="1" 
                    strokeDasharray={tick === 0 ? "0" : "5,5"}
                  />
                  <text 
                    x={paddingLeft - 10} 
                    y={y + 4} 
                    fill="hsl(var(--text-muted))" 
                    fontSize="0.75rem" 
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Glowing area charts */}
            <path d={totalArea} fill="url(#totalGrad)" />
            <path d={repliesArea} fill="url(#repliesGrad)" />

            {/* Smooth glowing lines */}
            <path d={totalLine} fill="none" stroke="#00C9A7" strokeWidth="3" strokeLinecap="round" />
            <path d={repliesLine} fill="none" stroke="#8B6FFF" strokeWidth="3" strokeLinecap="round" />

            {/* Interactive hover band grid lines */}
            {hoverIndex !== null && pointsTotal[hoverIndex] && (
              <line 
                x1={pointsTotal[hoverIndex].x} 
                y1={paddingTop} 
                x2={pointsTotal[hoverIndex].x} 
                y2={chartHeight - paddingBottom} 
                stroke="hsl(var(--primary))" 
                strokeWidth="1" 
                strokeDasharray="4,4"
              />
            )}

            {/* Data point indicators */}
            {hoverIndex !== null && pointsTotal[hoverIndex] && (
              <g>
                <circle cx={pointsTotal[hoverIndex].x} cy={pointsTotal[hoverIndex].y} r="6" fill="#00C9A7" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <circle cx={pointsReplies[hoverIndex].x} cy={pointsReplies[hoverIndex].y} r="6" fill="#8B6FFF" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              </g>
            )}

            {/* X Labels */}
            {xLabels.map((d, index) => {
              const idx = history.findIndex(x => x.date === d.date);
              const x = paddingLeft + idx * stepX;
              return (
                <text 
                  key={index} 
                  x={x} 
                  y={chartHeight - 12} 
                  fill="hsl(var(--text-muted))" 
                  fontSize="0.7rem" 
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {formatDate(d.date)}
                </text>
              );
            })}

            {/* Invisible vertical hover bands to trigger tooltips */}
            {history.map((_, index) => {
              const x = paddingLeft + index * stepX;
              const w = stepX;
              return (
                <rect
                  key={index}
                  x={x - w / 2}
                  y={paddingTop}
                  width={w}
                  height={heightArea}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoverIndex !== null && history[hoverIndex] && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '-15px',
              left: `${(paddingLeft + hoverIndex * stepX) / chartWidth * 100}%`,
              transform: 'translateX(-50%)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--primary) / 0.3)',
              background: 'rgba(10,10,20,0.95)',
              zIndex: 10,
              pointerEvents: 'none',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '150px'
            }}>
              <div style={{ fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', marginBottom: '2px' }}>
                {formatDate(history[hoverIndex].date)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'hsl(var(--text-muted))' }}>Reviews:</span>
                <span style={{ fontWeight: '700', color: '#00C9A7' }}>{history[hoverIndex].total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'hsl(var(--text-muted))' }}>AI Replies:</span>
                <span style={{ fontWeight: '700', color: '#8B6FFF' }}>{history[hoverIndex].replies}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Rating Distribution & Operational Impact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
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
