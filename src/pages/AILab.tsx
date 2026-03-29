import { useState } from 'react';
import { 
  FlaskConical, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  Code2, 
  Cpu, 
  Brain,
  Microscope,
  Atom,
  Dna,
  Binary
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent } from '../lib/gemini';
import { cn } from '../lib/utils';

export default function AILab() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [experiment, setExperiment] = useState('creative');

  const handleExperiment = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Run an experimental AI analysis for: ${prompt}. 
        Experiment type: ${experiment}. 
        Be creative, unconventional, and push the boundaries of AI capabilities.`
      );
      setResult(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiExperimentLab}</h3>
          <p className="text-zinc-500">{t.aiExperimentLabDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.experimentType}
            </label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { id: 'creative', icon: Brain, label: t.creative },
                { id: 'technical', icon: Cpu, label: t.technical },
                { id: 'scientific', icon: Microscope, label: t.scientific },
                { id: 'future', icon: Atom, label: t.future }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setExperiment(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    experiment === item.id 
                      ? "border-amber-500 bg-amber-500/5 text-amber-500" 
                      : "border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {t.inputForAnalysis}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., How would AI evolve in a world without electricity?..."
              className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
            
            <button
              onClick={handleExperiment}
              disabled={loading || !prompt}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <FlaskConical className="h-5 w-5" />
                  {t.runExperiment}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Binary className="h-32 w-32" />
                </div>
                
                <div className="flex items-center gap-2 text-amber-400 mb-6">
                  <Terminal className="h-5 w-5" />
                  <h4 className="font-bold uppercase tracking-widest text-sm">Experimental Output</h4>
                </div>
                
                <div className="prose prose-invert max-w-none text-zinc-300 font-mono text-sm leading-relaxed">
                  {result.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line}</p>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <FlaskConical className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">{t.noExperimentResults}</p>
                <p className="text-sm">{t.describeExperiment}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
