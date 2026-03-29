import { Page, useLanguage } from '../App';
import { 
  MessageSquare, 
  Code, 
  Image as ImageIcon, 
  Lightbulb, 
  TrendingUp, 
  Zap, 
  Sparkles,
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Translations } from '../lib/i18n';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();
  const tools = [
    { 
      id: 'chat', 
      label: t.aiChatAssistant, 
      desc: t.aiChatAssistantDesc,
      icon: MessageSquare,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'project-builder', 
      label: t.projectBuilder, 
      desc: t.projectBuilderDesc,
      icon: Sparkles,
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    { 
      id: 'game', 
      label: t.gameSandbox, 
      desc: t.gameSandboxDesc,
      icon: Gamepad2,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    { 
      id: 'debugger', 
      label: t.debuggerPro, 
      desc: t.debuggerProDesc,
      icon: Code,
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    { 
      id: 'business', 
      label: t.businessBuilder, 
      desc: t.businessBuilderDesc,
      icon: Lightbulb,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'designer', 
      label: t.aiDesigner, 
      desc: t.aiDesignerDesc,
      icon: ImageIcon,
      color: 'bg-pink-500',
      gradient: 'from-pink-500 to-pink-600'
    },
    { 
      id: 'video', 
      label: t.aiVideoGenerator, 
      desc: t.aiVideoGeneratorDesc,
      icon: ImageIcon,
      color: 'bg-rose-500',
      gradient: 'from-rose-500 to-rose-600'
    },
    { 
      id: 'learning', 
      label: t.aiLearningMode, 
      desc: t.aiLearningModeDesc,
      icon: Code,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600'
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 lg:p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-400 border border-blue-500/20">
            <Zap className="h-4 w-4" />
            {t.poweredByGemini}
          </div>
          <h1 className="text-4xl font-extrabold lg:text-5xl leading-tight">
            {t.welcomeFuture} <span className="text-blue-500">{t.aiAssistance}</span>
          </h1>
          <p className="text-lg text-zinc-400">
            {t.heroDesc}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => onNavigate('chat')}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold transition-all hover:bg-blue-500 hover:scale-105 active:scale-95"
            >
              {t.startChatting}
              <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => onNavigate('trends')}
              className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-6 py-3 font-bold transition-all hover:bg-zinc-700 active:scale-95"
            >
              {t.viewTrends}
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="absolute -bottom-20 right-20 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl"></div>
        <Sparkles className="absolute right-12 top-12 h-24 w-24 text-blue-500/10" />
      </section>

      {/* Tools Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{t.aiTools}</h2>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 mx-6"></div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onNavigate(tool.id as Page)}
              className="group relative flex flex-col items-start gap-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 text-left transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:bg-zinc-900"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-lg shadow-blue-500/10 transition-transform group-hover:scale-110`}>
                <tool.icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{tool.label}</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-blue-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                {t.tryNow}
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Stats/Trends Preview */}
      <section className="grid grid-cols-1 gap-6">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{t.latestTrends}</h3>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {[
              { title: "AI in Healthcare", tag: "Medicine", growth: "+45%" },
              { title: "Generative Video Models", tag: "Creative", growth: "+120%" },
              { title: "LLM Optimization Techniques", tag: "Dev", growth: "+28%" }
            ].map((trend, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                    0{i+1}
                  </div>
                  <div>
                    <h4 className="font-bold">{trend.title}</h4>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">{trend.tag}</span>
                  </div>
                </div>
                <span className="text-emerald-500 font-bold">{trend.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
