import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Gamepad2, 
  Terminal, 
  Code2, 
  Sparkles,
  AlertCircle,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../App';
import { generateAIContent } from '../lib/gemini';

export default function GameSandbox() {
  const { t } = useLanguage();
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      margin: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: #000; 
      color: #fff;
      font-family: sans-serif;
    }
    #game-canvas {
      border: 2px solid #333;
      background: #111;
    }
  </style>
</head>
<body>
  <canvas id="game-canvas" width="400" height="400"></canvas>
  <script>
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let dx = 2;
    let dy = -2;
    const radius = 10;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();

      if (x + dx > canvas.width - radius || x + dx < radius) {
        dx = -dx;
      }
      if (y + dy > canvas.height - radius || y + dy < radius) {
        dy = -dy;
      }

      x += dx;
      y += dy;
      
      requestAnimationFrame(draw);
    }
    
    draw();
  </script>
</body>
</html>`);

  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateGame = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `You are an expert game developer. The user wants to create or modify a web-based game.
        Current code (if any):
        \`\`\`html
        ${code}
        \`\`\`
        
        User request: ${prompt}
        
        Return ONLY the complete, working HTML code containing all necessary CSS and JavaScript. It MUST be ready to run in an iframe. Do not include markdown formatting like \`\`\`html, just the raw code.`
      );
      
      let newCode = response.trim();
      if (newCode.startsWith('\`\`\`html')) {
        newCode = newCode.replace(/^\`\`\`html\n/, '').replace(/\n\`\`\`$/, '');
      } else if (newCode.startsWith('\`\`\`')) {
        newCode = newCode.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }
      
      setCode(newCode);
      setPrompt('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const runCode = () => {
    setIsRunning(true);
    setLogs([]);
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        
        // Inject console log override
        const script = doc.createElement('script');
        script.textContent = `
          const oldLog = console.log;
          console.log = function(...args) {
            window.parent.postMessage({ type: 'log', content: args.join(' ') }, '*');
            oldLog.apply(console, args);
          };
          window.onerror = function(msg, url, line, col, error) {
            window.parent.postMessage({ type: 'error', content: msg + ' (line ' + line + ')' }, '*');
            return false;
          };
        `;
        doc.head.appendChild(script);
        doc.close();
      }
    }
  };

  const stopCode = () => {
    setIsRunning(false);
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write('');
        doc.close();
      }
    }
  };

  const resetCode = () => {
    stopCode();
    setLogs([]);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'log') {
        setLogs(prev => [...prev, `[LOG] ${event.data.content}`]);
      } else if (event.data.type === 'error') {
        setLogs(prev => [...prev, `[ERROR] ${event.data.content}`]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{t.gameSandbox}</h3>
            <p className="text-sm text-zinc-500">{t.gameSandboxDesc}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={isRunning ? stopCode : runCode}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all active:scale-95",
              isRunning 
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            )}
          >
            {isRunning ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            {isRunning ? t.stop : t.runGame}
          </button>
          <button
            onClick={resetCode}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
            title={t.reset}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Editor Section */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* AI Prompt Box */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-500">
              <Sparkles className="h-5 w-5" />
              <h4 className="font-bold uppercase tracking-widest text-xs">AI Game Assistant</h4>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a game to build or modifications to the current code..."
              className="w-full h-20 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
            <button
              onClick={handleGenerateGame}
              disabled={loading || !prompt}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate / Edit Game'}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">
            <Code2 className="h-4 w-4" />
            {t.gameCode}
          </div>
          <div className="flex-1 relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full p-6 bg-transparent text-zinc-300 font-mono text-sm resize-none outline-none"
            />
          </div>
        </div>

        {/* Preview & Console Section */}
        <div className="flex flex-col gap-6 min-h-0">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              {t.livePreview}
            </div>
            <div className="flex-1 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl relative">
              {!isRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/50 backdrop-blur-sm z-10">
                  <Play className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-bold">{t.clickRun}</p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                title="Game Preview"
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts"
              />
            </div>
          </div>

          <div className="h-48 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
              <Terminal className="h-4 w-4" />
              {t.errorConsole}
            </div>
            <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 font-mono text-xs overflow-y-auto shadow-inner">
              {logs.length === 0 ? (
                <p className="text-zinc-600 italic">{t.noLogs}</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex gap-2",
                        log.startsWith('[ERROR]') ? "text-red-400" : "text-zinc-400"
                      )}
                    >
                      {log.startsWith('[ERROR]') && <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />}
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
