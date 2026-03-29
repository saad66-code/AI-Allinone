import { useState } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Volume2, 
  Copy, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  MessageSquare,
  CheckCircle2,
  Trash2,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent } from '../lib/gemini';
import { cn } from '../lib/utils';

interface TranslationItem {
  id: string;
  source: string;
  target: string;
  from: string;
  to: string;
}

export default function TranslatorPro() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [from, setFrom] = useState('English');
  const [to, setTo] = useState('Arabic');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TranslationItem[]>([]);

  const handleTranslate = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Translate this text from ${from} to ${to}:
        TEXT:
        ${text}
        
        Return ONLY the translated text.`
      );
      
      const newItem: TranslationItem = {
        id: Date.now().toString(),
        source: text,
        target: response,
        from,
        to
      };
      setHistory(prev => [newItem, ...prev]);
      setText('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <Languages className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiTranslatorPro}</h3>
          <p className="text-zinc-500">{t.aiTranslatorProDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <select 
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {['English', 'Arabic', 'French', 'Spanish', 'German', 'Japanese', 'Chinese'].map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <button 
                  onClick={() => { setFrom(to); setTo(from); }}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </button>
                <select 
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {['English', 'Arabic', 'French', 'Spanish', 'German', 'Japanese', 'Chinese'].map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <Mic className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text to translate..."
              className="w-full h-64 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            
            <button
              onClick={handleTranslate}
              disabled={loading || !text}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Translate Now
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">
            <Globe className="h-4 w-4" />
            Recent Translations
          </div>
          
          <AnimatePresence mode="popLayout">
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          <span>{item.from}</span>
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>{item.to}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setHistory(prev => prev.filter(h => h.id !== item.id))}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-sm text-zinc-500 italic">{item.source}</p>
                        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                        <p className="text-lg font-bold text-zinc-900 dark:text-white leading-relaxed">{item.target}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Languages className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">No translations yet</p>
                <p className="text-sm">Enter text and click "Translate Now"</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
