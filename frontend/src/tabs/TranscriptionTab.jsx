import { useMemo, useState } from 'react'
import { analyzeTranscript, synthesizeSpeech, transcribeAudio } from '../api'

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'en', label: 'English' },
  { value: 'am', label: 'Amharic' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
]

const ANALYSIS_TASKS = [
  ['summary', 'Summarize'],
  ['actions', 'Action items'],
  ['translate_en', 'Translate to English'],
  ['translate_am', 'Translate to Amharic'],
]

export default function TranscriptionTab() {
  const [file, setFile] = useState(null)
  const [language, setLanguage] = useState('auto')
  const [translateToEnglish, setTranslateToEnglish] = useState(true)
  const [result, setResult] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [speechText, setSpeechText] = useState('')
  const [speechLanguage, setSpeechLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [speechLoading, setSpeechLoading] = useState(false)

  const sizeMB = useMemo(() => (file ? (file.size / 1024 / 1024).toFixed(1) : 0), [file])
  const tooLarge = parseFloat(sizeMB) > 24
  const transcript = result?.text || ''

  const handleFile = (e) => {
    setFile(e.target.files[0])
    setResult(null)
    setAnalysis('')
  }

  const transcribe = async () => {
    if (!file) return

    setLoading(true)
    setAnalysis('')
    try {
      const res = await transcribeAudio(file, {
        language,
        translateToEnglish,
      })
      setResult(res.data)
      if (res.data?.text) setSpeechText(res.data.text)
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  const runAnalysis = async (task) => {
    if (!transcript.trim()) return
    setAnalysisLoading(true)
    try {
      const res = await analyzeTranscript(transcript, task)
      setAnalysis(res.data.analysis || res.data.error || '')
    } catch (err) {
      setAnalysis('Error: ' + err.message)
    }
    setAnalysisLoading(false)
  }

  const playSpeech = async () => {
    if (!speechText.trim()) return
    setSpeechLoading(true)
    try {
      const res = await synthesizeSpeech(speechText, speechLanguage)
      const audioUrl = URL.createObjectURL(res.data)
      const audio = new Audio(audioUrl)
      audio.onended = () => URL.revokeObjectURL(audioUrl)
      await audio.play()
    } catch (err) {
      setAnalysis('Text to speech error: ' + err.message)
    }
    setSpeechLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Audio and Video Intelligence</h2>
        <p className="section-subtitle">
          Transcribe multilingual audio or video, translate it, analyze the transcript, and generate speech from text.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div className="label">Audio or video file</div>
          <input type="file" accept=".mp3,.wav,.m4a,.mp4,.mov,.webm" onChange={handleFile} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '1rem' }}>
            <div>
              <label className="label">Spoken language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <label className={`toggle-card ${translateToEnglish ? 'is-on' : ''}`} style={{ marginTop: '1.35rem' }}>
              <span>
                <strong>English translation</strong>
                <small>{translateToEnglish ? 'Also translate transcript' : 'Original text only'}</small>
              </span>
              <input
                type="checkbox"
                checked={translateToEnglish}
                onChange={(e) => setTranslateToEnglish(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
            </label>
          </div>

          {file && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
              <div className="metric-card">
                <div style={{ fontWeight: '700', color: '#67e8f9', fontSize: '0.82rem', wordBreak: 'break-word' }}>{file.name}</div>
                <div className="metric-label">File</div>
              </div>
              <div className="metric-card">
                <div style={{ fontWeight: '700', color: tooLarge ? '#fb7185' : '#67e8f9' }}>{sizeMB} MB</div>
                <div className="metric-label">Size</div>
              </div>
            </div>
          )}

          {tooLarge && <div className="error-box">File too large. Maximum size is 24MB.</div>}

          {file && !tooLarge && (
            <button className="btn-primary" onClick={transcribe} disabled={loading} style={{ marginTop: '1rem' }} type="button">
              {loading ? 'Transcribing...' : 'Transcribe and analyze'}
            </button>
          )}
        </div>

        <div className="glass-card">
          <div className="label">Transcript analysis</div>
          {loading && (
            <div className="empty-state" style={{ padding: '1rem' }}>
              <span className="spinner" />
              <span style={{ marginLeft: '8px' }}>Transcribing... please wait</span>
            </div>
          )}

          {result?.error && <div className="error-box">{result.error}</div>}

          {transcript ? (
            <>
              <div style={{ marginBottom: '0.8rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                Detected language: <strong style={{ color: '#dbeafe' }}>{result.detected_language || 'auto'}</strong>
              </div>
              <textarea value={transcript} readOnly rows={7} style={{ marginBottom: '0.8rem' }} />

              {result.translated_text && (
                <div className="result-box">
                  <div className="label">English translation</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{result.translated_text}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
                {ANALYSIS_TASKS.map(([task, label]) => (
                  <button key={task} className="btn-primary" onClick={() => runAnalysis(task)} disabled={analysisLoading} type="button">
                    {label}
                  </button>
                ))}
              </div>

              {analysisLoading && <div style={{ marginTop: '1rem', color: '#94a3b8' }}><span className="spinner" /> Analyzing...</div>}
              {analysis && (
                <div className="glass-card" style={{ marginTop: '1rem', padding: '0.9rem' }}>
                  <div className="label">Result</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{analysis}</div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">AUD</div>
              <div className="empty-title">Upload audio or video to begin</div>
              <div className="empty-subtitle">Amharic and other supported languages can be transcribed with auto detect or a language hint.</div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '1rem' }}>
        <div className="section-header">
          <h3 className="section-title" style={{ fontSize: '1rem' }}>Text to Speech</h3>
          <p className="section-subtitle">Paste text or reuse a transcript and generate spoken audio.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(180px, 1fr)', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="label">Text</label>
            <textarea
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              placeholder="Type text to read aloud..."
              rows={4}
            />
          </div>
          <div>
            <label className="label">Voice language</label>
            <select value={speechLanguage} onChange={(e) => setSpeechLanguage(e.target.value)} style={{ marginBottom: '0.8rem' }}>
              {LANGUAGE_OPTIONS.filter((option) => option.value !== 'auto').map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={playSpeech} disabled={speechLoading || !speechText.trim()} type="button">
              {speechLoading ? 'Preparing audio...' : 'Play speech'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
