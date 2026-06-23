import { useState } from 'react'
import { editImage } from '../api'

const PRESETS = [
  'Custom prompt',
  'Make it a professional LinkedIn headshot',
  'Convert to anime/cartoon style',
  'Add a futuristic city background',
  'Make it look like an oil painting',
  'Add professional office background',
  'Convert to black and white artistic style',
  'Make it look cinematic',
]

export default function ImageEditTab() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [preset, setPreset] = useState('Custom prompt')
  const [customPrompt, setCustomPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const edit = async () => {
    if (!file) return
    const prompt = preset === 'Custom prompt' ? customPrompt : preset
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const res = await editImage(file, prompt)
      setResult(res.data)
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">AI Image Editing</h2>
        <p className="section-subtitle">Upload a photo, choose a preset, or describe the change you want.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div className="label">Original photo</div>
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview ? (
            <img src={preview} alt="Original" style={{ width: '100%', borderRadius: '8px', marginTop: '1rem' }} />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">IMG</div>
              <div className="empty-title">Upload your photo</div>
            </div>
          )}
        </div>

        <div className="glass-card">
          <div className="label">Edit options</div>

          <label className="label">Quick presets</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} style={{ marginBottom: '0.8rem' }}>
            {PRESETS.map((p) => <option key={p}>{p}</option>)}
          </select>

          {preset === 'Custom prompt' && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what to change..."
              rows={3}
              style={{ marginBottom: '0.8rem' }}
            />
          )}

          <button className="btn-primary" onClick={edit} disabled={loading || !file} type="button">
            {loading ? <><span className="spinner" /> Editing...</> : 'Edit image'}
          </button>

          {result?.success && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#86efac' }}>Edited version</div>
              <img
                src={`data:image/png;base64,${result.image_base64}`}
                alt="Edited"
                style={{ width: '100%', borderRadius: '8px', marginBottom: '0.8rem' }}
              />
              <a href={`data:image/png;base64,${result.image_base64}`} download="edited.png">
                <button className="btn-primary" type="button">Download</button>
              </a>
            </div>
          )}
          {result?.error && <div className="error-box">{result.error}</div>}
        </div>
      </div>
    </div>
  )
}
