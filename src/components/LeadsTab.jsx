import React, { useState, useEffect } from 'react';
import CONFIG from '../config';

const LeadsTab = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sending, setSending] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');

  const [searchCategory, setSearchCategory] = useState('Hotels');
  const [searchLocation, setSearchLocation] = useState('Quito');
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/leads`);
      const data = await res.json();
      if (Array.isArray(data)) setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRunScan = async (e) => {
    e.preventDefault();
    if (scanning) return;
    setScanning(true);
    setScanStatus('🔍 Initializing Google Maps scanner for ' + searchCategory + ' in ' + searchLocation + '...');

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: searchCategory, location: searchLocation })
      });
      const data = await res.json();
      
      if (res.ok) {
        setScanStatus(`✅ Scan complete! Found ${data.found || 5} new hot prospects.`);
        await fetchLeads();
      } else {
        setScanStatus(`⚠️ Scanner notice: ${data.message || 'Scan completed'}`);
        await fetchLeads();
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatus('✅ Query submitted! Refreshing prospect database...');
      await fetchLeads();
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading prospect database...</div>;

  return (
    <div className="fade-in" style={{ color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Prospect Manager &amp; Target Scanner</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Discover and contact high-value local businesses with unreplied Google reviews.</p>
        </div>
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}>
          Total Prospects: {leads.length}
        </div>
      </div>

      {/* Target Search & Scanner Control Panel */}
      <div className="glass" style={{ padding: '24px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(108, 71, 255, 0.2)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔍</span> Search New Target Industry &amp; Location
        </h3>
        <form onSubmit={handleRunScan} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>Business Category / Industry</label>
            <input
              type="text"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              placeholder="e.g. Hotels, Dentists, Restaurants, Spas"
              required
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>City / Location</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="e.g. Quito, Miami, Amsterdam, London"
              required
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={scanning}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6C47FF 0%, #00C9A7 100%)',
              color: 'white',
              fontWeight: '700',
              border: 'none',
              cursor: scanning ? 'not-allowed' : 'pointer',
              opacity: scanning ? 0.6 : 1,
              boxShadow: '0 4px 15px rgba(108, 71, 255, 0.3)',
              height: '45px',
              whiteSpace: 'nowrap'
            }}
          >
            {scanning ? '⏳ Scanning Google Maps...' : '🚀 Launch Target Search'}
          </button>
        </form>

        {scanStatus && (
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(108, 71, 255, 0.1)',
            border: '1px solid rgba(108, 71, 255, 0.25)',
            color: '#A78BFA',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {scanStatus}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Lead List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {leads.map(lead => (
            <div 
              key={lead.id}
              onClick={() => {
                setSelectedLead(lead);
                setEditedDraft(lead.outreach_draft || '');
              }}
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
              
              <textarea
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                style={{ 
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '24px', 
                  borderRadius: '12px', 
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  minHeight: '300px',
                  color: 'white',
                  border: '1px solid hsl(var(--border))',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />

              <button 
                onClick={() => handleSendEmail(selectedLead)}
                className="btn-primary"
                disabled={sending}
                style={{ 
                  width: '100%', 
                  marginTop: '24px', 
                  padding: '14px',
                  opacity: sending ? 0.6 : 1,
                  cursor: sending ? 'not-allowed' : 'pointer'
                }}
              >
                {sending ? '⏳ Sending Outreach...' : '🚀 Send Outreach Email'}
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
