import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Lightbulb, ShieldCheck } from 'lucide-react';

const SUGGESTIONS = [
  "Can my kids play outside in this AQI?",
  "How do I seal drafty wooden windows?",
  "What's the best DIY air filter setup?",
  "Does drinking warm water or milk help against smog?",
  "What is the difference between N95 and surgical masks?"
];

export default function AiChat({ currentAqi, location, apiKey }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **AeroShield AI**, your personal winter smog and clean air copilot. 

Right now in **${location}**, the AQI is approximately **${currentAqi}**. I can help you with:
- Tailoring daily family routines around morning and evening inversion peaks
- Sizing and building DIY Corsi-Rosenthal box purifiers
- Sealing your home against the "stack effect" without trapping indoor CO2
- Choosing clean transport and heating alternatives that reduce your community footprint

What questions do you have about protecting your family today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const userText = textToSend || input;
    if (!userText.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          location,
          currentAqi,
          apiKey
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, {
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please try asking again!'
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Failed to connect to the assistant server. Please check your network connection.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-lg overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow">
            <Bot className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AeroShield GenAI Copilot
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Online
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Science-backed advice for winter pollution defense & low-emission lifestyle
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 hidden sm:flex">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Location-aware ({location})</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line shadow ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 text-slate-400 text-xs rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <span>Formulating scientific recommendations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AeroShield about indoor air hacks, routine shifts, or alternatives..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="p-3 min-w-[44px] min-h-[44px] rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
