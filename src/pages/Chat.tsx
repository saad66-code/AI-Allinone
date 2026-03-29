import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Volume2, 
  Copy, 
  Trash2, 
  User as UserIcon, 
  Sparkles,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  MessageSquare,
  Star,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  RotateCcw,
  Code2,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateChatResponse, generateChatResponseStream, textToSpeech, analyzeFile, AIModelMode } from '../lib/gemini';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { cn, pcmToWav } from '../lib/utils';
import { useLanguage } from '../App';
import { Translations } from '../lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  type: 'text' | 'code' | 'image_analysis';
  createdAt: any;
  status?: 'sending' | 'sent' | 'error';
}

export default function Chat({ sessionId, onNavigate }: { sessionId?: string | null, onNavigate?: (page: any, id?: string) => void }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ data: string, name: string, type: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [modelMode, setModelMode] = useState<AIModelMode>('balanced');
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const currentSessionId = sessionId || auth.currentUser?.uid;

  useEffect(() => {
    if (!auth.currentUser || !currentSessionId) return;

    // Fetch user settings for model mode
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(snap => {
      if (snap.exists()) {
        setModelMode(snap.data().modelMode || 'balanced');
      }
    });

    // Ensure session document exists
    const sessionRef = doc(db, 'chats', currentSessionId);
    getDoc(sessionRef).then(async (snap) => {
      if (!snap.exists()) {
        await setDoc(sessionRef, {
          userId: auth.currentUser!.uid,
          title: 'Main Chat',
          isFavorite: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        setIsFavorite(snap.data().isFavorite || false);
      }

      // Start listener after session is confirmed
      const q = query(
        collection(db, 'chats', currentSessionId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(msgs);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `chats/${currentSessionId}/messages`);
      });

      unsubscribeRef.current = unsubscribe;
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleFavorite = async () => {
    if (!auth.currentUser || !currentSessionId) return;
    try {
      const sessionRef = doc(db, 'chats', currentSessionId);
      await updateDoc(sessionRef, {
        isFavorite: !isFavorite,
        updatedAt: serverTimestamp()
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  };

  const handleRegenerate = async () => {
    if (!auth.currentUser || !currentSessionId || loading) return;
    
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const lastMsg = messages[messages.length - 1];
    
    if (lastUserMsg) {
      if (lastMsg && lastMsg.role === 'model') {
        try {
          await deleteDoc(doc(db, 'chats', currentSessionId, 'messages', lastMsg.id));
        } catch (err) {
          console.error('Failed to delete last message for regeneration', err);
        }
      }
      handleSend(undefined, lastUserMsg.content);
    }
  };

  const handleSend = async (e?: React.FormEvent, retryText?: string) => {
    e?.preventDefault();
    const userMessage = retryText || input.trim();
    const currentFile = attachedFile;
    
    if ((!userMessage && !currentFile) || loading || !currentSessionId) return;

    setInput('');
    setAttachedFile(null);
    setLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      // Add user message to Firestore if not a retry
      if (!retryText) {
        await addDoc(collection(db, 'chats', currentSessionId, 'messages'), {
          sessionId: currentSessionId,
          userId: auth.currentUser!.uid,
          role: 'user',
          content: currentFile ? `[File: ${currentFile.name}] ${userMessage}` : userMessage,
          type: 'text',
          createdAt: serverTimestamp(),
        });

        // Update session last message
        await updateDoc(doc(db, 'chats', currentSessionId), {
          lastMessage: userMessage || `Sent a file: ${currentFile?.name}`,
          updatedAt: serverTimestamp()
        });
      }

      let aiResponse = '';
      if (currentFile) {
        const base64Data = currentFile.data.split(',')[1];
        aiResponse = await analyzeFile(base64Data, currentFile.type, userMessage || "Analyze this file.");
        
        await addDoc(collection(db, 'chats', currentSessionId, 'messages'), {
          sessionId: currentSessionId,
          userId: 'ai',
          role: 'model',
          content: aiResponse,
          type: 'text',
          createdAt: serverTimestamp(),
        });
      } else {
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

        // Use streaming for chat
        const stream = generateChatResponseStream(userMessage, history, modelMode);
        
        // Create a temporary message for streaming
        const tempId = 'temp-' + Date.now();
        setMessages(prev => [...prev, {
          id: tempId,
          role: 'model',
          content: '',
          type: 'text',
          createdAt: new Date(),
          status: 'sending'
        }]);

        for await (const chunk of stream) {
          aiResponse += chunk;
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: aiResponse } : m));
        }

        // Save final response to Firestore
        await addDoc(collection(db, 'chats', currentSessionId, 'messages'), {
          sessionId: currentSessionId,
          userId: 'ai',
          role: 'model',
          content: aiResponse,
          type: 'text',
          createdAt: serverTimestamp(),
        });
      }

      // Update session last message again
      await updateDoc(doc(db, 'chats', currentSessionId), {
        lastMessage: aiResponse.substring(0, 100),
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      console.error('Chat error:', err);
      setError(t.failedToGetResponse || 'Failed to get response');
    } finally {
      setLoading(false);
      setIsTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        data: event.target?.result as string,
        name: file.name,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = async (text: string, id: string) => {
    if (playingId === id) return;
    setPlayingId(id);
    try {
      const base64Audio = await textToSpeech(text.slice(0, 500)); // Limit for TTS
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = pcmToWav(bytes);
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(audioUrl);
        };
        audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setPlayingId(null);
    }
  };

  const clearChat = async () => {
    if (!auth.currentUser || !currentSessionId) return;
    const q = query(collection(db, 'chats', currentSessionId, 'messages'));
    messages.forEach(async (m) => {
      await deleteDoc(doc(db, 'chats', currentSessionId, 'messages', m.id));
    });
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSend(undefined, lastUserMsg.content);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          {sessionId && (
            <button
              onClick={() => onNavigate?.('chat')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95 mr-2"
              title={t.backToMainChat}
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">{sessionId ? t.savedSession : t.aiAssistant}</h3>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {t[modelMode as keyof Translations] || modelMode} {t.modeActive}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95",
              isFavorite 
                ? "bg-yellow-500/10 text-yellow-500" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
            title={isFavorite ? t.removeFromFavorites : t.addToFavorites}
          >
            <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </button>
          <button 
            onClick={clearChat}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-colors"
            title={t.clearChat}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scroll-smooth relative custom-scrollbar"
      >
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center space-y-8 opacity-80 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-3xl bg-blue-500/10 dark:bg-blue-500/5 flex items-center justify-center border border-blue-500/20">
                <Sparkles className="h-10 w-10 text-blue-500" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t.startConversation || 'How can I help you today?'}</h4>
                <p className="text-sm text-zinc-500">{t.askMeAnything || 'Ask me anything or pick a suggestion below.'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {[
                { icon: Code2, text: "Write a React component for a to-do list", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { icon: FileText, text: "Summarize the main points of quantum computing", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: Lightbulb, text: "Give me 5 creative ideas for a tech startup", color: "text-amber-500", bg: "bg-amber-500/10" },
                { icon: ImageIcon, text: "Describe a futuristic city for an image prompt", color: "text-purple-500", bg: "bg-purple-500/10" }
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, suggestion.text)}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-left group"
                >
                  <div className={cn("p-2 rounded-xl shrink-0 transition-colors", suggestion.bg, suggestion.color)}>
                    <suggestion.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-full gap-4",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 border-blue-500 text-white" 
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-blue-500"
            )}>
              {msg.role === 'user' ? <UserIcon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>

            <div className={cn(
              "group relative max-w-[85%] space-y-2 rounded-3xl p-5 shadow-sm",
              msg.role === 'user'
                ? "bg-blue-600 text-white rounded-tr-none"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none"
            )}>
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">

                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-xl !bg-zinc-950 !p-4 my-2"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={cn("bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-md font-mono text-xs", className)} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

              {msg.role === 'model' && msg.id.startsWith('temp-') === false && (
                <div className="flex items-center gap-1 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    title={t.copy || 'Copy'}
                  >
                    {copiedId === msg.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    className={cn(
                      "p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                      playingId === msg.id && "text-blue-500 animate-pulse bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                    )}
                    title={t.speak || 'Speak'}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  {index === messages.length - 1 && (
                    <button 
                      onClick={handleRegenerate}
                      className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white ml-auto"
                      title={t.regenerate || 'Regenerate'}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500 shadow-sm">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-4 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium flex-1">{error}</span>
            <button 
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              {t.retry}
            </button>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-8 p-3 rounded-full bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-500 transition-colors z-10"
          >
            <ArrowDown className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 lg:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 relative z-20">
        <form onSubmit={handleSend} className="relative flex flex-col gap-3 max-w-4xl mx-auto">
          <AnimatePresence>
            {attachedFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm w-fit"
              >
                {attachedFile.type.startsWith('image/') ? (
                  <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-blue-200 dark:border-blue-500/30">
                    <img src={attachedFile.data} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col pr-4 max-w-[200px]">
                  <span className="truncate font-bold">{attachedFile.name}</span>
                  <span className="text-xs opacity-70 uppercase tracking-widest">{attachedFile.type.split('/')[1] || 'File'}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-xl transition-colors ml-auto"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-end gap-3">
            <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t.typeMessage || 'Type a message...'}
                className="w-full resize-none bg-transparent px-5 py-4 pr-14 text-sm dark:text-white outline-none min-h-[56px] max-h-32 custom-scrollbar"
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  title={t.uploadFile || 'Upload File'}
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,application/pdf,text/plain"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || loading}
              className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6 ml-1" />}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          {t.aiMistakes || 'AI can make mistakes. Consider verifying important information.'}
        </p>
      </div>
    </div>
  );
}
