import React, { useState, useEffect } from 'react';
import CONFIG from '../config';

const LeadsTab = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetch(`${CONFIG.API_BASE}/api/leads`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => console.error('Failed to fetch leads:', err));
  }, []);

  const handleSendEmail = (lead) => {
    const subject = encodeURIComponent("Helping with your Google Reviews");
    const body = encodeURIComponent(lead.outreach_draft);
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    
    // Update status locally
    fetch(`${CONFIG.API_BASE}/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SENT' })
    });
    setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'SENT' } : l));
  };

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading prospect database...</div>;

  return (
    <div className="fade-in" style={{ color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Prospect Manager</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Contact high-value local businesses discovered by the scanner.</p>
        </div>
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem' }}>
          Total Prospects: {leads.length}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Lead List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {leads.map(lead => (
            <div 
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`glass-card ${selectedLead?.id === lead.id ? 'active-card' : ''}`}
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderLeft: lead.status === 'SENT' ? '4px solid hsl(var(--success))' : '4px solid hsl(var(--primary))',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{lead.business_name}</h3>
                <span style={{ color: '#FFB800' }}>★ {lead.rating}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>{lead.address}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.8rem' }}>
                <span className="badge">{lead.status}</span>
                <span style={{ color: 'hsl(var(--primary))' }}>{lead.email}</span>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              No leads found. Run the scanner to discover new prospects.
            </div>
          )}
        </div>

        {/* Lead Detail / Email Draft */}
        <div>
          {selectedLead ? (
            <div className="glass fade-in" style={{ padding: '30px', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '6px' }}>Outreach Strategy</h3>
              <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginBottom: '20px' }}>
                Custom email drafted by AI for {selectedLead.business_name}.
              </p>
              
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '24px', 
                borderRadius: '12px', 
                fontSize: '0.95rem',
                lineHeight: '1.6',
                minHeight: '200px',
                whiteSpace: 'pre-wrap',
                border: '1px solid hsl(var(--border))'
              }}>
                {selectedLead.outreach_draft}
              </div>

              <button 
                onClick={() => handleSendEmail(selectedLead)}
                className="btn-primary"
                style={{ width: '100%', marginTop: '24px', padding: '14px' }}
              >
                🚀 Send Outreach Email
              </button>
            </div>
          ) : (
            <div className="glass" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))' }}>
              Select a prospect to view the outreach draft.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .glass-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
        .active-card { background: rgba(108, 71, 255, 0.1) !important; border-color: hsl(var(--primary)) !important; }
        .badge { background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default LeadsTab;
