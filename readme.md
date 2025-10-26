# Gemini Chat Application

A simple chat interface connecting frontend to Google Gemini AI via Express backend.

## Architecture

```
Frontend (Next.js) → Backend (Express) → Gemini API
```

## Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```
GEMINI_API_KEY=AIzaSyA-l1An6m5CM3fFwh8kNUTMyfMyo1ntP_Q
```

Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
GEMINI_API_KEY=AIzaSyA-l1An6m5CM3fFwh8kNUTMyfMyo1ntP_Q
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Usage

1. Start the backend server first (port 3001)
2. Start the frontend server (port 3000)
3. Open http://localhost:3000 in your browser
4. Chat with Gemini!

## Project Structure

- `/backend` - Express server that calls Gemini API
- `/frontend` - Next.js chat interface
