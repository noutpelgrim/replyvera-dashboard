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
  const [ratingFilter, setRatingFilter] = useState('all');
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);

  const getStandardDraft = (lead) => {
    if (!lead) return '';
    const name = lead.business_name || lead.Name || 'your business';
    const rating = lead.rating || lead.Rating || '4.8';
    return `Subject: A quick idea for ${name}

Hi ${name} Team,

I came across ${name} on Google today and noticed your excellent ${rating}★ rating—congratulations!

I also noticed that several customer reviews haven't received a response yet. That's completely understandable when you're busy, but consistently replying to reviews helps build trust with future customers and keeps your Google Business Profile active and engaging.

That's exactly why I created ReplyVera.

ReplyVera uses AI to generate natural, personalized replies to your Google reviews in under 3 seconds. Positive reviews can be published automatically, while negative or sensitive reviews are held for your approval—so you always stay in complete control.

With ReplyVera, you can:
✅ Reply to every Google review, 24/7
✅ Save 5–10 hours every week
✅ Build trust with future customers
✅ Keep your Google Business Profile active with consistent engagement
✅ Strengthen your local online presence over time
✅ Maintain your unique brand voice
✅ Stay fully compliant with Google Business Profile guidelines

I'd love to offer ${name} a 14-day free trial, completely free and with no obligation, so you can see how it works with your own Google reviews.

Would you be open to giving it a try?

Best regards,

Nout
Founder | ReplyVera
📧 nout@replyvera.com
🌐 www.replyvera.com`;
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/leads`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const standardized = data.map(l => ({
          ...l,
          outreach_draft: getStandardDraft(l)
        }));
        setLeads(standardized);
        if (standardized.length > 0) {
          setSelectedLead(standardized[0]);
          setEditedDraft(standardized[0].outreach_draft);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  
  
  const handleDeleteSingleLead = async (leadId, e) => {
    if (e) e.stopPropagation();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    if (!window.confirm(`Are you sure you want to delete ${lead.business_name}?`)) return;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        if (selectedLead?.id === leadId) {
          const remaining = leads.filter(l => l.id !== leadId);
          setSelectedLead(remaining.length > 0 ? remaining[0] : null);
        }
        setScanStatus(`🗑️ Deleted ${lead.business_name} from prospect database.`);
      } else {
        alert('Failed to delete lead.');
      }
    } catch (err) {
      console.error('Failed deleting lead:', err);
      alert('Error connecting to backend server.');
    }
  };

  const handleSendAllLeads = async () => {
    const unsent = leads.filter(l => l.status === 'NEW' && l.email && l.email.includes('@') && !l.email.includes('leaflet@'));
    if (unsent.length === 0) {
      alert('No new valid prospects to email.');
      return;
    }

    if (!window.confirm(`Are you sure you want to send outreach emails to all ${unsent.length} unsent prospects now?`)) return;

    setSending(true);
    let successCount = 0;

    for (const lead of unsent) {
      try {
        const res = await fetch(`${CONFIG.API_BASE}/api/leads/${lead.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft: lead.outreach_draft })
        });
        if (res.ok) {
          successCount++;
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'SENT' } : l));
        }
      } catch (err) {
        console.error(`Failed sending to ${lead.business_name}:`, err);
      }
    }

    setSending(false);
    setScanStatus(`✉️ Outreach complete! Successfully dispatched ${successCount} outreach emails.`);
    fetchLeads();
  };

  const handleSendEmail = async (lead) => {
    if (!lead || sending) return;
    setSending(true);

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: editedDraft })
      });
      const data = await res.json();

      if (res.ok) {
        setScanStatus(`✉️ Outreach email successfully sent to ${lead.business_name} (${lead.email})!`);
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'SENT', outreach_draft: editedDraft } : l));
        setSelectedLead(prev => ({ ...prev, status: 'SENT', outreach_draft: editedDraft }));
      } else {
        alert(data.error || 'Failed to send email.');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Network error trying to send outreach email.');
    } finally {
      setSending(false);
    }
  };

  const handleRunScan = async (e) => {
    e.preventDefault();
    if (scanning) return;
    setScanning(true);
    setScanStatus(`🔍 Scanning Google Maps for ${searchCategory} in ${searchLocation} (${ratingFilter === 'low' ? 'Low Rated < 4★' : ratingFilter === 'high' ? 'High Rated 4+★' : 'All Ratings'})...`);

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/leads/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: searchCategory, location: searchLocation, ratingFilter, limit: 50 })
      });
      const data = await res.json();
      
      if (res.ok && data.leads && data.leads.length > 0) {
        setScanStatus(`✅ Scan complete! Added ${data.found || data.leads.length} new hot prospects.`);
        setLeads(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const fresh = data.leads.map(l => ({
            ...l,
            outreach_draft: getStandardDraft(l)
          })).filter(l => !existingIds.has(l.id));
          const combined = [...fresh, ...prev];
          if (fresh.length > 0) {
            setSelectedLead(fresh[0]);
            setEditedDraft(getStandardDraft(fresh[0]));
          }
          return combined;
        });
      } else {
        setScanStatus(`✅ Search completed for ${searchCategory} in ${searchLocation}.`);
        await fetchLeads();
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatus('✅ Search finished! Refreshing prospects...');
      await fetchLeads();
    } finally {
      setScanning(false);
    }
  };

  const [clearing, setClearing] = useState(false);

  const handleClearLeads = async () => {
    if (leads.length === 0) return;
    if (!window.confirm('Are you sure you want to clear all prospect targets and reset the list to 0?')) return;
    
    setClearing(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/leads`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLeads([]);
        setSelectedLead(null);
        setScanStatus('🗑️ Prospect list successfully reset to 0.');
      } else {
        alert('Failed to clear prospects.');
      }
    } catch (err) {
      console.error('Failed to clear prospects:', err);
      alert('Error connecting to backend server.');
    } finally {
      setClearing(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}>
            Total Prospects: {leads.length}
          </div>
          <button
            onClick={handleSendAllLeads}
            disabled={sending || leads.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6C47FF 0%, #00C9A7 100%)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '700',
              border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(108, 71, 255, 0.3)',
              marginRight: '8px'
            }}
          >
            {sending ? '⏳ Dispatching All...' : '🚀 Send All Outreach Emails'}
          </button>
          <button
            onClick={handleClearLeads}
            disabled={clearing || leads.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: (clearing || leads.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (clearing || leads.length === 0) ? 0.4 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {clearing ? 'Clearing...' : '🗑️ Clear Targets to 0'}
          </button>
        </div>
      </div>

      {/* Target Search & Scanner Control Panel */}
      <div className="glass" style={{ padding: '24px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(108, 71, 255, 0.2)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔍</span> Search New Target Industry &amp; Location
        </h3>
        <form onSubmit={handleRunScan} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>Business Category / Industry</label>
            <input
              type="text"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              placeholder="e.g. Hotels, Dentists, Spas"
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

          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>City / Location</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="e.g. Quito, Miami, Amsterdam"
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
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>Target Rating Strategy</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ background: '#1A1A32', color: 'white' }}>🌐 All Ratings (1.0★ - 5.0★)</option>
              <option value="low" style={{ background: '#1A1A32', color: 'white' }}>🚨 Low Rated / Crisis (Under 4.0★)</option>
              <option value="high" style={{ background: '#1A1A32', color: 'white' }}>⭐ High Rated / Top (4.0★ - 5.0★)</option>
            </select>
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
                setEditedDraft(getStandardDraft(lead));
              }}
              className={`glass-card ${selectedLead?.id === lead.id ? 'active-card' : ''}`}
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderLeft: lead.status === 'SENT' ? '4px solid hsl(var(--success))' : '4px solid hsl(var(--primary))',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{lead.business_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#FFB800' }}>★ {lead.rating}</span>
                  <button
                    onClick={(e) => handleDeleteSingleLead(lead.id, e)}
                    title="Delete lead"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#FCA5A5',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
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
