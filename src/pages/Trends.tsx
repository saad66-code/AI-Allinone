import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Globe, 
  Cpu, 
  Search, 
  ArrowUpRight,
  BarChart3,
  Layers,
  Shield,
  Loader2,
  RefreshCw,
  Languages,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fetchTrends } from '../lib/gemini';

const iconMap: Record<string, any> = {
  Zap,
  Sparkles,
  Globe,
  Cpu,
  Shield,
  Layers,
  Search,
  BarChart3,
  TrendingUp,
  Activity
};

const countries = [
  "Global", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "India", "Brazil", "Mexico", "Saudi Arabia", "United Arab Emirates", "Egypt", "Morocco", "Algeria", "Tunisia", "Jordan", "Lebanon", "Kuwait", "Qatar", "Oman", "Bahrain", "Turkey", "South Africa", "Nigeria", "Kenya", "Spain", "Italy", "Russia", "South Korea", "Indonesia", "Argentina", "Chile", "Colombia", "Peru"
];

const topLanguages = [
  "English", "Arabic", "Spanish", "French", "Chinese"
];

export default function Trends() {
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState("Global");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const loadTrends = async (country: string = selectedCountry, language: string = selectedLanguage) => {
    setIsLoading(true);
    try {
      const data = await fetchTrends(country, language);
      setTrends(data);
    } catch (error) {
      console.error("Error loading trends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrends(selectedCountry, selectedLanguage);
  }, [selectedCountry, selectedLanguage]);

  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-[40px] bg-zinc-950 p-10 lg:p-20 text-white border border-zinc-800 shadow-2xl">
        <div className="relative z-10 max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest"
          >
            <Activity className="h-4 w-4" />
            Live Pulse Engine
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
              PULSE<span className="text-blue-500">.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-zinc-400 font-medium max-w-2xl leading-relaxed">
              The world's most significant movements, decoded by AI. Real-time insights from across the globe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="pl-12 pr-10 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-zinc-700 transition-all min-w-[200px]"
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <Languages className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="pl-12 pr-10 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-zinc-700 transition-all min-w-[180px]"
              >
                {topLanguages.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => loadTrends()}
              disabled={isLoading}
              className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-white text-zinc-950 hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
            >
              <RefreshCw className={cn("h-6 w-6", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute right-20 bottom-20 h-64 w-64 rounded-full bg-purple-600/10 blur-[100px]"></div>
      </div>

      {/* Stats Grid - Minimal & Clean */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Trending Now", value: "250+", icon: TrendingUp },
          { label: "Global Coverage", value: "190+", icon: Globe },
          { label: "Search Volume", value: "8.5B+", icon: Search },
          { label: "Live Updates", value: "Real-time", icon: Zap }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
            <stat.icon className="h-5 w-5 text-blue-500 mb-4" />
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Trends Grid - Editorial Style */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 min-h-[400px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center justify-center py-32 space-y-6"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-500 animate-pulse" />
              </div>
              <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs">Synchronizing Global Pulse...</p>
            </motion.div>
          ) : (
            trends.map((trend, i) => {
              const Icon = iconMap[trend.iconName] || TrendingUp;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative flex flex-col justify-between rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 transition-all hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-500 font-black text-lg leading-none">{trend.growth}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Growth</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {trend.tag}
                      </span>
                      <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-blue-500 transition-colors">
                        {trend.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                        {trend.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                    <button 
                      onClick={() => window.open(trend.url, '_blank')}
                      className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors group/btn"
                    >
                      Explore
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                    </button>
                  </div>

                  {/* Subtle background number */}
                  <div className="absolute -right-4 -bottom-4 text-[120px] font-black text-zinc-100 dark:text-zinc-800/20 select-none pointer-events-none transition-all group-hover:text-blue-500/5 group-hover:-translate-y-4">
                    0{i + 1}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Immersive CTA */}
      <section className="relative rounded-[40px] bg-blue-600 p-12 lg:p-20 text-center text-white overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h3 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">STAY AHEAD OF THE CURVE.</h3>
          <p className="text-blue-100 text-lg font-medium">Join 50,000+ visionaries receiving the weekly Pulse report.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Email address" 
              className="flex-1 rounded-2xl bg-white/10 border-white/20 px-6 py-4 text-sm focus:ring-2 focus:ring-white outline-none placeholder:text-blue-200"
            />
            <button className="rounded-2xl bg-white px-8 py-4 font-black text-blue-600 transition-all hover:bg-blue-50 active:scale-95 shadow-xl">
              SUBSCRIBE
            </button>
          </div>
        </div>
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]"></div>
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-black/10 blur-[100px]"></div>
      </section>
    </div>
  );
}
