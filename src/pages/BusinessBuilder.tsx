import { useState } from 'react';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Copy,
  Briefcase,
  Lightbulb,
  Palette,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent, parseJSON } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Type } from '@google/genai';

interface BusinessResult {
  idea: string;
  branding: {
    name: string;
    logo: string;
    slogan: string;
  };
  marketing: string;
  growth: string;
}

export default function BusinessBuilder() {
  const { t } = useLanguage();
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BusinessResult | null>(null);

  const handleGenerate = async () => {
    if (!industry) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Generate a full startup plan for the industry: ${industry}. 
        Idea should be a summary. Branding should describe the brand. Marketing should be a strategy. Growth should be a plan.`,
        { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              idea: {
                type: Type.STRING,
                description: "A summary of the business idea."
              },
              branding: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The name of the business."
                  },
                  logo: {
                    type: Type.STRING,
                    description: "A description of the logo."
                  },
                  slogan: {
                    type: Type.STRING,
                    description: "The business slogan."
                  }
                },
                required: ["name", "logo", "slogan"]
              },
              marketing: {
                type: Type.STRING,
                description: "The marketing strategy."
              },
              growth: {
                type: Type.STRING,
                description: "The growth plan."
              }
            },
            required: ["idea", "branding", "marketing", "growth"]
          }
        }
      );
      
      const data = parseJSON(response);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.businessBuilder}</h3>
          <p className="text-zinc-500">{t.businessBuilderDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              Industry or Niche
            </label>
            <textarea
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Sustainable fashion, AI-powered education, Pet tech..."
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !industry}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Build Startup Plan
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-500 mb-4">
                      <Lightbulb className="h-5 w-5" />
                      <h4 className="font-bold uppercase tracking-widest text-sm">Startup Idea</h4>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.idea}</p>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-500 mb-4">
                      <Palette className="h-5 w-5" />
                      <h4 className="font-bold uppercase tracking-widest text-sm">Branding</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{result.branding.name}</p>
                      <p className="text-sm italic text-zinc-500">{result.branding.slogan}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{result.branding.logo}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-500 mb-4">
                    <Megaphone className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Marketing Strategy</h4>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.marketing}</p>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-emerald-500/5 p-6 shadow-sm border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-2 text-emerald-500 mb-4">
                    <TrendingUp className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Growth Plan</h4>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.growth}</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Briefcase className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">Ready to launch your business?</p>
                <p className="text-sm">Enter an industry and click "Build Startup Plan"</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
