import { useEffect, useState } from 'react'
import { deleteHistory, loadHistory } from '../api'

export default function HistoryTab({ setMessages }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await loadHistory()
      setSessions(res.data.sessions || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (blobName) => {
    try {
      await deleteHistory(encodeURIComponent(blobName))
      setSessions((s) => s.filter((x) => x.blob_name !== blobName))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h2 className="section-title">Session History</h2>
          <p className="section-subtitle">All sessions saved to Azure Blob Storage.</p>
        </div>
        <button className="btn-primary" onClick={load} style={{ width: 'auto', padding: '0.5rem 1rem' }} type="button">
          Refresh
        </button>
      </div>

      {loading && <div className="empty-state"><span className="spinner" /></div>}

      {!loading && sessions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">HIS</div>
          <div className="empty-title">No history yet</div>
          <div className="empty-subtitle">Use Save session to store conversations.</div>
        </div>
      )}

      {sessions.map((session, i) => (
        <div key={i} className="history-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{session.date}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                {session.message_count} messages / {session.metadata?.language?.toUpperCase() || 'EN'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setMessages(session.messages || [])}
                type="button"
              >
                Load
              </button>
              <button
                className="btn-danger"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => handleDelete(session.blob_name)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>

          <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
            {session.messages?.slice(0, 2).map((msg, j) => (
              <div key={j} style={{ fontSize: '0.78rem', color: '#9aa4b2', marginBottom: '0.25rem' }}>
                {msg.role === 'user' ? 'You' : 'AI'}: {msg.content?.slice(0, 80)}...
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
