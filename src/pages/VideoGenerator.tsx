import { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Square, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Monitor, 
  Smartphone,
  Maximize2,
  Share2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

export default function VideoGenerator() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setStatus('Initializing AI model...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      setStatus('Generating video frames...');
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
        setStatus(`Processing... ${Math.floor(Math.random() * 100)}%`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const videoBlob = new Blob([blob], { type: 'video/mp4' });
        setVideoUrl(URL.createObjectURL(videoBlob));
      }
    } catch (error) {
      console.error(error);
      setStatus('Error generating video. Please try again.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <Video className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiVideoGenerator}</h3>
          <p className="text-zinc-500">{t.aiVideoGeneratorDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.aspectRatio}
            </label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { id: '16:9', icon: Monitor, label: t.landscape },
                { id: '9:16', icon: Smartphone, label: t.portrait }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAspectRatio(item.id as any)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    aspectRatio === item.id 
                      ? "border-rose-500 bg-rose-500/5 text-rose-500" 
                      : "border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.videoPrompt}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cinematic drone shot of a futuristic city with neon lights..."
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-rose-500 outline-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {t.generateVideo}
                </>
              )}
            </button>
            
            {status && (
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                <Clock className="h-3 w-3 animate-pulse" />
                {status}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {videoUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl relative group"
              >
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={videoUrl} 
                    download="generated-video.mp4"
                    className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                  <button className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Video className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">{t.noVideoGenerated}</p>
                <p className="text-sm">{t.describeScene}</p>
                <div className="mt-8 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 max-w-md text-center">
                  <div className="flex items-center gap-2 text-amber-500 mb-2 justify-center">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.note}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{t.videoGenTimeNote}</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
