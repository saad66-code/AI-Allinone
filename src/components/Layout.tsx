import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Page, AppUser } from '../App';
import { Menu, X, Bell, Search, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, Translations } from '../lib/i18n';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: AppUser;
  language: Language;
  t: Translations;
}

export default function Layout({ children, currentPage, onNavigate, user, language, t }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} user={user} t={t} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: language === 'ar' ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? 300 : -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-50 w-72 lg:hidden`}
            >
              <Sidebar 
                currentPage={currentPage} 
                onNavigate={(p) => { onNavigate(p); setIsSidebarOpen(false); }} 
                user={user} 
                t={t}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 lg:hidden transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold capitalize lg:text-xl">
              {currentPage === 'dashboard' ? t.overview : t[currentPage as keyof Translations] || currentPage.replace(/([A-Z])/g, ' $1')}
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Search className="h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder={t.typeMessage}
                className="bg-transparent border-none focus:ring-0 text-sm w-32 lg:w-48"
              />
            </div>
            
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-950"></span>
            </button>

            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

            <button 
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="h-8 w-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                referrerPolicy="no-referrer"
              />
              <span className="hidden md:block text-sm font-medium pr-2">{user.displayName?.split(' ')[0]}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
