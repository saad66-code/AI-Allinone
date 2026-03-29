import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Code, 
  Image as ImageIcon, 
  Star, 
  Trash2, 
  ExternalLink, 
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useLanguage } from '../App';
import { Translations } from '../lib/i18n';

type ItemType = 'chat' | 'code' | 'image';

interface SavedItem {
  id: string;
  type: ItemType;
  title?: string;
  prompt?: string;
  content?: string;
  imageUrl?: string;
  code?: string;
  language?: string;
  isFavorite: boolean;
  createdAt: any;
}

export default function SavedItems({ onNavigate }: { onNavigate: (page: any, id?: string) => void }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<ItemType | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const collections = ['chats', 'code', 'images'];
    const unsubscribes: (() => void)[] = [];

    collections.forEach(coll => {
      const q = query(
        collection(db, coll),
        where('userId', '==', auth.currentUser!.uid),
        orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const newItems = snapshot.docs.map(doc => ({
          id: doc.id,
          type: coll === 'chats' ? 'chat' : coll === 'code' ? 'code' : 'image',
          ...doc.data()
        })) as SavedItem[];

        setItems(prev => {
          const filtered = prev.filter(item => item.type !== (coll === 'chats' ? 'chat' : coll === 'code' ? 'code' : 'image'));
          return [...filtered, ...newItems].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        });
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, coll);
      });

      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const toggleFavorite = async (item: SavedItem) => {
    const coll = item.type === 'chat' ? 'chats' : item.type === 'code' ? 'code' : 'images';
    try {
      await updateDoc(doc(db, coll, item.id), {
        isFavorite: !item.isFavorite
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const deleteItem = async (item: SavedItem) => {
    const coll = item.type === 'chat' ? 'chats' : item.type === 'code' ? 'code' : 'images';
    try {
      await deleteDoc(doc(db, coll, item.id));
    } catch (error) {
      console.error('Delete item error:', error);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesFavorites = !showFavoritesOnly || item.isFavorite;
    const matchesSearch = (item.title || item.prompt || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesFavorites && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{t.savedItems}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">{t.savedItemsDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Search className="h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder={t.searchSavedItems} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-48"
            />
          </div>
          
          <button 
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border transition-all",
              showFavoritesOnly 
                ? "bg-amber-500/10 border-amber-500/50 text-amber-600" 
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
            )}
          >
            <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-amber-500")} />
            {t.favorites}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit">
        {[
          { id: 'all', label: t.allItems, icon: Filter },
          { id: 'chat', label: t.chat, icon: MessageSquare },
          { id: 'code', label: t.codeGenerator, icon: Code },
          { id: 'image', label: t.imageGenerator, icon: ImageIcon },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              filter === btn.id 
                ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <btn.icon className="h-4 w-4" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onNavigate(item.type, item.id)}
              className="group relative flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer"
            >
              {/* Image Preview */}
              {item.type === 'image' && item.imageUrl && (
                <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  <img 
                    src={item.imageUrl} 
                    alt={item.prompt} 
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    item.type === 'chat' ? "bg-blue-500/10 text-blue-500" :
                    item.type === 'code' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-purple-500/10 text-purple-500"
                  )}>
                    {item.type === 'chat' ? <MessageSquare className="h-4 w-4" /> :
                     item.type === 'code' ? <Code className="h-4 w-4" /> :
                     <ImageIcon className="h-4 w-4" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        item.isFavorite ? "text-amber-500 bg-amber-500/10" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <Star className={cn("h-4 w-4", item.isFavorite && "fill-amber-500")} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold line-clamp-1">{item.title || item.prompt}</h3>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">
                    {item.type === 'code' ? item.language : t[item.type as keyof Translations]} • {new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>

                {item.type === 'code' && item.code && (
                  <div className="p-3 rounded-xl bg-zinc-950 text-zinc-400 text-[10px] font-mono line-clamp-3">
                    {item.code}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  {item.type === 'code' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(item.code || '', item.id); }}
                      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                    >
                      {copiedId === item.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                  {item.type === 'image' && (
                    <a 
                      href={item.imageUrl} 
                      download 
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => onNavigate(item.type, item.id)}
                  className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline"
                >
                  {t.viewDetails}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
            <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-blue-500" />
            </div>
            <div>
              <h4 className="text-lg font-bold">{t.noItemsFound}</h4>
              <p className="text-sm">{t.adjustFilters}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
