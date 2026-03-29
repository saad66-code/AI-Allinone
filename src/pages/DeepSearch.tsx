import { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Code, 
  Image as ImageIcon, 
  Lightbulb, 
  ChevronRight,
  Sparkles,
  Filter,
  Calendar,
  ArrowRight,
  Loader2,
  SearchX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useLanguage } from '../App';

type SearchResult = {
  id: string;
  type: 'chat' | 'code' | 'image' | 'idea';
  title: string;
  content: string;
  createdAt: any;
  metadata?: any;
};

export default function DeepSearch({ onNavigate }: { onNavigate: (page: any, id?: string) => void }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'chat' | 'code' | 'image' | 'idea'>('all');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim() || !auth.currentUser) return;

    setIsSearching(true);
    const allResults: SearchResult[] = [];

    try {
      // Search Chats
      if (filter === 'all' || filter === 'chat') {
        const chatSnap = await getDocs(query(
          collection(db, 'chats', auth.currentUser.uid, 'messages'),
          limit(20)
        ));
        chatSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.content.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({
              id: doc.id,
              type: 'chat',
              title: 'Chat Message',
              content: data.content,
              createdAt: data.createdAt,
            });
          }
        });
      }

      // Search Code
      if (filter === 'all' || filter === 'code') {
        const codeSnap = await getDocs(query(
          collection(db, 'code'),
          where('userId', '==', auth.currentUser.uid),
          limit(20)
        ));
        codeSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || data.code.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({
              id: doc.id,
              type: 'code',
              title: data.language || 'Code Snippet',
              content: data.prompt,
              createdAt: data.createdAt,
              metadata: { language: data.language }
            });
          }
        });
      }

      // Search Images
      if (filter === 'all' || filter === 'image') {
        const imageSnap = await getDocs(query(
          collection(db, 'images'),
          where('userId', '==', auth.currentUser.uid),
          limit(20)
        ));
        imageSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.prompt.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({
              id: doc.id,
              type: 'image',
              title: 'Generated Image',
              content: data.prompt,
              createdAt: data.createdAt,
              metadata: { url: data.imageUrl }
            });
          }
        });
      }

      // Search Ideas
      if (filter === 'all' || filter === 'idea') {
        const ideaSnap = await getDocs(query(
          collection(db, 'ideas'),
          where('userId', '==', auth.currentUser.uid),
          limit(20)
        ));
        ideaSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.idea.toLowerCase().includes(searchTerm.toLowerCase()) || data.analysis.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({
              id: doc.id,
              type: 'idea',
              title: 'Idea Analysis',
              content: data.idea,
              createdAt: data.createdAt,
            });
          }
        });
      }

      // Sort by date
      allResults.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/40 mb-2">
          <Search className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-4xl font-black tracking-tight">{t.deepSearch}</h2>
        <p className="text-zinc-500 max-w-xl mx-auto">
          {t.deepSearchDesc}
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center gap-2 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchAnything}
                className="w-full bg-transparent border-none outline-none text-zinc-900 dark:text-white font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50 active:scale-95"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isSearching ? t.searching : t.search}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {[
            { id: 'all', label: t.allContent, icon: Filter },
            { id: 'chat', label: t.chat, icon: MessageSquare },
            { id: 'code', label: t.codeGenerator, icon: Code },
            { id: 'image', label: t.imageGenerator, icon: ImageIcon },
            { id: 'idea', label: t.ideaAnalyzer, icon: Lightbulb }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                filter === item.id 
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white" 
                  : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-500 animate-pulse" />
              </div>
              <p className="text-zinc-500 font-bold animate-pulse">{t.scanningData}</p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4"
            >
              {results.map((result, i) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onNavigate(result.type, result.id)}
                  className="group flex items-center gap-6 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-sm hover:shadow-xl"
                >
                  <div className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                    result.type === 'chat' ? "bg-blue-500/10 text-blue-500" :
                    result.type === 'code' ? "bg-emerald-500/10 text-emerald-500" :
                    result.type === 'image' ? "bg-purple-500/10 text-purple-500" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    {result.type === 'chat' && <MessageSquare className="h-6 w-6" />}
                    {result.type === 'code' && <Code className="h-6 w-6" />}
                    {result.type === 'image' && <ImageIcon className="h-6 w-6" />}
                    {result.type === 'idea' && <Lightbulb className="h-6 w-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{result.type}</span>
                      <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {result.createdAt?.toDate ? result.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold truncate group-hover:text-blue-500 transition-colors">{result.title}</h4>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{result.content}</p>
                  </div>

                  <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : searchTerm && !isSearching ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <SearchX className="h-10 w-10 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold">{t.noResultsFound}</h4>
                <p className="text-zinc-500 max-w-xs mx-auto">{t.tryDifferentKeywords}</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <Search className="h-20 w-20 mb-4" />
              <p className="font-bold">{t.enterSearchTerm}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
