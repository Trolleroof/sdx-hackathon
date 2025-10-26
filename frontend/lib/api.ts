// API client functions

const API_BASE = 'http://localhost:8000';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Extract trading intent from natural language
 */
export async function extractIntent(text: string) {
  const response = await fetch(`${API_BASE}/api/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to extract intent');
  }

  return data;
}

/**
 * General chat (legacy endpoint)
 */
export async function chat(message: string) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get response');
  }

  return data.response;
}
