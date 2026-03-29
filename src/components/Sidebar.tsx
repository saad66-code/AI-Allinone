import { useState, useEffect } from 'react';
import { Page, AppUser } from '../App';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Code, 
  Image as ImageIcon, 
  Lightbulb, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Sparkles,
  ChevronRight,
  BookOpen,
  Bookmark,
  Gamepad2,
  Search,
  History,
  Mic,
  FlaskConical,
  Bot,
  Shield,
  Languages,
  GraduationCap,
  Video
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Translations } from '../lib/i18n';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, id?: string) => void;
  user: AppUser;
  t: Translations;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: any;
}

export default function Sidebar({ currentPage, onNavigate, user, t }: SidebarProps) {
  const [history, setHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setHistory(sessions);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'chat', label: t.chat, icon: MessageSquare },
    { id: 'project-builder', label: t.projectBuilder, icon: Sparkles },
    { id: 'game', label: t.gameSandbox, icon: Gamepad2 },
    { id: 'debugger', label: t.debuggerPro, icon: Code },
    { id: 'business', label: t.businessBuilder, icon: Lightbulb },
    { id: 'trend-hunter', label: t.trendHunter, icon: TrendingUp },
    { id: 'designer', label: t.aiDesigner, icon: ImageIcon },
    { id: 'voice', label: t.aiVoiceCreator, icon: Mic },
    { id: 'lab', label: t.aiExperimentLab, icon: FlaskConical },
    { id: 'assistant', label: t.aiPersonalAssistant, icon: Bot },
    { id: 'security', label: t.aiSecurityScanner, icon: Shield },
    { id: 'translator', label: t.aiTranslatorPro, icon: Languages },
    { id: 'learning', label: t.aiLearningMode, icon: GraduationCap },
    { id: 'video', label: t.aiVideoGenerator, icon: Video },
    { id: 'search', label: t.deepSearch, icon: Search },
    { id: 'saved', label: t.savedItems, icon: Bookmark },
    { id: 'guide', label: t.promptGuide, icon: BookOpen },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{t.aiPlatform}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Page)}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              currentPage === item.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("h-5 w-5", currentPage === item.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100")} />
              {item.label}
            </div>
            {currentPage === item.id && <ChevronRight className="h-4 w-4" />}
          </button>
        ))}

        {/* Chat History Section */}
        {history.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <History className="h-3 w-3" />
              {t.history}
            </div>
            {history.map((session) => (
              <button
                key={session.id}
                onClick={() => onNavigate('chat', session.id)}
                className="group flex w-full flex-col items-start gap-1 rounded-xl px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <span className="text-xs font-bold truncate w-full">{session.title}</span>
                {session.lastMessage && (
                  <span className="text-[10px] text-zinc-500 truncate w-full">{session.lastMessage}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mb-4 flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profile" 
            className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate">{user.displayName}</span>
            <span className="text-xs text-zinc-500 truncate">{user.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
