import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000/api'
})

// CHAT
export const sendMessage = (messages, userInput) =>
  API.post('/chat/send', { messages, user_input: userInput })

// VISION
export const analyzeImage = (file) => {
  const form = new FormData()
  form.append('file', file)
  return API.post('/vision/analyze', form)
}

// IMAGE GENERATION
export const generateImage = (prompt, style) =>
  API.post('/image/generate', { prompt, style })

// IMAGE EDITING
export const editImage = (file, prompt) => {
  const form = new FormData()
  form.append('file', file)
  form.append('prompt', prompt)
  return API.post('/edit/edit', form)
}

// TRANSCRIPTION
export const transcribeAudio = (file, options = {}) => {
  const form = new FormData()
  form.append('file', file)
  if (options.language) form.append('language', options.language)
  if (options.translateToEnglish) form.append('translate_to_english', String(options.translateToEnglish))
  return API.post('/transcribe/audio', form, { timeout: 120000 })
}

export const analyzeTranscript = (text, task = 'summary') =>
  API.post('/transcribe/analyze', { text, task })

// SPEECH
export const synthesizeSpeech = (text, language = 'en') =>
  API.post('/speech/tts', { text, language }, { responseType: 'blob', timeout: 120000 })

// PDF
export const extractPDF = (file) => {
  const form = new FormData()
  form.append('file', file)
  return API.post('/pdf/extract', form)
}

export const askPDF = (pdfText, question) =>
  API.post('/pdf/ask', { pdf_text: pdfText, question })

// HISTORY
export const saveHistory = (messages, metadata) =>
  API.post('/history/save', { messages, metadata })

export const loadHistory = () =>
  API.get('/history/load')

export const deleteHistory = (blobName) =>
  API.delete(`/history/delete/${blobName}`)
