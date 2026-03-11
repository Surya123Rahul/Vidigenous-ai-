import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2, Maximize2, Brain } from 'lucide-react';
import { startChat, deepThinkQuery } from '../services/geminiService';
import { GenerateContentResponse } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    try {
      const session = await startChat();
      setChatSession(session);
      setMessages([
        {
          role: 'model',
          text: "Hello! I'm VidiGenius AI. How can I help you with your video projects today?",
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  };

  const toggleChat = () => {
    if (!isOpen && !chatSession) {
      initChat();
    }
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = "";
      
      if (isDeepThink) {
        // Use deepThinkQuery for complex reasoning
        responseText = await deepThinkQuery(input);
      } else {
        const response: GenerateContentResponse = await chatSession.sendMessage({ message: input });
        responseText = response.text || "I'm sorry, I couldn't process that.";
      }

      const modelMessage: Message = {
        role: 'model',
        text: responseText || "I'm sorry, I couldn't process that.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I encountered an error. Please make sure you have selected an API key.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '500px',
              width: isMinimized ? '200px' : '380px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#151619] border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-4 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-emerald-500/10 border-bottom border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Bot size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">VidiGenius AI</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={toggleChat}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          msg.role === 'user' ? 'bg-white/10' : 'bg-emerald-500/20'
                        }`}>
                          {msg.role === 'user' ? <User size={12} className="text-white/60" /> : <Bot size={12} className="text-emerald-500" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-emerald-500 text-black font-medium rounded-tr-none' 
                            : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Bot size={12} className="text-emerald-500" />
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                          <Loader2 size={14} className="text-emerald-500 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white/5 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <button 
                      onClick={() => setIsDeepThink(!isDeepThink)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                        isDeepThink 
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                          : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent'
                      }`}
                    >
                      <Brain size={12} className={isDeepThink ? 'animate-pulse' : ''} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Deep Think</span>
                    </button>
                    {isDeepThink && (
                      <span className="text-[10px] text-emerald-500/60 font-medium italic">Gemini 3.1 Pro Active</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask VidiGenius anything..."
                      className="w-full bg-[#1A1B1E] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-black' : 'bg-emerald-500 text-black'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
};
