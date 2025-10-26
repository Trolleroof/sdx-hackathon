'use client';

import { useState, FormEvent } from 'react';
import { extractIntent, chat } from '@/lib/api';
import { Intent } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: Intent;
}

export default function ChatConsole() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Extract intent from the user's query
      const response = await extractIntent(currentInput);
      
      // Check if it's a no-trading-intent response
      if (response.noTradingIntent) {
        // Use general chat
        try {
          const chatResponse = await chat(currentInput);
          setMessages((prev) => [
            ...prev,
            { 
              role: 'assistant', 
              content: chatResponse
            },
          ]);
        } catch (chatError) {
          setMessages((prev) => [
            ...prev,
            { 
              role: 'assistant', 
              content: 'How can I help you with options trading today?'
            },
          ]);
        }
        return;
      }
      // We got a valid trading intent
      const intent = response;
      if (intent.ticker && intent.ticker.trim() !== '') {
        const intentSummary = formatIntentSummary(intent);
        setMessages((prev) => [
          ...prev,
          { 
            role: 'assistant', 
            content: intentSummary,
            intent 
          },
        ]);
      }
    } catch (error) {
      // If intent extraction failed because no ticker found, use general chat
      if (error instanceof Error && error.message.includes('ticker symbol')) {
        try {
          const chatResponse = await chat(currentInput);
          setMessages((prev) => [
            ...prev,
            { 
              role: 'assistant', 
              content: chatResponse
            },
          ]);
        } catch (chatError) {
          setMessages((prev) => [
            ...prev,
            { 
              role: 'assistant', 
              content: `I'm here to help with options trading! Try asking about a stock like:\n\n💡 Examples:\n• "Bullish on Tesla"\n• "Show me AAPL options strategy"\n• "Neutral strategy for MSFT"`
            },
          ]);
        }
      } else if (error instanceof Error && error.message === 'NO_INTENT') {
        // Try general chat
        try {
          const chatResponse = await chat(currentInput);
          setMessages((prev) => [
            ...prev,
            { 
              role: 'assistant', 
              content: chatResponse
            },
          ]);
        } catch (chatError) {
          setMessages((prev) => [
            ...prev,
            { 
              role: 'assistant', 
              content: 'How can I help you with options trading today?'
            },
          ]);
        }
      } else {
        // Other errors - show error message
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        setMessages((prev) => [
          ...prev,
          { 
            role: 'assistant', 
            content: `Error: ${errorMessage}`
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatIntentSummary = (intent: Intent): string => {
    const lines = [
      `Intent detected ✓`,
      ``,
      `Symbol: ${intent.ticker}`,
      `Outlook: ${getBiasEmoji(intent.bias)} ${intent.bias}`,
    ];

    if (intent.expiryISO) {
      const date = new Date(intent.expiryISO);
      lines.push(`Expiry: ${date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`);
    }

    if (intent.tenor) {
      lines.push(`Timeframe: ${intent.tenor}`);
    }

    lines.push(``);
    lines.push(`Ready to build your options strategy!`);

    return lines.join('\n');
  };

  const getBiasEmoji = (bias: string): string => {
    switch (bias) {
      case 'bullish': return '🐂';
      case 'bearish': return '🐻';
      case 'neutral': return '➡️';
      default: return '📊';
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">Options Strategy Builder</h2>
        <p className="text-xs text-zinc-500">Tell me what you're thinking</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-2 text-sm text-zinc-500">
            <p className="font-medium">Welcome! Try asking:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>"I'm bullish on AAPL for next month"</li>
              <li>"Show me a neutral strategy for MSFT"</li>
              <li>"Bearish TSLA options expiring November 2025"</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx}>
              <div
                role={msg.role}
                className={`rounded-lg p-3 text-sm ${
                  msg.role === 'user'
                    ? 'ml-auto max-w-[85%] bg-zinc-900 text-white'
                    : 'max-w-[90%] bg-zinc-50 text-zinc-900 border border-zinc-200'
                }`}
              >
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="max-w-[90%] rounded-lg bg-zinc-100 p-3 text-sm text-zinc-500">
            🔍 Analyzing your query...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your options strategy..."
            disabled={isLoading}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none ring-0 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
