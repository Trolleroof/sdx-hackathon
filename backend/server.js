import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Call Gemini API
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${error}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    res.json({ response: text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', apiKey: !!process.env.GEMINI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Gemini API key: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
});

