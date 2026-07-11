import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReviewCard from '../components/ReviewCard';
import SettingsPanel from '../components/SettingsPanel';
import LeadsTab from '../components/LeadsTab';
import AnalyticsTab from '../components/AnalyticsTab';

import { useAuth } from '../context/AuthContext';
import CONFIG from '../config';

const API_BASE = `${CONFIG.API_BASE}/api`;

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reviews');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [settings, setSettings] = useState({
    tone: 'Professional',
    language: 'auto',
    minRating: 4,
    instructions: ''
  });
  const [autoReply, setAutoReply] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // 1. Fetch data on mount AND whenever refreshTrigger changes
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      try {
        // Fetch locations first
        const locationsRes = await fetch(`${CONFIG.API_BASE}/google/enrolled?email=${user.email}`);
        const locationsData = await locationsRes.json();
        setLocations(locationsData || []);
        
        if (locationsData && locationsData.length > 0) {
          setSelectedLocation(locationsData[0]);
        }

        const [reviewsRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/reviews?email=${user.email}`),
          fetch(`${API_BASE}/settings?email=${user.email}`)
        ]);
        
        const reviewsData = await reviewsRes.json();
        const settingsData = await settingsRes.json();
        
        setReviews(reviewsData || []);
        if (settingsData) {
          setSettings({
            tone: settingsData.reply_tone || 'Professional',
            language: settingsData.reply_language || 'auto',
            minRating: settingsData.min_rating_threshold || 4,
            instructions: '', // Instructions not yet in DB schema
            automation_enabled: settingsData.automation_enabled
          });
          setAutoReply(settingsData.automation_enabled);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, [user?.email, refreshTrigger]);

  // 2. Handle Review Approval
  const handleApprove = async (id, draft) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drafted_reply: draft, status: 'PUBLISHED' })
      });
      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, status: 'PUBLISHED', drafted_reply: draft } : r));
      } else {
        const errorData = await res.json();
        alert(`Posting failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Network error - check if backend is running.');
    }
  };

  // 3. Handle Settings Save
  const handleSettingsSave = async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE}/settings?email=${user.email}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_enabled: autoReply,
          reply_tone: newSettings.tone,
          reply_language: newSettings.language,
          min_rating_threshold: newSettings.minRating
        })
      });
      if (res.ok) {
        setSettings(newSettings);
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Settings update failed:', err);
    }
  };

  const handleRegenerate = async (id) => {
    try {
      console.log(`🔄 Regenerating AI draft for review ${id}...`);
      const res = await fetch(`${API_BASE}/reviews/${id}/regenerate`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const updatedReview = await res.json();
        // Update local state with the new draft
        setReviews(reviews.map(r => r.id === id ? updatedReview : r));
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
    }
  };

  const filteredReviews = reviews
    .filter(r => !selectedLocation || r.location_id === selectedLocation.id)
    .filter(r => {
      // 1. Search filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = r.reviewer_name.toLowerCase().includes(term) || 
                            r.comment.toLowerCase().includes(term);
      
      // 2. Rating filter
      const matchesRating = ratingFilter === 'all' || r.rating === parseInt(ratingFilter);
      
      // 3. Status filter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      
      return matchesSearch && matchesRating && matchesStatus;
    });

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        locations={locations}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />
      
      <main style={{ marginLeft: '280px', flex: 1, padding: '40px', maxWidth: '1000px' }}>
        <Header autoReply={autoReply} setAutoReply={setAutoReply} />


        {activeTab === 'reviews' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Filter Toolbar */}
            <div className="glass" style={{
              padding: '16px 24px',
              borderRadius: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {/* Search Box */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search reviews or reviewer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Rating Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating:</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Stars</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status:</label>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {['all', 'PENDING', 'PUBLISHED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: statusFilter === status ? 'hsl(var(--primary))' : 'transparent',
                          color: statusFilter === status ? 'white' : 'hsl(var(--text-muted))',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: 'none',
                          outline: 'none'
                        }}
                      >
                        {status === 'all' ? 'All' : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onApprove={handleApprove}
                  onRegenerate={handleRegenerate}
                />
              ))
            ) : (
              <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'hsl(var(--text-muted))' }}>No reviews match your filters.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leads' && <LeadsTab />}

        {activeTab === 'settings' && (
          <SettingsPanel 
            settings={settings} 
            setSettings={setSettings} 
            onSave={handleSettingsSave} 
          />
        )}

        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>
    </div>
  );
}

