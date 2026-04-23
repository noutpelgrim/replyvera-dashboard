import React, { useState } from 'react';

const ReviewCard = ({ review, onApprove, onRegenerate }) => {
  const [draft, setDraft] = React.useState(review.drafted_reply);
  const [isEditing, setIsEditing] = useState(false);
  
  // Sync local draft state with props when AI regenerates
  React.useEffect(() => {
    setDraft(review.drafted_reply);
  }, [review.drafted_reply]);

  const isOfficial = review.google_review_id && !review.google_review_id.startsWith('scanned-');

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'hsl(var(--success))';
      case 'FLAGGED': return 'hsl(var(--danger))';
      default: return 'hsl(var(--primary))';
    }
  };

  return (
    <div className="glass card-shadow fade-in" style={{
      padding: '24px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      borderLeft: `4px solid ${getStatusColor(review.status)}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isOfficial ? (
            <div style={{ width: '40px', height: '40px', background: '#4285F4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          ) : (
            <div style={{ width: '40px', height: '40px', background: 'hsl(var(--primary))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{review.reviewer_name}</h3>
              <span style={{ 
                fontSize: '0.65rem', 
                background: isOfficial ? 'rgba(66, 133, 244, 0.1)' : 'rgba(108, 71, 255, 0.1)', 
                color: isOfficial ? '#4285F4' : 'hsl(var(--primary))',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '800',
                border: `1px solid ${isOfficial ? 'rgba(66, 133, 244, 0.2)' : 'rgba(108, 71, 255, 0.2)'}`
              }}>
                {isOfficial ? 'OFFICIAL REVIEW' : 'SCANNED LEAD'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: i < review.rating ? '#FFB800' : 'hsl(var(--border))', fontSize: '1rem' }}>★</span>
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: '500' }}>
                • {review.review_date ? new Date(review.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
              </span>
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'hsl(var(--bg-dark))',
          border: `1px solid ${getStatusColor(review.status)}`,
          color: getStatusColor(review.status)
        }}>{review.status}</span>
      </div>

      <p style={{ color: 'hsl(var(--text-main))', fontStyle: 'italic', fontSize: '0.95rem' }}>
        "{review.comment}"
      </p>

      <div className="glass" style={{
        padding: '20px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--primary))' }}>✨ AI Suggested Reply</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{ background: 'transparent', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}
          >
            {isEditing ? 'Save' : 'Edit Draft'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ width: '100%', minHeight: '80px', fontSize: '0.9rem', color: 'white' }}
          />
        ) : (
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{draft}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onRegenerate(review.id)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--text-muted))',
            fontSize: '0.9rem'
          }}
        >
          🔄 Regenerate
        </button>
        <button
          onClick={() => onApprove(review.id, draft)}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            background: 'hsl(var(--primary))',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}
        >
          ✅ Approve & Post
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
