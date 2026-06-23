import { useState } from 'react'
import { synthesizeSpeech } from '../api'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'am', label: 'Amharic' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
]

export default function TextToSpeechTab() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('en')
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateSpeech = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError('')
    if (audioUrl) URL.revokeObjectURL(audioUrl)

    try {
      const res = await synthesizeSpeech(text, language)
      const nextUrl = URL.createObjectURL(res.data)
      setAudioUrl(nextUrl)
      new Audio(nextUrl).play()
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Text to Speech</h2>
        <p className="section-subtitle">Generate natural voice audio from text in supported Azure Speech languages.</p>
      </div>

      <div className="glass-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(220px, 1fr)', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="label">Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type the text you want the copilot to speak..."
              rows={8}
            />
          </div>

          <div>
            <label className="label">Voice language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginBottom: '0.8rem' }}>
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            <button className="btn-primary" onClick={generateSpeech} disabled={loading || !text.trim()} type="button">
              {loading ? 'Generating audio...' : 'Generate and play'}
            </button>
          </div>
        </div>

        {audioUrl && (
          <div className="result-box">
            <div className="label">Generated audio</div>
            <audio src={audioUrl} controls style={{ width: '100%' }} />
            <a href={audioUrl} download="speech.mp3">
              <button className="btn-primary" style={{ marginTop: '0.8rem' }} type="button">Download MP3</button>
            </a>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  )
}
