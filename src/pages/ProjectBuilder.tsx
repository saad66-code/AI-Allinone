import { useState } from 'react';
import { 
  Layout, 
  Code2, 
  Rocket, 
  Palette, 
  DollarSign, 
  Download, 
  Sparkles,
  ArrowRight,
  Globe,
  Smartphone,
  Gamepad2,
  Play,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent, parseJSON } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Type } from '@google/genai';

interface ProjectResult {
  idea: string;
  ui: string;
  code: string;
  monetization: string;
}

export default function ProjectBuilder() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [type, setType] = useState<'website' | 'app' | 'game'>('website');
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [result, setResult] = useState<ProjectResult | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Generate a full, working single-file HTML project for a ${type} based on: ${prompt}. 
        - idea: A brief summary of the project vision.
        - ui: Description of the design language and user experience.
        - code: A COMPLETE, working HTML file containing all necessary CSS (use Tailwind via CDN: <script src="https://cdn.tailwindcss.com"></script>) and JavaScript. It MUST be ready to run in an iframe. Build the actual project from scratch, not just a structure or placeholder. Make it look distinctive, modern, and fully functional.
        - monetization: A brief plan for making money.`,
        { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              idea: {
                type: Type.STRING,
                description: "A brief summary of the project vision."
              },
              ui: {
                type: Type.STRING,
                description: "Description of the design language and user experience."
              },
              code: {
                type: Type.STRING,
                description: "A COMPLETE, working HTML file containing all necessary CSS and JavaScript."
              },
              monetization: {
                type: Type.STRING,
                description: "A brief plan for making money."
              }
            },
            required: ["idea", "ui", "code", "monetization"]
          }
        }
      );
      
      const data = parseJSON(response);
      setResult(data);
      setViewMode('preview');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt || !result) return;
    setEditLoading(true);
    try {
      const response = await generateAIContent(
        `Modify the following HTML project based on this request: ${editPrompt}.
        
        Current code:
        \`\`\`html
        ${result.code}
        \`\`\`
        
        Return the response in the same JSON format.
        - idea: A brief summary of the updated project vision.
        - ui: Description of the updated design language and user experience.
        - code: The COMPLETE, working HTML file containing all necessary CSS and JavaScript. It MUST be ready to run in an iframe.
        - monetization: A brief plan for making money.`,
        { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              idea: {
                type: Type.STRING,
                description: "A brief summary of the project vision."
              },
              ui: {
                type: Type.STRING,
                description: "Description of the design language and user experience."
              },
              code: {
                type: Type.STRING,
                description: "A COMPLETE, working HTML file containing all necessary CSS and JavaScript."
              },
              monetization: {
                type: Type.STRING,
                description: "A brief plan for making money."
              }
            },
            required: ["idea", "ui", "code", "monetization"]
          }
        }
      );
      
      const data = parseJSON(response);
      setResult(data);
      setEditPrompt('');
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <Rocket className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.projectBuilder}</h3>
          <p className="text-zinc-500">{t.projectBuilderDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              Project Type
            </label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { id: 'website', icon: Globe, label: 'Web' },
                { id: 'app', icon: Smartphone, label: 'App' },
                { id: 'game', icon: Gamepad2, label: 'Game' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setType(item.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                    type === item.id 
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-500" 
                      : "border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              Describe your vision
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A modern task management app with a dark mode, drag-and-drop, and a beautiful glassmorphism UI..."
              className="w-full h-40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <Sparkles className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Build Project
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-500 mb-4">
                    <Layout className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Idea & Vision</h4>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">{result.idea}</p>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-500 mb-4">
                    <Palette className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">UI/UX Design</h4>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">{result.ui}</p>
                </div>

                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-emerald-500/5 p-6 shadow-sm border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-2 text-emerald-500 mb-4">
                    <DollarSign className="h-5 w-5" />
                    <h4 className="font-bold uppercase tracking-widest text-sm">Monetization Plan</h4>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">{result.monetization}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2 flex flex-col min-h-[500px]">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
              >
                {/* Browser/Editor Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  
                  <div className="flex-1 flex justify-center mx-4">
                    <div className="bg-zinc-950/50 px-4 py-1.5 rounded-full text-xs text-zinc-400 font-mono flex items-center gap-2 border border-zinc-800/50">
                      <Globe className="w-3 h-3" />
                      localhost:3000
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-950/50 p-1 rounded-lg border border-zinc-800/50">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                        viewMode === 'preview' 
                          ? "bg-indigo-500 text-white shadow-sm" 
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <Play className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('code')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                        viewMode === 'code' 
                          ? "bg-indigo-500 text-white shadow-sm" 
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <Code2 className="w-3 h-3" />
                      Code
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 bg-white dark:bg-zinc-950">
                  {viewMode === 'preview' ? (
                    <iframe
                      srcDoc={result.code}
                      title="Project Preview"
                      className="absolute inset-0 w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  ) : (
                    <div className="absolute inset-0 overflow-auto bg-[#0d1117] p-6 custom-scrollbar">
                      <div className="flex justify-end mb-4 sticky top-0">
                        <button 
                          onClick={() => {
                            const blob = new Blob([result.code], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'project.html';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download HTML
                        </button>
                      </div>
                      <pre className="text-zinc-300 font-mono text-sm leading-relaxed">
                        <code>{result.code}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* Edit Area */}
                <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Ask AI to modify the project (e.g., 'Make the background dark', 'Add a score counter')..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEdit();
                        }
                      }}
                    />
                    <button
                      onClick={handleEdit}
                      disabled={editLoading || !editPrompt}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-colors"
                    >
                      {editLoading ? (
                        <Sparkles className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Update
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"
              >
                <Monitor className="h-20 w-20 mb-6 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xl font-bold mb-2">Live Preview Window</p>
                <p className="text-sm max-w-sm text-center">
                  Your generated project will appear here. You can test it interactively and view its source code.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
