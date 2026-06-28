import React, { useState, useEffect, useCallback } from 'react';

function applyMergeTags(message, contactName) {
  const firstName = contactName ? contactName.trim().split(' ')[0] : 'there';
  return message.replace(/\{first\s*name\}/gi, firstName).replace(/\{firstName\}/g, firstName);
}

export default function BulkFollowUp() {
  const [templates, setTemplates] = useState({ followup1: '', followup2: '', unlock_days: 1 });
  const [fu1Contacts, setFu1Contacts] = useState([]);
  const [fu2Contacts, setFu2Contacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState([]);
  const [logSlot, setLogSlot] = useState(null);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await window.api.getFollowUpTemplates();
      setTemplates(t);
      const unlockMs = t.unlock_days * 24 * 60 * 60 * 1000;
      const [fu1, fu2] = await Promise.all([
        window.api.getBulkFU1Contacts(),
        window.api.getBulkFU2Contacts(unlockMs),
      ]);
      setFu1Contacts(fu1);
      setFu2Contacts(fu2);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bulkSend = async (slot) => {
    const contacts = slot === 1 ? fu1Contacts : fu2Contacts;
    const template = slot === 1 ? templates.followup1 : templates.followup2;
    if (!contacts.length) return alert('No eligible contacts.');

    const preview = applyMergeTags(template, contacts[0]?.contact_name || 'John');
    const ok = window.confirm(
      `Send Follow Up ${slot} to ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}?\n\nExample message:\n"${preview}"\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setSending(true);
    setLogSlot(slot);
    setLog([]);
    setDoneCount(0);
    setTotalCount(contacts.length);

    const results = await window.api.bulkSendFollowUp({ contacts, slot });
    const newLog = results.map(r =>
      r.ok ? `✅ ${r.phone}` : `❌ ${r.phone} — ${r.error}`
    );
    setLog(newLog);
    setDoneCount(results.length);
    setSending(false);
    load();
  };

  const fu1Preview = templates.followup1
    ? applyMergeTags(templates.followup1, fu1Contacts[0]?.contact_name || 'John Smith')
    : '';
  const fu2Preview = templates.followup2
    ? applyMergeTags(templates.followup2, fu2Contacts[0]?.contact_name || 'John Smith')
    : '';

  return (
    <div style={{ padding: '20px 24px', color: 'var(--text)', fontFamily: 'var(--font-ui)', maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>📤 Bulk Follow Up</div>
        <div style={{ fontSize: 11, color: 'var(--win-dark)' }}>
          Send follow-up messages to contacts who haven't replied. FU2 unlocks {templates.unlock_days} day{templates.unlock_days !== 1 ? 's' : ''} after FU1.
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--win-dark)', fontSize: 12 }}>Loading contacts...</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {/* FU1 Card */}
          <div style={{
            flex: 1, background: 'var(--bg2)', border: '2px solid',
            borderTopColor: 'var(--border-hi)', borderLeftColor: 'var(--border-hi)',
            borderRightColor: 'var(--border-sh)', borderBottomColor: 'var(--border-sh)',
            padding: 16,
          }}>
            <div style={{ fontSize: 11, color: 'var(--win-dark)', marginBottom: 4, fontWeight: 'bold', letterSpacing: 1 }}>FOLLOW UP 1</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 2, color: 'var(--title-b)' }}>{fu1Contacts.length}</div>
            <div style={{ fontSize: 11, color: 'var(--win-dark)', marginBottom: 12 }}>contacts with no reply yet</div>
            {fu1Preview && (
              <div style={{
                fontSize: 11, background: 'var(--win-white)', color: '#000',
                border: '1px solid var(--border-sh)', padding: '8px 10px',
                marginBottom: 12, fontFamily: 'Times New Roman, serif', lineHeight: 1.4,
              }}>
                "{fu1Preview}"
              </div>
            )}
            <button
              onClick={() => bulkSend(1)}
              disabled={sending || !fu1Contacts.length}
              className="btn btn-primary"
              style={{ width: '100%', opacity: (!fu1Contacts.length || sending) ? 0.5 : 1 }}
            >
              {sending && logSlot === 1
                ? `Sending... ${doneCount}/${totalCount}`
                : `Send to ${fu1Contacts.length} Contact${fu1Contacts.length !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* FU2 Card */}
          <div style={{
            flex: 1, background: 'var(--bg2)', border: '2px solid',
            borderTopColor: 'var(--border-hi)', borderLeftColor: 'var(--border-hi)',
            borderRightColor: 'var(--border-sh)', borderBottomColor: 'var(--border-sh)',
            padding: 16,
          }}>
            <div style={{ fontSize: 11, color: 'var(--win-dark)', marginBottom: 4, fontWeight: 'bold', letterSpacing: 1 }}>FOLLOW UP 2</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 2, color: '#7c3aed' }}>{fu2Contacts.length}</div>
            <div style={{ fontSize: 11, color: 'var(--win-dark)', marginBottom: 12 }}>
              got FU1 {templates.unlock_days}+ day{templates.unlock_days !== 1 ? 's' : ''} ago, no reply
            </div>
            {fu2Preview && (
              <div style={{
                fontSize: 11, background: 'var(--win-white)', color: '#000',
                border: '1px solid var(--border-sh)', padding: '8px 10px',
                marginBottom: 12, fontFamily: 'Times New Roman, serif', lineHeight: 1.4,
              }}>
                "{fu2Preview}"
              </div>
            )}
            <button
              onClick={() => bulkSend(2)}
              disabled={sending || !fu2Contacts.length}
              className="btn btn-primary"
              style={{ width: '100%', background: fu2Contacts.length ? '#7c3aed' : undefined, opacity: (!fu2Contacts.length || sending) ? 0.5 : 1 }}
            >
              {sending && logSlot === 2
                ? `Sending... ${doneCount}/${totalCount}`
                : `Send to ${fu2Contacts.length} Contact${fu2Contacts.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Send Log */}
      {log.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>
            Send Log — Follow Up {logSlot} ({log.filter(l => l.startsWith('✅')).length}/{log.length} sent)
          </div>
          <div style={{
            background: 'var(--win-white)', border: '1px solid var(--border-sh)',
            padding: '8px 10px', maxHeight: 220, overflowY: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: '#000',
          }}>
            {log.map((l, i) => (
              <div key={i} style={{ marginBottom: 1, color: l.startsWith('❌') ? '#cc0000' : '#006600' }}>{l}</div>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => { setLog([]); setLogSlot(null); }}
          >
            Clear Log
          </button>
        </div>
      )}
    </div>
  );
}
