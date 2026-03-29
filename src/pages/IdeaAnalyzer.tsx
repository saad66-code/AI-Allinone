import { useState } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Target, 
  BarChart3, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeIdea } from '../lib/gemini';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useLanguage } from '../App';
import { Translations } from '../lib/i18n';

interface AnalysisResult {
  analysis: string;
  score: number;
  suggestions: string[];
}

export default function IdeaAnalyzer() {
  const { t } = useLanguage();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || loading) return;

    setLoading(true);
    try {
      const data = await analyzeIdea(idea);
      setResult(data);

      if (auth.currentUser) {
        await addDoc(collection(db, 'ideas'), {
          userId: auth.currentUser.uid,
          idea,
          analysis: data.analysis,
          score: data.score,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Idea analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Input Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 lg:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">{t.ideaAnalyzer}</h3>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t.pitchIdea}</label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., A mobile app that connects local farmers with city residents for fresh produce delivery..."
                className="w-full h-48 resize-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:text-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!idea.trim() || loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-600 px-6 py-4 font-bold text-white transition-all hover:bg-amber-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  {t.analyzeIdea}
                  <Target className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: BarChart3, label: t.marketFit },
              { icon: TrendingUp, label: t.growthPotential },
              { icon: AlertCircle, label: t.riskAnalysis },
              { icon: CheckCircle2, label: t.actionableSteps }
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <feat.icon className="h-5 w-5 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl flex flex-col items-center justify-center text-center">
                  <div className="relative h-32 w-32 mb-4">
                    <svg className="h-full w-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-zinc-100 dark:text-zinc-800"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * result.score) / 100}
                        className={cn(
                          "transition-all duration-1000 ease-out",
                          result.score > 70 ? "text-emerald-500" : result.score > 40 ? "text-amber-500" : "text-red-500"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold">{result.score}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.successScore}</span>
                    </div>
                  </div>
                  <h4 className="font-bold">
                    {result.score > 70 ? t.highPotential : result.score > 40 ? t.moderateRisk : t.highRisk}
                  </h4>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold">{t.aiVerdict}</h4>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                    "{result.analysis.slice(0, 150)}..."
                  </p>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl">
                <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  {t.detailedAnalysis}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {result.analysis}
                </div>
              </div>

              {/* Suggestions */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl">
                <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {t.improvementSuggestions}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {result.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <p className="text-sm font-medium">{suggestion}</p>
                    </div>
                  ))}
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
              <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                <Lightbulb className="h-12 w-12 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.validateVision}</h3>
              <p className="text-zinc-500 max-w-sm">
                {t.ideaAnalyzerDesc}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['SaaS Platform', 'Mobile App', 'YouTube Channel', 'E-commerce Store'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setIdea(`I want to build a ${tag} that...`)}
                    className="px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold transition-all hover:border-amber-500 hover:text-amber-500"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
