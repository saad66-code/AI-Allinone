import { 
  BookOpen, 
  MessageSquare, 
  Code, 
  Image as ImageIcon, 
  Zap, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../App';
import { cn } from '../lib/utils';

export default function PromptGuide() {
  const { t } = useLanguage();

  const sections = [
    {
      title: t.aiChatAssistant,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      principles: [
        "Be specific about the persona (e.g., 'Act as a senior marketing expert').",
        "Provide context and constraints (e.g., 'Write a 200-word summary for a non-technical audience').",
        "Use step-by-step instructions for complex tasks."
      ],
      examples: [
        {
          label: "Creative Writing",
          prompt: "Write a short story about a robot discovering a forgotten garden in a post-apocalyptic city. Focus on sensory details and a hopeful tone."
        },
        {
          label: "Professional Email",
          prompt: "Draft a polite but firm email to a client explaining that their project deadline needs to be moved by one week due to unexpected technical challenges."
        }
      ]
    },
    {
      title: t.codeGenerator,
      icon: Code,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      principles: [
        "Specify the programming language and framework version.",
        "Describe the desired functionality in detail.",
        "Mention performance requirements or specific libraries to use."
      ],
      examples: [
        {
          label: "React Component",
          prompt: "Create a React functional component using Tailwind CSS for a 'User Profile Card' that includes an avatar, name, bio, and a 'Follow' button."
        },
        {
          label: "Python Script",
          prompt: "Write a Python script that reads a CSV file of sales data and generates a bar chart showing total sales per month using Matplotlib."
        }
      ]
    },
    {
      title: t.imageGenerator,
      icon: ImageIcon,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      principles: [
        "Use descriptive adjectives for lighting, mood, and style.",
        "Specify the camera angle or perspective (e.g., 'low angle', 'macro shot').",
        "Avoid negative prompts; focus on what you WANT to see."
      ],
      examples: [
        {
          label: "Cinematic Landscape",
          prompt: "A breathtaking cinematic landscape of a floating island with waterfalls, golden hour lighting, lush vegetation, hyper-realistic, 8k resolution."
        },
        {
          label: "Anime Character",
          prompt: "A futuristic anime girl with neon blue hair, wearing high-tech armor, standing in a rainy cyberpunk street, vibrant colors, detailed line art."
        }
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 lg:p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-400 border border-blue-500/20">
            <BookOpen className="h-4 w-4" />
            {t.masteringAI}
          </div>
          <h1 className="text-4xl font-extrabold lg:text-5xl leading-tight">
            {t.promptGuideTitle.split('Guide')[0]} <span className="text-blue-500">Guide</span>
          </h1>
          <p className="text-lg text-zinc-400">
            {t.promptGuideDesc}
          </p>
        </div>
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"></div>
        <Sparkles className="absolute right-12 top-12 h-24 w-24 text-blue-500/5" />
      </section>

      {/* Principles Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", section.bg, section.color)}>
                <section.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{section.title}</h3>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  {t.keyPrinciples}
                </h4>
                <ul className="space-y-3">
                  {section.principles.map((principle, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {principle}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  {t.examples}
                </h4>
                <div className="space-y-4">
                  {section.examples.map((example, j) => (
                    <div key={j} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{example.label}</span>
                      <p className="mt-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                        "{example.prompt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pro Tips */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 lg:p-12 shadow-xl">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-blue-500" />
          {t.proTipsTitle}
        </h3>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="font-bold text-lg">1. {t.chainOfThought}</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              {t.chainOfThoughtDesc}
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">2. {t.iterativeRefinement}</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              {t.iterativeRefinementDesc}
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">3. {t.fewShotPrompting}</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              {t.fewShotPromptingDesc}
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">4. {t.delimiters}</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              {t.delimitersDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
