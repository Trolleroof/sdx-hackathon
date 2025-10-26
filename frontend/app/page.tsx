'use client';

import { useState, FormEvent } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Failed to search. Please check your API key configuration.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 font-sans">
      <main className="flex w-full">
        {/* Left: Blank slate (75%) */}
        <section className="w-3/4 min-h-screen border-r border-zinc-200 bg-white p-6">
          <div className="flex h-full min-h-[calc(100vh-3rem)] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white/60 text-zinc-400">
            <span className="text-sm">Blank slate — start building</span>
          </div>
        </section>

        {/* Right: Chat panel (25%) */}
        <aside className="flex w-1/4 min-h-screen flex-col bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Gemini Chat</h2>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-xs text-zinc-500">Ask me anything...</div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-zinc-900 text-white'
                      : 'max-w-[90%] bg-zinc-100 text-zinc-900'
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="max-w-[90%] rounded-lg bg-zinc-100 p-3 text-sm text-zinc-500">
                Thinking...
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Chat with Gemini..."
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
        </aside>
      </main>
    </div>
  );
}
