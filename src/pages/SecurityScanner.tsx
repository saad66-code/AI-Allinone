import { useState } from 'react';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  Code2, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent, parseJSON } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Type } from '@google/genai';

interface ScanResult {
  vulnerabilities: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    fix: string;
  }[];
  score: number;
  summary: string;
}

export default function SecurityScanner() {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Perform a security scan on this code:
        CODE:
        ${code}
        
        Focus on common vulnerabilities like SQL injection, XSS, insecure dependencies, etc.`,
        { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vulnerabilities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    fix: { type: Type.STRING }
                  },
                  required: ["severity", "title", "description", "fix"]
                }
              },
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING }
            },
            required: ["vulnerabilities", "score", "summary"]
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
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiSecurityScanner}</h3>
          <p className="text-zinc-500">{t.aiSecurityScannerDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              <Code2 className="h-4 w-4" />
              {t.codeToScan}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.scanPlaceholder}
              className="w-full h-96 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
            
            <button
              onClick={handleScan}
              disabled={loading || !code}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  {t.startSecurityScan}
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
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-red-500">
                      <ShieldAlert className="h-5 w-5" />
                      <h4 className="font-bold uppercase tracking-widest text-sm">{t.securityScore}</h4>
                    </div>
                    <div className={cn(
                      "text-3xl font-black",
                      result.score > 80 ? "text-emerald-500" : result.score > 50 ? "text-amber-500" : "text-red-500"
                    )}>
                      {result.score}/100
                    </div>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.summary}</p>
                </div>

                <div className="space-y-4">
                  {result.vulnerabilities.map((vuln, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "rounded-3xl border p-6 shadow-sm transition-all",
                        vuln.severity === 'critical' || vuln.severity === 'high' 
                          ? "bg-red-500/5 border-red-500/20" 
                          : "bg-amber-500/5 border-amber-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-zinc-900 dark:text-white">{vuln.title}</h5>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                          vuln.severity === 'critical' ? "bg-red-500 text-white" :
                          vuln.severity === 'high' ? "bg-orange-500 text-white" :
                          vuln.severity === 'medium' ? "bg-amber-500 text-white" : "bg-zinc-500 text-white"
                        )}>
                          {t[vuln.severity as keyof typeof t] || vuln.severity}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{vuln.description}</p>
                      <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                          <CheckCircle2 className="h-3 w-3" />
                          {t.fix}
                        </div>
                        <code className="text-xs text-zinc-300 font-mono">{vuln.fix}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                <Lock className="h-16 w-16 mb-4" />
                <p className="text-lg font-bold">{t.noVulnerabilities}</p>
                <p className="text-sm">{t.scanPlaceholder}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
