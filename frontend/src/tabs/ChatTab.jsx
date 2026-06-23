import { useEffect, useRef, useState } from 'react'
import { sendMessage, synthesizeSpeech } from '../api'

export default function ChatTab({ messages, setMessages, setDetectedLang, ttsMode }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const systemMessage = {
    role: 'system',
    content: `You are Azure AI Copilot - a smart friendly multilingual AI assistant.
CRITICAL RULE: Always respond in the EXACT same language the user writes in.
Amharic to Amharic. French to French. Arabic to Arabic. English to English.`,
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = [systemMessage, ...newMessages]
      const res = await sendMessage(history, input)
      const { response, detected_language } = res.data
      setDetectedLang(detected_language || 'en')
      setMessages([...newMessages, { role: 'assistant', content: response }])
      if (ttsMode && response) {
        speakText(response, detected_language || 'en')
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + err.message }])
    }

    setLoading(false)
  }

  const speakText = async (text, language = 'en') => {
    try {
      const res = await synthesizeSpeech(text, language)
      const audioUrl = URL.createObjectURL(res.data)
      const audio = new Audio(audioUrl)
      audio.onended = () => URL.revokeObjectURL(audioUrl)
      audio.play()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header">
        <h2 className="section-title">Multilingual Chat</h2>
        <p className="section-subtitle">Type in any language. The AI responds in the same language.</p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          minHeight: '400px',
          maxHeight: '500px',
        }}
      >
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">AI</div>
            <div className="empty-title">Start a conversation</div>
            <div className="empty-subtitle">English, Amharic, French, Arabic, and Spanish are supported.</div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                {msg.role === 'user' ? 'You' : 'AI Copilot'}
                {msg.role === 'assistant' && (
                  <button
                    className="message-speak"
                    type="button"
                    onClick={() => speakText(msg.content)}
                    title="Read aloud"
                  >
                    Speak
                  </button>
                )}
              </span>
              <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{msg.content}</span>
            </div>
          ))
        )}

        {loading && (
          <div className="chat-message-ai">
            <span className="spinner" />
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Ask anything in any language... (Enter to send)"
          rows={2}
          style={{ flex: 1, resize: 'none' }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ width: '92px', height: '60px' }}
          type="button"
        >
          {loading ? <span className="spinner" /> : 'Send'}
        </button>
      </div>
    </div>
  )
}
