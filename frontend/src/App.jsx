import { useEffect, useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatTab from './tabs/ChatTab'
import VisionTab from './tabs/VisionTab'
import ImageGenTab from './tabs/ImageGenTab'
import ImageEditTab from './tabs/ImageEditTab'
import TranscriptionTab from './tabs/TranscriptionTab'
import TextToSpeechTab from './tabs/TextToSpeechTab'
import PDFTab from './tabs/PDFTab'
import { loadHistory, saveHistory } from './api'

const TABS = [
  { id: 'chat', icon: 'AI', label: 'Chat' },
  { id: 'vision', icon: 'OCR', label: 'Vision' },
  { id: 'imagegen', icon: 'IMG', label: 'Generate' },
  { id: 'imageedit', icon: 'EDT', label: 'Edit' },
  { id: 'transcribe', icon: 'AUD', label: 'Transcribe' },
  { id: 'tts', icon: 'TTS', label: 'Text to Speech' },
  { id: 'pdf', icon: 'DOC', label: 'Documents' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [detectedLang, setDetectedLang] = useState('en')
  const [ttsMode, setTtsMode] = useState(false)
  const [sessions, setSessions] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const refreshHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await loadHistory()
      setSessions(res.data.sessions || [])
    } catch (err) {
      console.error(err)
    }
    setHistoryLoading(false)
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  const handleSave = async () => {
    if (!messages.length) return alert('Nothing to save yet!')
    try {
      await saveHistory(messages, { language: detectedLang })
      await refreshHistory()
      alert('Session saved to Azure.')
    } catch (err) {
      alert('Save failed: ' + err.message)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setDetectedLang('en')
    setActiveTab('chat')
  }

  const handleLoadSession = (session) => {
    setMessages(session.messages || [])
    setDetectedLang(session.metadata?.language || 'en')
    setActiveTab('chat')
  }

  const handleClear = () => {
    if (window.confirm('Clear everything?')) {
      setMessages([])
      setDetectedLang('en')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        messageCount={messages.filter((m) => m.role === 'user').length}
        detectedLang={detectedLang}
        onSave={handleSave}
        onClear={handleClear}
        onNewChat={handleNewChat}
        sessions={sessions}
        historyLoading={historyLoading}
        onRefreshHistory={refreshHistory}
        onLoadSession={handleLoadSession}
      />

      <main className="workspace">
        <Header detectedLang={detectedLang} />

        <nav className="tab-bar" aria-label="Copilot tools">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
              type="button"
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <section className="content-panel">
          <div className="fade-in">
            {activeTab === 'chat' && (
              <ChatTab
                messages={messages}
                setMessages={setMessages}
                setDetectedLang={setDetectedLang}
                ttsMode={ttsMode}
              />
            )}
            {activeTab === 'vision' && <VisionTab />}
            {activeTab === 'imagegen' && <ImageGenTab />}
            {activeTab === 'imageedit' && <ImageEditTab />}
            {activeTab === 'transcribe' && <TranscriptionTab />}
            {activeTab === 'tts' && <TextToSpeechTab />}
            {activeTab === 'pdf' && <PDFTab />}
          </div>
        </section>
      </main>
    </div>
  )
}
