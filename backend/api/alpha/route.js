import express from 'express';
import { getGlobalQuote, getIndicator } from '../../utils/alphaVantage.js';

const router = express.Router();

// Quick health check for Alpha Vantage key/rate limits
router.get('/health', async (req, res) => {
  try {
    await getGlobalQuote('IBM');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Price & Quotes
router.get('/quote', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'symbol is required' });
    const data = await getGlobalQuote(String(symbol));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function handleIndicator(req, res, functionName, defaults = {}) {
  try {
    const params = { ...defaults };
    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined && value !== null && value !== '') params[key] = value;
    }
    if (!params.symbol) return res.status(400).json({ error: 'symbol is required' });
    const data = await getIndicator(functionName, params);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Trend Analysis
router.get('/dema', (req, res) => handleIndicator(req, res, 'DEMA', { interval: 'daily', time_period: 20, series_type: 'close' }));
router.get('/tema', (req, res) => handleIndicator(req, res, 'TEMA', { interval: 'daily', time_period: 20, series_type: 'close' }));
router.get('/wma', (req, res) => handleIndicator(req, res, 'WMA', { interval: 'daily', time_period: 20, series_type: 'close' }));
router.get('/mama', (req, res) => handleIndicator(req, res, 'MAMA', { interval: 'daily', series_type: 'close' }));

// Momentum & Oscillators
router.get('/roc', (req, res) => handleIndicator(req, res, 'ROC', { interval: 'daily', time_period: 10, series_type: 'close' }));
router.get('/ppo', (req, res) => handleIndicator(req, res, 'PPO', { interval: 'daily', series_type: 'close' }));
router.get('/aroon', (req, res) => handleIndicator(req, res, 'AROON', { interval: 'daily', time_period: 14 }));
router.get('/ultosc', (req, res) => handleIndicator(req, res, 'ULTOSC', { interval: 'daily', time_period1: 7, time_period2: 14, time_period3: 28 }));
router.get('/mom', (req, res) => handleIndicator(req, res, 'MOM', { interval: 'daily', time_period: 10, series_type: 'close' }));

// Volatility & Strength
router.get('/bbands', (req, res) => handleIndicator(req, res, 'BBANDS', { interval: 'daily', time_period: 20, series_type: 'close' }));
router.get('/stddev', (req, res) => handleIndicator(req, res, 'STDDEV', { interval: 'daily', time_period: 10, series_type: 'close' }));

// Pattern & Others
router.get('/sar', (req, res) => handleIndicator(req, res, 'SAR', { interval: 'daily', series_type: 'close' }));
router.get('/cmo', (req, res) => handleIndicator(req, res, 'CMO', { interval: 'daily', time_period: 14, series_type: 'close' }));
router.get('/frama', (req, res) => handleIndicator(req, res, 'FRAMA', { interval: 'daily', time_period: 10, series_type: 'close' }));
router.get('/ht_phasor', (req, res) => handleIndicator(req, res, 'HT_PHASOR', { interval: 'daily', series_type: 'close' }));
router.get('/ht_sine', (req, res) => handleIndicator(req, res, 'HT_SINE', { interval: 'daily', series_type: 'close' }));

export default router;


