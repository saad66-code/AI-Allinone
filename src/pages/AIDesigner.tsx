import { useState } from 'react';
import { 
  Palette, 
  Layout, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Maximize2,
  Layers,
  Monitor,
  Smartphone,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

export default function AIDesigner() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'logo' | 'ui' | 'banner' | 'icon'>('ui');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Generate a high-quality ${type} design for: ${prompt}. 
              Style: Modern, clean, professional, high-resolution.`,
            },
          ],
        },
      });

      const newImages: string[] = [];
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          newImages.push(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
      setImages(prev => [...newImages, ...prev].slice(0, 12));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500">
          <Palette className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiDesigner}</h3>
          <p className="text-zinc-500">{t.aiDesignerDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.designType}
            </label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { id: 'ui', icon: Layout, label: t.uiUx },
                { id: 'logo', icon: Palette, label: t.logo },
                { id: 'banner', icon: Monitor, label: t.banner },
                { id: 'icon', icon: Smartphone, label: t.appIcon }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setType(item.id as any)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    type === item.id 
                      ? "border-pink-500 bg-pink-500/5 text-pink-500" 
                      : "border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.designPrompt}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A minimalist dashboard for a crypto wallet with dark mode..."
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {t.generateDesign}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {images.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {images.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative aspect-video rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 overflow-hidden shadow-sm hover:shadow-xl transition-all"
                  >
                    <img
                      src={img}
                      alt={`Design ${i}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button 
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = img;
                          a.download = `design_${Date.now()}.png`;
                          a.click();
                        }}
                        className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const w = window.open('');
                          if (w) {
                            w.document.write(`<img src="${img}" style="max-width: 100%; height: auto;" />`);
                          }
                        }}
                        className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Palette className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">{t.noDesignsYet}</p>
                <p className="text-sm">{t.describeDesign}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
