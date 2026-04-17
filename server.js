require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Health check route
app.get('/', (req, res) => {
  res.json({ status: 'PhenilRoopa backend is running!' });
});

// ✅ Chat route using Groq (free & fast)
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not set in Render environment variables' });
    }

    // Build messages array with history + new message
    const messages = [
      {
        role: 'system',
        content: 'You are PhenilRoopa, a helpful and friendly AI assistant. Answer clearly and helpfully.'
      }
    ];

    (history || []).forEach(msg => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: message });

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Groq API Error',
        details: data.error?.message || JSON.stringify(data)
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: 'No reply received', raw: data });
    }

    res.json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ PhenilRoopa backend running on port ${PORT}`));
