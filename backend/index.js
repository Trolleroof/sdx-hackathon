// Simple Gemini API test script
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Hello! Say hi back.' }] }]
    })
  });

  const data = await response.json();
  console.log(data.candidates[0].content.parts[0].text);
}

main().catch(console.error);
