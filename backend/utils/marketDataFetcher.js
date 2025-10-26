import YahooFinance from 'yahoo-finance2';

// Suppress Yahoo Finance survey notice
YahooFinance.suppressNotices(['yahooSurvey']);

// Mock data for fallback
const MOCK_DATA = {
  'AAPL': { current_price: 175.43, volatility: 0.28, expiry: '2024-12-20' },
  'GOOGL': { current_price: 142.56, volatility: 0.32, expiry: '2024-12-20' },
  'MSFT': { current_price: 378.85, volatility: 0.25, expiry: '2024-12-20' },
  'TSLA': { current_price: 248.50, volatility: 0.45, expiry: '2024-12-20' },
  'AMZN': { current_price: 155.20, volatility: 0.30, expiry: '2024-12-20' },
  'NVDA': { current_price: 875.28, volatility: 0.40, expiry: '2024-12-20' },
  'META': { current_price: 485.20, volatility: 0.35, expiry: '2024-12-20' },
  'NFLX': { current_price: 612.77, volatility: 0.38, expiry: '2024-12-20' }
};

// Generate mock expiry dates (next 3 months)
function generateMockExpiry() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  const monthAfter = new Date(today.getFullYear(), today.getMonth() + 2, 15);
  const thirdMonth = new Date(today.getFullYear(), today.getMonth() + 3, 15);
  
  return [
    nextMonth.toISOString().split('T')[0],
    monthAfter.toISOString().split('T')[0],
    thirdMonth.toISOString().split('T')[0]
  ];
}

// Estimate volatility based on ticker and price (simplified approach)
function estimateVolatility(ticker, price) {
  // Known volatility estimates for major stocks (annualized)
  const volatilityMap = {
    'AAPL': 0.28,
    'GOOGL': 0.32,
    'MSFT': 0.25,
    'TSLA': 0.45,
    'AMZN': 0.30,
    'NVDA': 0.40,
    'META': 0.35,
    'NFLX': 0.38
  };
  
  // Return known volatility or estimate based on price range
  if (volatilityMap[ticker.toUpperCase()]) {
    return volatilityMap[ticker.toUpperCase()];
  }
  
  // Rough volatility estimate based on price (higher price = potentially higher volatility)
  if (price > 500) return 0.35;
  if (price > 200) return 0.30;
  if (price > 100) return 0.25;
  return 0.20;
}

// Fetch real market data from Yahoo Finance
async function fetchRealMarketData(ticker) {
  try {
    console.log(`Fetching real data for ${ticker}...`);
    
    // Create YahooFinance instance
    const yf = new YahooFinance();
    
    // Fetch current quote
    const quote = await yf.quote(ticker);
    
    const currentPrice = quote.regularMarketPrice || quote.price || 0;
    // For now, use a reasonable volatility estimate based on the stock
    // In a real implementation, you'd fetch historical data from another source
    const volatility = estimateVolatility(ticker, currentPrice);
    const expiries = generateMockExpiry();
    
    return {
      ticker: ticker.toUpperCase(),
      current_price: parseFloat(currentPrice.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(3)),
      expiry: expiries[0], // Primary expiry
      all_expiries: expiries,
      last_updated: new Date().toISOString(),
      source: 'yahoo_finance'
    };
    
  } catch (error) {
    console.error(`Error fetching real data for ${ticker}:`, error.message);
    throw new Error(`Failed to fetch data for ${ticker}: ${error.message}`);
  }
}

// Generate mock market data
function generateMockMarketData(ticker) {
  console.log(`Using mock data for ${ticker}...`);
  
  const mockData = MOCK_DATA[ticker.toUpperCase()];
  const expiries = generateMockExpiry();
  
  if (mockData) {
    return {
      ticker: ticker.toUpperCase(),
      current_price: mockData.current_price,
      volatility: mockData.volatility,
      expiry: mockData.expiry,
      all_expiries: expiries,
      last_updated: new Date().toISOString(),
      source: 'mock_data'
    };
  }
  
  // Generate random data for unknown tickers
  const basePrice = Math.random() * 500 + 50; // Random price between $50-$550
  const randomVolatility = Math.random() * 0.4 + 0.15; // Random volatility between 15%-55%
  
  return {
    ticker: ticker.toUpperCase(),
    current_price: parseFloat(basePrice.toFixed(2)),
    volatility: parseFloat(randomVolatility.toFixed(3)),
    expiry: expiries[0],
    all_expiries: expiries,
    last_updated: new Date().toISOString(),
    source: 'mock_data_generated'
  };
}

// Main function to fetch market data with fallback
export async function fetchMarketData(ticker) {
  try {
    // Try to fetch real data first
    return await fetchRealMarketData(ticker);
  } catch (error) {
    console.warn(`Real data fetch failed for ${ticker}, using mock data:`, error.message);
    
    // Fallback to mock data
    return generateMockMarketData(ticker);
  }
}

// Utility function to validate ticker format
export function validateTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return false;
  }
  
  // Basic validation: 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(ticker.toUpperCase());
}
