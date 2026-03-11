import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, X, Bot, User, Play, Pause } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface LiveAudioProps {
  onClose: () => void;
}

export const LiveAudio: React.FC<LiveAudioProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const getAI = () => {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API key missing");
    return new GoogleGenAI({ apiKey });
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = getAI();
      
      // Setup Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are VidiGenius Voice Assistant. You are having a real-time conversation with the user. Be helpful, concise, and friendly. You specialize in video creation advice.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
            setIsActive(true);
            setIsConnecting(false);
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const binary = atob(base64Audio);
              const bytes = new Int16Array(binary.length / 2);
              for (let i = 0; i < bytes.length; i++) {
                bytes[i] = (binary.charCodeAt(i * 2) & 0xFF) | (binary.charCodeAt(i * 2 + 1) << 8);
              }
              audioQueueRef.current.push(bytes);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }

            // Handle transcription
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscription(prev => [...prev, { role: 'model', text: message.serverContent!.modelTurn!.parts[0].text! }]);
            }
            
            // Handle user transcription
            const userText = (message as any).serverContent?.userTurn?.parts?.[0]?.text;
            if (userText) {
               setTranscription(prev => [...prev, { role: 'user', text: userText }]);
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => {
            console.log("Live session closed");
            stopSession();
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start live session:", error);
      setIsConnecting(false);
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert to PCM 16-bit
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = pcmData.buffer;
        const binary = String.fromCharCode(...new Uint8Array(buffer));
        const base64 = btoa(binary);
        
        sessionRef.current.sendRealtimeInput({
          media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    
    const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => playNextInQueue();
    source.start();
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[#151619] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Mic size={20} className="text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">VidiGenius Voice</h2>
              <p className="text-xs text-white/40">Real-time AI Conversation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-8">
          {/* Visualizer Placeholder */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0.1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
              )}
            </AnimatePresence>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
              isActive ? 'bg-emerald-500 shadow-2xl shadow-emerald-500/40' : 'bg-white/5'
            }`}>
              {isConnecting ? (
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
              ) : isActive ? (
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [10, 30, 10] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-1.5 bg-black rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <Mic size={48} className="text-white/20" />
              )}
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">
              {isConnecting ? 'Connecting...' : isActive ? 'Listening...' : 'Ready to Talk'}
            </h3>
            <p className="text-sm text-white/40 max-w-xs">
              {isActive 
                ? 'Speak naturally. I can hear you and respond in real-time.' 
                : 'Click the button below to start a voice conversation with VidiGenius AI.'}
            </p>
          </div>

          {/* Transcription Preview */}
          <div className="w-full bg-white/5 rounded-2xl p-4 h-32 overflow-y-auto scrollbar-hide flex flex-col gap-2">
            {transcription.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/10 italic text-xs">
                Transcription will appear here...
              </div>
            ) : (
              transcription.map((t, i) => (
                <div key={i} className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] max-w-[80%] ${
                    t.role === 'user' ? 'bg-emerald-500 text-black font-medium' : 'bg-white/10 text-white/60'
                  }`}>
                    {t.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              disabled={!isActive}
              className={`p-4 rounded-2xl transition-all ${
                isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/60 hover:text-white'
              } disabled:opacity-20`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <button 
              onClick={isActive ? stopSession : startSession}
              disabled={isConnecting}
              className={`px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                isActive 
                  ? 'bg-white text-black hover:bg-white/90' 
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20'
              }`}
            >
              {isActive ? (
                <>
                  <X size={18} />
                  End Session
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Conversation
                </>
              )}
            </button>

            <button 
              className="p-4 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all"
            >
              <Volume2 size={24} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
            Powered by Gemini 2.5 Native Audio
          </p>
        </div>
      </div>
    </motion.div>
  );
};
