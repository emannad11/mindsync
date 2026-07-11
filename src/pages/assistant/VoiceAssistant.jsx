import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, Sparkles, BrainCircuit,
  Trash2, Copy, RefreshCw, ChevronDown
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { chatWithAI } from '../../services/api';

// ─── Markdown-like renderer (bold, bullet points) ────────────────────────────
const RenderText = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        // Bold: **text**
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const isBullet = line.trim().startsWith('*') || line.trim().startsWith('-') || /^\d+\./.test(line.trim());
        return (
          <p
            key={i}
            className={`text-sm leading-relaxed ${isBullet ? 'pl-3 border-l-2 border-primary/30' : ''}`}
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^\s*[\*\-]\s*/, '') }}
          />
        );
      })}
    </div>
  );
};

// ─── Typing Indicator ────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const VoiceAssistant = () => {
  const { userData } = useUser();
  const { addNotification } = useNotifications();
  const firstName = userData?.name?.split(' ')[0] || 'there';

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hello ${firstName}! 👋 I'm **MindSync AI**, powered by Google Gemini.\n\nI know your schedule, goals, and productivity style. Ask me anything — task planning, focus tips, stress management, or just chat!`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // ── Scroll handling ────────────────────────────────────────────────────────
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isProcessing]);

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  // ── Voice recognition setup ────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      setInputText(current);
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  // ── Build chat history for Gemini ─────────────────────────────────────────
  const buildHistory = () => {
    return messages.slice(1).map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      text: m.text
    }));
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const trimmed = (text || inputText).trim();
    if (!trimmed || isProcessing) return;

    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setInputText('');
    setTranscript('');
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setIsProcessing(true);

    try {
      const history = buildHistory();
      const data = await chatWithAI(trimmed, history);
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not reach MindSync AI. Is the backend running?';
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `⚠️ **Error:** ${detail}`
      }]);
      addNotification('error', 'AI Error', detail);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Voice toggle ──────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      addNotification('error', 'Unsupported', 'Your browser does not support Voice Recognition.');
      return;
    }
    if (!isListening) {
      setInputText('');
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        addNotification('info', 'Microphone Active', 'Speak now — MindSync is listening...');
      } catch (e) { console.error(e); }
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
      if (inputText.trim()) handleSend(inputText);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      text: `Chat cleared! 🧹 How can I help you, ${firstName}?`
    }]);
  };

  // ─── Quick Prompts ────────────────────────────────────────────────────────
  const quickPrompts = [
    'Plan my day',
    'Help me focus',
    'I feel stressed',
    'Water intake tips',
    'Boost my productivity',
  ];

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BrainCircuit className="text-primary w-8 h-8" />
            MindSync Assistant
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Powered by Google Gemini · Personalized to your profile</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Gemini 2.5 Flash
          </div>
          <button
            onClick={clearChat}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-rose-400"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Chat + Orb Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ minHeight: '560px' }}>

        {/* ── Orb Panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass-card flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-secondary/5" />

          {/* Orb */}
          <div className="relative w-52 h-52 flex items-center justify-center mb-8">
            <AnimatePresence>
              {(isListening || isProcessing) && (
                <motion.div
                  key="ripple"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.6, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                scale: isListening ? [1, 1.08, 1] : isProcessing ? [1, 1.15, 0.95, 1.1, 1] : [1, 1.04, 1],
                rotate: isProcessing ? 360 : 0
              }}
              transition={{ duration: isProcessing ? 2 : 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`w-28 h-28 rounded-full shadow-[0_0_60px_rgba(99,102,241,0.5)] flex items-center justify-center relative z-10 cursor-pointer
                ${isListening
                  ? 'bg-gradient-to-tr from-rose-500 to-orange-400'
                  : 'bg-gradient-to-tr from-primary to-cyan-400'}`}
              onClick={toggleVoice}
            >
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                {isListening
                  ? <Mic className="w-10 h-10 text-white animate-pulse" />
                  : isProcessing
                    ? <RefreshCw className="w-9 h-9 text-white animate-spin" />
                    : <Sparkles className="w-10 h-10 text-white" />
                }
              </div>
            </motion.div>
          </div>

          {/* Voice status */}
          <AnimatePresence>
            {isListening && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-rose-400 text-sm font-medium animate-pulse mb-2"
              >
                🔴 Listening...
              </motion.p>
            )}
          </AnimatePresence>

          {transcript && (
            <p className="text-slate-300 text-sm text-center italic max-w-[180px] truncate">
              "{transcript}"
            </p>
          )}

          <button
            onClick={toggleVoice}
            className={`mt-6 px-6 py-2.5 rounded-full text-sm font-semibold transition-all relative z-10
              ${isListening
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30'}`}
          >
            {isListening ? '⏹ Stop' : '🎙 Speak'}
          </button>

          {/* Quick Prompts */}
          <div className="mt-8 w-full relative z-10">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 text-center">Quick Prompts</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-slate-400
                    hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chat Panel ────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 glass-card flex flex-col" style={{ height: '100%', minHeight: '560px' }}>
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 rounded-t-2xl">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Conversation
            </span>
            <span className="text-xs text-slate-500">{messages.length - 1} exchanges</span>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-5 space-y-5"
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-slate-800/80 border border-white/5 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'ai'
                    ? <RenderText text={msg.text} />
                    : <p className="text-sm leading-relaxed">{msg.text}</p>
                  }
                </div>
              </motion.div>
            ))}

            {isProcessing && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="absolute bottom-24 right-8 p-2 bg-primary rounded-full shadow-lg"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-white/5 rounded-b-2xl">
            <div className="flex items-end gap-3">
              <button
                onClick={toggleVoice}
                className={`p-3 rounded-xl flex-shrink-0 transition-all ${isListening
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-primary border border-white/10'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or use the mic... (Enter to send)"
                rows={1}
                className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm
                  text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-primary/50
                  focus:ring-1 focus:ring-primary/30 transition-all leading-relaxed"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isProcessing}
                className="p-3 bg-primary rounded-xl text-white flex-shrink-0 transition-all
                  hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed
                  shadow-lg shadow-primary/30 active:scale-95"
              >
                {isProcessing
                  ? <RefreshCw className="w-5 h-5 animate-spin" />
                  : <Send className="w-5 h-5" />
                }
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              MindSync AI can make mistakes. Your data stays private and is never stored by AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
