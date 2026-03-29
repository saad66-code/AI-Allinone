import { useState } from 'react';
import { 
  Code, 
  Copy, 
  Download, 
  Check, 
  Zap, 
  Play, 
  Terminal, 
  Cpu, 
  FileCode,
  Sparkles,
  ArrowRight,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateCode } from '../lib/gemini';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useLanguage } from '../App';

interface GeneratedCode {
  code: string;
  language: string;
  explanation: string;
}

export default function CodeGenerator() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCode | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const data = await generateCode(prompt);
      setResult(data);
      setIsFavorite(false);

      if (auth.currentUser) {
        const docRef = await addDoc(collection(db, 'code'), {
          userId: auth.currentUser.uid,
          prompt,
          code: data.code,
          language: data.language,
          explanation: data.explanation,
          isFavorite: false,
          createdAt: serverTimestamp(),
        });
        setCurrentId(docRef.id);
      }
    } catch (error) {
      console.error('Code generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentId) return;
    try {
      await updateDoc(doc(db, 'code', currentId), {
        isFavorite: !isFavorite
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_code.${result.language.toLowerCase() || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Input Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 lg:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">{t.codeGenerator}</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t.whatToBuild}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.describeVision}
                className="w-full h-48 resize-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:text-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  {t.generateCode}
                  <Zap className="h-5 w-5 group-hover:animate-pulse" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Terminal, label: t.allLanguages },
              { icon: Cpu, label: t.optimized },
              { icon: FileCode, label: t.readyToUse },
              { icon: Sparkles, label: t.aiPowered }
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <feat.icon className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-400 capitalize">{result.language}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleFavorite}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95",
                        isFavorite 
                          ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" 
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      )}
                    >
                      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                      {isFavorite ? t.favorited : t.favorite}
                    </button>
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-700 active:scale-95"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      {copied ? t.copied : t.copy}
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-700 active:scale-95"
                    >
                      <Download className="h-4 w-4" />
                      {t.download}
                    </button>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <SyntaxHighlighter
                    language={result.language.toLowerCase()}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '2rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      lineHeight: '1.6'
                    }}
                  >
                    {result.code}
                  </SyntaxHighlighter>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  {t.explanation}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {result.explanation.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
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
              <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <Code className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.readyToCode}</h3>
              <p className="text-zinc-500 max-w-sm">
                {t.codeGenDesc}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Python Script', 'React Component', 'SQL Query', 'HTML/CSS Page'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setPrompt(`Create a ${tag} for...`)}
                    className="px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold transition-all hover:border-emerald-500 hover:text-emerald-500"
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
