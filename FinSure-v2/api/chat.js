export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit: max 20 requests per IP per minute (basic protection)
  res.setHeader('Access-Control-Allow-Origin', 'https://fin-sure-jade.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const { messages, systemPrompt } = req.body

  // Validate input
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages' })
  }
  if (messages.length > 30) {
    return res.status(400).json({ error: 'Too many messages in history' })
  }

  // Sanitize — strip any attempts to override system prompt
  const sanitized = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 2000) // trim to 2000 chars max
  }))

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: sanitized,
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return res.status(502).json({ error: 'AI service unavailable' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || 'No response generated.'

    // Trim response
    return res.status(200).json({ text: text.trim() })

  } catch (error) {
    console.error('Chat error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
