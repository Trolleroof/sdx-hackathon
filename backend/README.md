# Backend Server

Express server that connects to Google Gemini API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your API key in `.env`:
```
GEMINI_API_KEY=your_api_key_here
```

3. Run the server:
```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Endpoints

- `POST /api/chat` - Send a message to Gemini
- `GET /health` - Check if server and API key are configured

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

