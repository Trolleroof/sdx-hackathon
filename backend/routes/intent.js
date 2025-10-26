// Intent extraction endpoint
import express from 'express';
import { extractIntent } from '../lib/llm.js';
import { IntentSchema } from '../types/index.js';
import { tenorToISO, isValidISO } from '../lib/dateUtils.js';

const router = express.Router();

/**
 * POST /api/intent
 * Extracts trading intent from natural language
 * 
 * Request body: { text: string }
 * Response: Intent object with ticker, bias, expiryISO
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const { text } = req.body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📥 [${timestamp}] INTENT REQUEST RECEIVED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 User input: "${text}"`);

    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      console.log(`❌ Invalid input: Text too short`);
      return res.status(400).json({
        error: {
          code: 'E_INVALID_INPUT',
          message: 'Text must be at least 2 characters'
        }
      });
    }

    console.log(`🤖 Calling Gemini API to extract intent...`);

    // Call LLM to extract intent
    const rawIntent = await extractIntent(text);
    console.log(`📦 Raw intent received:`, JSON.stringify(rawIntent, null, 2));
    
    // Check if rawIntent is valid
    if (!rawIntent || typeof rawIntent !== 'object') {
      throw new Error('NO_TRADING_INTENT');
    }
    
    // Get ticker safely
    const ticker = rawIntent.ticker || '';
    const bias = rawIntent.bias || 'neutral';
    
    // Check if we have a valid ticker
    if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
      throw new Error('NO_TRADING_INTENT');
    }
    
    // Validate bias
    if (!['bullish', 'bearish', 'neutral'].includes(bias)) {
      throw new Error('NO_TRADING_INTENT');
    }
    
    // Normalize expiry
    let expiryISO = rawIntent.expiryISO;
    
    // If tenor is provided but not expiryISO, convert it
    if (!expiryISO && rawIntent.tenor) {
      console.log(`🔧 Converting tenor "${rawIntent.tenor}" to ISO date`);
      expiryISO = tenorToISO(rawIntent.tenor);
      console.log(`   → Converted to: ${expiryISO}`);
    }
    
    // Build intent object - now safe because we validated ticker exists and is a string
    const intent = {
      ticker: ticker.toUpperCase().trim(),
      bias: bias,
      ...(expiryISO && { expiryISO }),
      ...(rawIntent.tenor && { tenor: rawIntent.tenor }),
    };

    // Validate with Zod
    console.log(`✔️  Validating intent structure...`);
    const validatedIntent = IntentSchema.parse(intent);

    const duration = Date.now() - startTime;
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ [${new Date().toISOString()}] INTENT EXTRACTION SUCCESS`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Extracted Intent:`, JSON.stringify(validatedIntent, null, 2));
    console.log(`${'='.repeat(60)}\n`);

    res.json(validatedIntent);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // If no trading intent found, return a 200 with a flag indicating general chat
    if (error.message === 'NO_TRADING_INTENT') {
      console.log(`${'='.repeat(60)}`);
      console.log(`💬 [${new Date().toISOString()}] NO TRADING INTENT - Use general chat`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`${'='.repeat(60)}\n`);
      
      return res.status(200).json({
        noTradingIntent: true,
        message: 'No trading intent detected'
      });
    }
    
    console.log(`${'='.repeat(60)}`);
    console.error(`❌ [${new Date().toISOString()}] INTENT EXTRACTION FAILED`);
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`💥 Error:`, error.message);
    if (error.stack) {
      console.error(`📚 Stack trace:`, error.stack);
    }
    console.log(`${'='.repeat(60)}\n`);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: {
          code: 'E_VALIDATION',
          message: 'Failed to validate intent',
          details: error.errors
        }
      });
    }

    // Handle other errors
    res.status(500).json({
      error: {
        code: 'E_EXTRACTION',
        message: error.message || 'Failed to extract intent from text'
      }
    });
  }
});

export default router;
