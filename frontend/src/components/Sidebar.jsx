function sessionTitle(session) {
  const firstUserMessage = session.messages?.find((message) => message.role === 'user')?.content
  if (!firstUserMessage) return session.date || 'Saved conversation'
  return firstUserMessage.length > 42 ? `${firstUserMessage.slice(0, 42)}...` : firstUserMessage
}

export default function Sidebar({
  onSave,
  onClear,
  onNewChat,
  sessions,
  historyLoading,
  onRefreshHistory,
  onLoadSession,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.svg" alt="Azure AI Copilot" className="brand-logo-small" />
        <div>
          <div className="brand-name">AI Copilot</div>
          <div className="brand-caption">Azure workspace</div>
        </div>
      </div>

      <section className="sidebar-section action-stack">
        <button className="btn-primary" onClick={onNewChat} type="button">
          <span>New chat</span>
        </button>
        <button className="btn-primary btn-save" onClick={onSave} type="button">
          <span>Save current chat</span>
        </button>
      </section>

      <section className="sidebar-section sidebar-history">
        <div className="sidebar-row">
          <div className="sidebar-label">History</div>
          <button className="link-button" onClick={onRefreshHistory} type="button">
            {historyLoading ? 'Loading' : 'Refresh'}
          </button>
        </div>

        <div className="history-list">
          {sessions?.length ? (
            sessions.map((session) => (
              <button
                key={session.blob_name}
                className="history-item"
                onClick={() => onLoadSession(session)}
                type="button"
                title={sessionTitle(session)}
              >
                <span>{sessionTitle(session)}</span>
                <small>{session.date}</small>
              </button>
            ))
          ) : (
            <div className="history-empty">
              {historyLoading ? 'Loading saved chats...' : 'No saved chats yet.'}
            </div>
          )}
        </div>
      </section>

      <section className="sidebar-section">
        <button className="btn-danger" onClick={onClear} type="button">
          Clear current chat
        </button>
      </section>

      <div className="account-card">
        <div className="account-avatar">U</div>
        <div>
          <strong>Workspace user</strong>
          <span>Local Azure Copilot</span>
        </div>
      </div>
    </aside>
  )
}
