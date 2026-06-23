import { useState } from 'react'
import { generateImage } from '../api'

const STYLES = ['Photorealistic', 'Digital Art', 'Watercolor', 'Oil Painting', 'Minimalist', 'Cyberpunk', 'Anime']

export default function ImageGenTab() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Photorealistic')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const res = await generateImage(prompt, style)
      setResult(res.data)
    } catch (err) {
      setResult({ error: err.message })
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">AI Image Generation</h2>
        <p className="section-subtitle">Describe a visual idea and generate a finished image.</p>
      </div>

      <div className="glass-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(220px, 1fr)', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="label">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic AI lab in Addis Ababa at night..."
              rows={4}
            />
          </div>

          <div>
            <label className="label">Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ marginBottom: '0.8rem' }}>
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button className="btn-primary" onClick={generate} disabled={loading || !prompt.trim()} type="button">
              {loading ? 'Generating...' : 'Generate image'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <span className="spinner" />
          <div style={{ marginTop: '1rem' }}>Creating your image... this can take 30-60 seconds.</div>
        </div>
      )}

      {result?.success && (
        <div className="glass-card">
          <img
            src={'data:image/png;base64,' + result.image_base64}
            alt={prompt}
            style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
          />
          <a href={'data:image/png;base64,' + result.image_base64} download="generated.png">
            <button className="btn-primary" type="button">Download image</button>
          </a>
        </div>
      )}

      {result?.error && <div className="error-box">{result.error}</div>}
    </div>
  )
}
