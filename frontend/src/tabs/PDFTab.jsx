import { useState } from 'react'
import { askPDF, extractPDF, generateImage } from '../api'

const QUICK_QUESTIONS = [
  ['Summarize', 'Provide a clear structured summary with main topic, key points, and conclusions.'],
  ['Key points', 'List the 5 most important key points as bullet points.'],
  ['Findings', 'What are the main findings or results in this document?'],
  ['Recommendations', 'What recommendations does this document make?'],
]

export default function PDFTab() {
  const [pdfText, setPdfText] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imgTopic, setImgTopic] = useState('')

  const handlePDF = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    try {
      const res = await extractPDF(file)
      if (res.data.success) {
        setPdfText(res.data.text)
        setPdfName(file.name)
        setWordCount(res.data.word_count)
      }
    } catch (err) {
      setAnswer('Error: ' + err.message)
    }
    setLoading(false)
  }

  const askQuestion = async (q) => {
    if (!pdfText || !q.trim()) return
    setLoading(true)
    setAnswer('')
    try {
      const res = await askPDF(pdfText, q)
      setAnswer(res.data.answer)
    } catch (err) {
      setAnswer('Error: ' + err.message)
    }
    setLoading(false)
  }

  const generateConceptImage = async () => {
    if (!imgTopic.trim() || !pdfText) return
    setImgLoading(true)
    try {
      const contextRes = await askPDF(pdfText, `Describe "${imgTopic}" from this document in 2 sentences for image generation.`)
      const imgRes = await generateImage(contextRes.data.answer, 'Digital Art')
      setGeneratedImage(imgRes.data)
    } catch (err) {
      setGeneratedImage({ error: err.message })
    }
    setImgLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Documents and RAG</h2>
        <p className="section-subtitle">Upload a PDF, ask questions, summarize it, or visualize a concept from the document.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div className="label">Upload PDF</div>
          <input type="file" accept=".pdf" onChange={handlePDF} />
          {loading && <div style={{ color: '#94a3b8', marginTop: '0.8rem' }}><span className="spinner" /> Reading PDF...</div>}
          {pdfName && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ color: '#86efac', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{pdfName}</div>
              <div className="metric-card">
                <div className="metric-value">{wordCount.toLocaleString()}</div>
                <div className="metric-label">Words extracted</div>
              </div>
              <div className="glass-card" style={{ marginTop: '0.8rem', maxHeight: '150px', overflowY: 'auto', padding: '0.8rem' }}>
                <div className="label">Preview</div>
                <div style={{ fontSize: '0.8rem', color: '#9aa4b2', lineHeight: '1.55' }}>{pdfText.slice(0, 400)}...</div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card">
          <div className="label">Ask about document</div>
          {pdfText ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                {QUICK_QUESTIONS.map(([label, q]) => (
                  <button key={label} className="btn-primary" onClick={() => askQuestion(q)} disabled={loading} type="button">
                    {label}
                  </button>
                ))}
              </div>

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askQuestion(question)}
                placeholder="Ask anything about the document..."
                style={{ marginBottom: '0.5rem' }}
              />
              <button className="btn-primary" onClick={() => askQuestion(question)} disabled={loading || !question.trim()} type="button">
                {loading ? <><span className="spinner" /> Answering...</> : 'Ask AI'}
              </button>

              {answer && (
                <div className="glass-card" style={{ marginTop: '1rem', padding: '0.8rem' }}>
                  <div className="label">AI answer</div>
                  <div style={{ fontSize: '0.88rem', color: '#dbeafe', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>{answer}</div>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.09)', marginTop: '1rem', paddingTop: '1rem' }}>
                <div className="label">Generate concept image</div>
                <input
                  value={imgTopic}
                  onChange={(e) => setImgTopic(e.target.value)}
                  placeholder="What concept should AI visualize?"
                  style={{ marginBottom: '0.5rem' }}
                />
                <button className="btn-primary" onClick={generateConceptImage} disabled={imgLoading || !imgTopic.trim()} type="button">
                  {imgLoading ? <><span className="spinner" /> Generating...</> : 'Generate concept image'}
                </button>
                {generatedImage?.success && (
                  <img
                    src={`data:image/png;base64,${generatedImage.image_base64}`}
                    alt="Concept"
                    style={{ width: '100%', borderRadius: '8px', marginTop: '0.8rem' }}
                  />
                )}
                {generatedImage?.error && <div className="error-box">{generatedImage.error}</div>}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">DOC</div>
              <div className="empty-title">Upload a PDF first</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
