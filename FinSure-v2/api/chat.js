export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { messages, systemPrompt } = req.body
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Invalid messages' })

  const sanitized = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 2000)
  }))

  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return res.status(500).json({ 
      error: 'GROQ_API_KEY not set in Vercel environment variables' 
    })

    // Log first 8 chars to verify correct key is loaded
    console.log('Using key prefix:', apiKey.slice(0, 8))

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitized
        ],
        max_tokens: 600,
        temperature: 0.4,
      })
    })

    const responseText = await response.text()
    console.log('Groq status:', response.status)
    console.log('Groq response:', responseText.slice(0, 300))

    if (!response.ok) {
      return res.status(502).json({ 
        error: `Groq API error ${response.status}: ${responseText.slice(0, 200)}` 
      })
    }

    const data = JSON.parse(responseText)
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return res.status(502).json({ error: 'Empty response from Groq' })
    return res.status(200).json({ text })

  } catch (err) {
    console.error('Chat error:', err.message)
    return res.status(500).json({ error: `Server error: ${err.message}` })
  }
}
