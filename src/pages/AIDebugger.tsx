import { useState } from 'react';
import { 
  Terminal, 
  Bug, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  ArrowRight,
  RefreshCw,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent, parseJSON } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Type } from '@google/genai';

interface DebugResult {
  explanation: string;
  fix: string;
  optimizations: string;
}

export default function AIDebugger() {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);

  const handleDebug = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Debug this code:
        CODE:
        ${code}
        
        ERROR (optional):
        ${error}
        
        Explanation should be step-by-step. Fix should be the corrected code. Optimizations should be performance tips.`,
        { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: {
                type: Type.STRING,
                description: "Step-by-step explanation of the bug."
              },
              fix: {
                type: Type.STRING,
                description: "The corrected code."
              },
              optimizations: {
                type: Type.STRING,
                description: "Performance tips and optimizations."
              }
            },
            required: ["explanation", "fix", "optimizations"]
          }
        },
        'power'
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <Bug className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.debuggerPro}</h3>
          <p className="text-zinc-500">{t.debuggerProDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              <Code2 className="h-4 w-4" />
              Code to Debug
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your buggy code here..."
              className="w-full h-64 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
            
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
                <AlertCircle className="h-4 w-4" />
                Error Message (Optional)
              </div>
              <textarea
                value={error}
                onChange={(e) => setError(e.target.value)}
                placeholder="Paste the error message from console..."
                className="w-full h-24 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleDebug}
              disabled={loading || !code}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Analyze & Fix
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-red-500 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Step-by-Step Explanation</h4>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
                    {result.explanation.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <h4 className="font-bold uppercase tracking-widest text-sm">Fixed Code</h4>
                    </div>
                    <button className="text-zinc-500 hover:text-white transition-colors">
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                  <pre className="text-zinc-300 font-mono text-sm overflow-x-auto p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    {result.fix}
                  </pre>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-indigo-500/5 p-6 shadow-sm border-l-4 border-l-indigo-500">
                  <div className="flex items-center gap-2 text-indigo-500 mb-4">
                    <Sparkles className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Performance Optimizations</h4>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.optimizations}</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Bug className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">No bugs detected yet</p>
                <p className="text-sm">Paste your code and click "Analyze & Fix"</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
