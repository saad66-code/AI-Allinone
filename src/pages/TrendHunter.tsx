import { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Globe, 
  Youtube, 
  Smartphone, 
  Zap, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent, parseJSON } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Type } from '@google/genai';

interface TrendItem {
  title: string;
  platform: string;
  description: string;
  url?: string;
}

export default function TrendHunter() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [category, setCategory] = useState<'all' | 'tech' | 'social' | 'apps'>('all');

  const handleFetchTrends = async () => {
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Fetch the latest trending ideas and content trends for ${category} category from the internet. 
        Focus on real-time data and popular topics on YouTube, TikTok, and App Stores.`,
        { 
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                platform: { type: Type.STRING },
                description: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["title", "platform", "description"]
            }
          }
        }
      );
      
      const data = parseJSON(response);
      setTrends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{t.trendHunter}</h3>
            <p className="text-zinc-500">{t.trendHunterDesc}</p>
          </div>
        </div>
        
        <button
          onClick={handleFetchTrends}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              {t.fetchLatestTrends}
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 w-fit">
        {[
          { id: 'all', label: t.allContent, icon: Globe },
          { id: 'tech', label: t.techAndAI, icon: Zap },
          { id: 'social', label: t.socialMedia, icon: Youtube },
          { id: 'apps', label: t.appsAndGames, icon: Smartphone }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              category === item.id 
                ? "bg-white dark:bg-zinc-900 text-orange-500 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {trends.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {trends.map((trend, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-xl hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                      <Hash className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      {trend.platform}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-2 group-hover:text-orange-500 transition-colors">{trend.title}</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed mb-6">{trend.description}</p>
                  
                  {trend.url && (
                    <a
                      href={trend.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:underline"
                    >
                      View Source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
              <TrendingUp className="h-16 w-16 mb-4" />
              <p className="text-lg font-bold">No trends fetched yet</p>
              <p className="text-sm">Click "Fetch Latest Trends" to see what's hot</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
