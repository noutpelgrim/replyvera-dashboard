import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReviewCard from '../components/ReviewCard';
import SettingsPanel from '../components/SettingsPanel';
import LeadsTab from '../components/LeadsTab';
import AnalyticsTab from '../components/AnalyticsTab';

import CONFIG from '../config';

const API_BASE = `${CONFIG.API_BASE}/api`;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('reviews');
  const [autoReply, setAutoReply] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState({
    tone: 'Professional',
    minRating: 4,
    instructions: ''
  });

  // 1. Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/reviews`),
          fetch(`${API_BASE}/settings`)
        ]);
        
        const reviewsData = await reviewsRes.json();
        const settingsData = await settingsRes.json();
        
        setReviews(reviewsData || []);
        if (settingsData) {
          setSettings({
            tone: settingsData.reply_tone || 'Professional',
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
  }, []);

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
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  // 3. Handle Settings Save
  const handleSettingsSave = async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_enabled: autoReply,
          reply_tone: newSettings.tone,
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

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ marginLeft: '280px', flex: 1, padding: '40px', maxWidth: '1000px' }}>
        <Header autoReply={autoReply} setAutoReply={setAutoReply} />

        {activeTab === 'reviews' && (
          <div className="fade-in">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onApprove={handleApprove}
                  onRegenerate={handleRegenerate}
                />
              ))
            ) : (
              <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'hsl(var(--text-muted))' }}>No reviews found in the database.</p>
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

