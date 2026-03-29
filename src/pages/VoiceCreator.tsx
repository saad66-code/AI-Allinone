import { useState, useRef } from 'react';
import { 
  Mic, 
  Volume2, 
  Play, 
  Square, 
  Download, 
  Sparkles, 
  RefreshCw, 
  User,
  Settings2,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { GoogleGenAI, Modality } from "@google/genai";
import { cn, pcmToWav } from '../lib/utils';

interface VoiceItem {
  id: string;
  text: string;
  audioUrl: string;
  voice: string;
}

export default function VoiceCreator() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VoiceItem[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = pcmToWav(bytes);
        const audioUrl = URL.createObjectURL(blob);
        
        const newItem: VoiceItem = {
          id: Date.now().toString(),
          text,
          audioUrl,
          voice
        };
        setHistory(prev => [newItem, ...prev]);
        setText('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
          <Mic className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiVoiceCreator}</h3>
          <p className="text-zinc-500">{t.aiVoiceCreatorDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.voiceSelection}
            </label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    voice === v 
                      ? "border-violet-500 bg-violet-500/5 text-violet-500" 
                      : "border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span className="text-xs font-bold">{v}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.textToSpeech}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something to hear it in AI voice..."
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-violet-500 outline-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !text}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Volume2 className="h-5 w-5" />
                  {t.generateVoice}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">
            <MessageSquare className="h-4 w-4" />
            {t.voiceHistory}
          </div>
          
          <AnimatePresence mode="popLayout">
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-zinc-900 dark:text-white font-medium mb-1">{item.text}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.voice}
                          </span>
                          <span>•</span>
                          <span>{new Date(parseInt(item.id)).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const audio = new Audio(item.audioUrl);
                            audio.play();
                          }}
                          className="p-3 rounded-full bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white transition-all active:scale-90 shadow-sm"
                        >
                          <Play className="h-5 w-5 fill-current" />
                        </button>
                        <a
                          href={item.audioUrl}
                          download={`voice-${item.id}.wav`}
                          className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                        <button
                          onClick={() => setHistory(prev => prev.filter(h => h.id !== item.id))}
                          className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Volume2 className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">{t.noVoiceHistory}</p>
                <p className="text-sm">{t.describeVoice}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
