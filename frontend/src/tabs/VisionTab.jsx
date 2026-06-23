import { useState } from 'react'
import { analyzeImage } from '../api'

export default function VisionTab() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const analyze = async (mode) => {
    if (!file) return
    setLoading(true)
    try {
      const res = await analyzeImage(file)
      setResult({ mode, data: res.data.results })
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Vision and OCR</h2>
        <p className="section-subtitle">Upload an image so AI can describe it, detect objects, and extract text.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div className="label">Upload image</div>
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '8px', marginTop: '1rem' }} />}
        </div>

        <div className="glass-card">
          <div className="label">Actions</div>
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button className="btn-primary" onClick={() => analyze('describe')} disabled={loading} type="button">
                {loading ? <span className="spinner" /> : 'Describe image'}
              </button>
              <button className="btn-primary" onClick={() => analyze('ocr')} disabled={loading} type="button">
                {loading ? <span className="spinner" /> : 'Extract text'}
              </button>

              {result && !result.error && (
                <div style={{ marginTop: '1rem' }}>
                  {result.data?.map((item, i) => (
                    <div key={i} className="glass-card" style={{ padding: '0.8rem' }}>
                      {item.type === 'caption' && <p><strong>Description:</strong> {item.text}</p>}
                      {item.type === 'tags' && <p><strong>Tags:</strong> {item.items?.join(', ')}</p>}
                      {item.type === 'objects' && <p><strong>Objects:</strong> {item.items?.join(', ')}</p>}
                      {item.type === 'text' && (
                        <div>
                          <p><strong>Text found:</strong></p>
                          {item.lines?.map((line, j) => (
                            <p key={j} style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {result?.error && <div className="error-box">{result.error}</div>}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">OCR</div>
              <div className="empty-title">Upload an image first</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
