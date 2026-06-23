const langMap = {
  en: 'English',
  am: 'Amharic',
  fr: 'French',
  ar: 'Arabic',
  es: 'Spanish',
}

export default function Header({ detectedLang }) {
  return (
    <header className="hero-header">
      <div className="hero-copy">
        <div className="brand-lockup">
          <img src="/logo.svg" alt="Azure AI Copilot logo" className="brand-logo-large" />
          <div>
            <h1 className="gradient-text">Azure AI Copilot</h1>
            <p className="hero-subtitle">
              Multilingual assistant for chat, vision, documents, speech, and image workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="status-stack" aria-label="System status">
        <span className="badge badge-green">
          <span className="status-dot" />
          AI Online
        </span>
        <span className="badge badge-blue">{langMap[detectedLang] || 'Auto language'}</span>
        <span className="badge badge-purple">GPT-4o ready</span>
      </div>
    </header>
  )
}
