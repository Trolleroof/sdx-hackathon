import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import intentRouter from './routes/intent.js';

dotenv.config();

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔗 [${timestamp}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes
app.use('/api/intent', intentRouter);

// Chat endpoint (legacy - for general chat)
app.post('/api/chat', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`💬 [${timestamp}] General chat request`);
  
  try {
    const { message } = req.body;
    console.log(`📝 Message: "${message}"`);
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Create a friendly chat prompt
    const chatPrompt = `You are a friendly assistant for an options trading platform. The user might be chatting casually or asking trading questions. Be conversational and helpful.

User message: ${message}`;

    // Call Gemini API
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: chatPrompt }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${error}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    console.log(`✅ [${timestamp}] Chat response sent`);
    console.log(`📄 Response length: ${text.length} characters\n`);
    
    res.json({ response: text });
  } catch (error) {
    console.error(`❌ [${timestamp}] Chat error:`, error.message);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', apiKey: !!process.env.GEMINI_API_KEY, ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Gemini API key: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
});

