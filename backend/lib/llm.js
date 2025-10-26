// LLM helper functions using Gemini API
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment');
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

/**
 * Call Gemini API with a prompt
 * @param {string} prompt - The text prompt to send
 * @returns {Promise<string>} The response text
 */
export async function callGemini(prompt) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  return text;
}

/**
 * Call Gemini with structured output expecting JSON
 * @param {string} prompt - The prompt
 * @returns {Promise<object>} Parsed JSON response
 */
export async function callGeminiJSON(prompt) {
  const text = await callGemini(prompt);
  
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Extract intent from natural language query
 * @param {string} query - User's natural language query
 * @returns {Promise<Intent>} Extracted intent
 */
export async function extractIntent(query) {
  const prompt = `Extract trading intent from this query. Return ONLY valid JSON with no additional text.

Return a JSON object with these fields:
- ticker: The stock ticker symbol (e.g., "AAPL") - required
- bias: One of "bullish", "bearish", or "neutral" - required
- expiryISO: ISO date string if expiry date is mentioned (e.g., "2025-11-15") or omit this field
- tenor: The raw time expression if mentioned (e.g., "next month") or omit this field

Important: If the query doesn't contain a trading intent (e.g., greeting, no stock mentioned), return {"ticker":"","bias":"neutral"}

Examples:
Query: "I'm bullish on AAPL for next month"
Response: {"ticker":"AAPL","bias":"bullish","tenor":"next month"}

Query: "Show me a neutral strategy for MSFT expiring November 15, 2025"
Response: {"ticker":"MSFT","bias":"neutral","expiryISO":"2025-11-15"}

Query: "Bearish TSLA options"
Response: {"ticker":"TSLA","bias":"bearish"}

Now extract intent from this query:
"${query}"

Return ONLY the JSON object, no other text:`;

  return await callGeminiJSON(prompt);
}
