import React, { useState, useEffect } from 'react';

export default function FollowUpSettings() {
  const [fu1, setFu1] = useState('');
  const [fu2, setFu2] = useState('');
  const [days, setDays] = useState(1);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.getFollowUpTemplates().then(t => {
      setFu1(t.followup1 || '');
      setFu2(t.followup2 || '');
      setDays(t.unlock_days ?? 1);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await window.api.setFollowUpTemplate('followup1', fu1);
    await window.api.setFollowUpTemplate('followup2', fu2);
    await window.api.setFollowUpTemplate('unlock_days', parseFloat(days) || 1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div style={{ padding: 20, fontSize: 12, color: 'var(--win-dark)' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--font-ui)', color: 'var(--text)', maxWidth: 560 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>💬 Follow Up Messages</div>
      <div style={{ fontSize: 11, color: 'var(--win-dark)', marginBottom: 20 }}>
        Use <strong>{'{firstName}'}</strong> to insert the contact's first name automatically.
      </div>

      <div className="form-group">
        <label className="form-label">Follow Up 1</label>
        <div style={{ fontSize: 10, color: 'var(--win-dark)', marginBottom: 4 }}>
          Sent manually from each chat or via Bulk Follow Up
        </div>
        <textarea
          className="form-input"
          value={fu1}
          onChange={e => setFu1(e.target.value)}
          rows={4}
          style={{ resize: 'vertical', fontFamily: 'var(--font-ui)', fontSize: 13 }}
        />
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Follow Up 2</label>
        <div style={{ fontSize: 10, color: 'var(--win-dark)', marginBottom: 4 }}>
          Unlocks after the delay below. Resets automatically when a contact replies.
        </div>
        <textarea
          className="form-input"
          value={fu2}
          onChange={e => setFu2(e.target.value)}
          rows={5}
          style={{ resize: 'vertical', fontFamily: 'var(--font-ui)', fontSize: 13 }}
        />
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Days before Follow Up 2 unlocks</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={days}
            onChange={e => setDays(e.target.value)}
            className="form-input"
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 12, color: 'var(--win-dark)' }}>
            day{parseFloat(days) !== 1 ? 's' : ''} after Follow Up 1 is sent
          </span>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          style={{ minWidth: 140 }}
        >
          {saved ? '✅ Saved!' : 'Save Messages'}
        </button>
      </div>
    </div>
  );
}
