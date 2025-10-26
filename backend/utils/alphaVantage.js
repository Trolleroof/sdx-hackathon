import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://www.alphavantage.co/query';

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
}

export async function alphaVantageRequest(functionName, params = {}) {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_KEY not configured');
  }

  const queryString = buildQuery({
    function: functionName,
    ...params,
    apikey: apiKey
  });

  const url = `${BASE_URL}?${queryString}`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Alpha Vantage error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (data.Note) {
    // Rate limiting or usage notice from Alpha Vantage
    throw new Error(data.Note);
  }
  if (data.Information) {
    // Maintenance or informational message
    throw new Error(data.Information);
  }
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }

  return data;
}

export async function getGlobalQuote(symbol) {
  if (!symbol) throw new Error('symbol is required');
  return alphaVantageRequest('GLOBAL_QUOTE', { symbol });
}

export async function getIndicator(functionName, params = {}) {
  if (!functionName) throw new Error('functionName is required');
  return alphaVantageRequest(functionName, params);
}


