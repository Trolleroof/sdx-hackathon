import express from 'express';
import { fetchMarketData } from '../../utils/marketDataFetcher.js';

const router = express.Router();

// GET /api/data?ticker=AAPL
router.get('/', async (req, res) => {
  try {
    const { ticker } = req.query;
    
    if (!ticker) {
      return res.status(400).json({ 
        error: 'Ticker parameter is required',
        example: '/api/data?ticker=AAPL'
      });
    }

    // Fetch market data for the ticker
    const marketData = await fetchMarketData(ticker.toUpperCase());
    
    res.json({
      success: true,
      data: marketData
    });
    
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message 
    });
  }
});

// GET /api/data/multiple?tickers=AAPL,GOOGL,MSFT
router.get('/multiple', async (req, res) => {
  try {
    const { tickers } = req.query;
    
    if (!tickers) {
      return res.status(400).json({ 
        error: 'Tickers parameter is required',
        example: '/api/data/multiple?tickers=AAPL,GOOGL,MSFT'
      });
    }

    const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());
    const results = await Promise.allSettled(
      tickerList.map(ticker => fetchMarketData(ticker))
    );

    const marketData = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          ticker: tickerList[index],
          error: result.reason.message
        };
      }
    });
    
    res.json({
      success: true,
      data: marketData
    });
    
  } catch (error) {
    console.error('Error fetching multiple market data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message 
    });
  }
});

export default router;
