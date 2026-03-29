import { useState } from 'react';
import { 
  User, 
  Calendar, 
  Mail, 
  ListTodo, 
  Sparkles, 
  RefreshCw, 
  MessageSquare, 
  Bell,
  Clock,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../App';
import { generateAIContent } from '../lib/gemini';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  time: string;
}

export default function PersonalAssistant() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review project proposal', completed: false, time: '10:00 AM' },
    { id: '2', text: 'Meeting with design team', completed: true, time: '11:30 AM' }
  ]);

  const handleAsk = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await generateAIContent(
        `Act as a personal AI assistant. Help with: ${prompt}. 
        If it's a task, suggest adding it to the list. If it's a question, answer it concisely.`
      );
      
      // For now, just a simple response
      setPrompt('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{t.aiPersonalAssistant}</h3>
          <p className="text-zinc-500">{t.aiPersonalAssistantDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                <ListTodo className="h-4 w-4" />
                {t.todaysSchedule}
              </div>
              <button className="text-cyan-500 hover:text-cyan-600 font-bold text-sm flex items-center gap-1">
                <Plus className="h-4 w-4" />
                {t.addTask}
              </button>
            </div>
            
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    task.completed 
                      ? "bg-zinc-50 dark:bg-zinc-800/50 border-transparent opacity-60" 
                      : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-zinc-200 dark:border-zinc-700 hover:border-cyan-500"
                      )}
                    >
                      {task.completed && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <div>
                      <p className={cn("font-medium", task.completed && "line-through text-zinc-400")}>{task.text}</p>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {task.time}
                      </div>
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              <MessageSquare className="h-4 w-4" />
              {t.askAssistant}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.assistantPlaceholder}
                className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              />
              <button
                onClick={handleAsk}
                disabled={loading || !prompt}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold px-8 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">
              <Bell className="h-4 w-4" />
              Recent Notifications
            </div>
            <div className="space-y-4">
              {[
                { title: 'Meeting starting in 5m', desc: 'Design Review', time: 'Just now', color: 'bg-amber-500' },
                { title: 'New Email', desc: 'From: John Doe', time: '10m ago', color: 'bg-blue-500' },
                { title: 'Task Completed', desc: 'Review proposal', time: '1h ago', color: 'bg-emerald-500' }
              ].map((notif, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0", notif.color)} />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{notif.title}</p>
                    <p className="text-xs text-zinc-500">{notif.desc}</p>
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
