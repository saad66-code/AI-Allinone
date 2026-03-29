import { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Brain, 
  Target,
  CheckCircle2,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent, parseJSON } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Type } from '@google/genai';

interface LearningResult {
  roadmap: {
    step: string;
    title: string;
    description: string;
  }[];
  resources: string[];
  quiz: {
    question: string;
    options: string[];
    answer: string;
  }[];
}

export default function LearningMode() {
  const { t } = useLanguage();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LearningResult | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Generate a comprehensive learning roadmap for the topic: ${topic}. 
        Focus on clear, actionable steps and high-quality learning resources.`,
        { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["step", "title", "description"]
                }
              },
              resources: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "options", "answer"]
                }
              }
            },
            required: ["roadmap", "resources", "quiz"]
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiLearningMode}</h3>
          <p className="text-zinc-500">{t.aiLearningModeDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              What do you want to learn?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum Computing, React Native, Digital Marketing..."
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Roadmap
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
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-500 mb-6">
                    <Target className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Learning Roadmap</h4>
                  </div>
                  <div className="space-y-6">
                    {result.roadmap.map((step, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            {step.step}
                          </div>
                          {i < result.roadmap.length - 1 && (
                            <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-zinc-800" />
                          )}
                        </div>
                        <div className="pb-6">
                          <h5 className="font-bold text-zinc-900 dark:text-white mb-1">{step.title}</h5>
                          <p className="text-sm text-zinc-500 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-500 mb-4">
                      <BookOpen className="h-5 w-5" />
                      <h4 className="font-bold uppercase tracking-widest text-sm">Top Resources</h4>
                    </div>
                    <ul className="space-y-3">
                      {result.resources.map((res, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {res}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-emerald-500/5 p-6 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-2 text-emerald-500 mb-4">
                      <Trophy className="h-5 w-5" />
                      <h4 className="font-bold uppercase tracking-widest text-sm">Quick Quiz</h4>
                    </div>
                    <div className="space-y-4">
                      {result.quiz.slice(0, 1).map((q, i) => (
                        <div key={i}>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white mb-3">{q.question}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {q.options.map((opt, j) => (
                              <button key={j} className="text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs hover:border-emerald-500 transition-all">
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <GraduationCap className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">Ready to learn something new?</p>
                <p className="text-sm">Enter a topic and click "Generate Roadmap"</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
