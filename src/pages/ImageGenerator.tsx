import { useState } from 'react';
import { 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  Palette, 
  Layers, 
  Maximize2,
  Check,
  ArrowRight,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage } from '../lib/gemini';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { cn, compressImage } from '../lib/utils';
import { useLanguage } from '../App';
import { Translations } from '../lib/i18n';

export default function ImageGenerator() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const styles = [
    { id: 'realistic', label: t.realistic, icon: '📸' },
    { id: 'anime', label: t.anime, icon: '🎨' },
    { id: '3d', label: t.render3d, icon: '🧊' },
    { id: 'cinematic', label: t.cinematic, icon: '🎬' },
    { id: 'gaming', label: t.gaming, icon: '🎮' },
    { id: 'abstract', label: t.abstract, icon: '🌀' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const imageUrl = await generateImage(prompt, selectedStyle);
      setResult(imageUrl);
      setIsFavorite(false);

      // Compress image for Firestore storage (1MB limit)
      const compressedUrl = await compressImage(imageUrl, 1024, 0.6);

      if (auth.currentUser) {
        const docRef = await addDoc(collection(db, 'images'), {
          userId: auth.currentUser.uid,
          prompt,
          imageUrl: compressedUrl,
          style: selectedStyle,
          isFavorite: false,
          createdAt: serverTimestamp(),
        });
        setCurrentId(docRef.id);
      }
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentId) return;
    try {
      await updateDoc(doc(db, 'images', currentId), {
        isFavorite: !isFavorite
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `generated_image_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Settings Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 lg:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">{t.imageStudio}</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t.describeVision}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A futuristic city with neon lights and flying cars at sunset..."
                className="w-full h-32 resize-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:text-white transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t.chooseStyle}</label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all border",
                      selectedStyle === style.id
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-purple-500/50"
                    )}
                  >
                    <span>{style.icon}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:bg-purple-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  {t.generateImage}
                  <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Palette, label: t.highQuality },
              { icon: Layers, label: t.multiStyle },
              { icon: Zap, label: t.fastGen },
              { icon: Maximize2, label: t.hdResolution }
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <feat.icon className="h-5 w-5 text-purple-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative aspect-square w-full max-w-[600px] mx-auto overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-2xl group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <img 
                src={result} 
                alt="Generated" 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-4 transition-opacity"
              >
                <button 
                  onClick={toggleFavorite}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all active:scale-95",
                    isFavorite 
                      ? "bg-yellow-500 text-black hover:bg-yellow-400" 
                      : "bg-white text-black hover:bg-zinc-100"
                  )}
                >
                  <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
                  {isFavorite ? t.favorited : t.favorite}
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-black transition-all hover:bg-zinc-100 active:scale-95"
                >
                  <Download className="h-5 w-5" />
                  {t.download}
                </button>
                <button 
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 rounded-2xl bg-zinc-800/80 px-6 py-3 font-bold text-white transition-all hover:bg-zinc-700 active:scale-95"
                >
                  <RefreshCw className="h-5 w-5" />
                  {t.regenerate}
                </button>
              </motion.div>

              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
                <p className="text-sm font-medium line-clamp-2 italic">"{prompt}"</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-600 px-2 py-0.5 rounded-full">
                    {selectedStyle}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full min-h-[600px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 p-12 text-center"
            >
              <div className="h-24 w-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                <ImageIcon className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.createMasterpieces}</h3>
              <p className="text-zinc-500 max-w-sm">
                {t.imageGenDesc}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Cyberpunk City', 'Mystical Forest', 'Space Explorer', 'Vintage Portrait'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setPrompt(`A ${tag} with...`)}
                    className="px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold transition-all hover:border-purple-500 hover:text-purple-500"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce"></div>
            </div>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
              {t.paintingImagination}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
