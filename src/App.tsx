/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import CodeGenerator from './pages/CodeGenerator';
import ImageGenerator from './pages/ImageGenerator';
import IdeaAnalyzer from './pages/IdeaAnalyzer';
import Trends from './pages/Trends';
import Settings from './pages/Settings';
import PromptGuide from './pages/PromptGuide';
import SavedItems from './pages/SavedItems';
import GameSandbox from './pages/GameSandbox';
import DeepSearch from './pages/DeepSearch';
import ProjectBuilder from './pages/ProjectBuilder';
import AIDebugger from './pages/AIDebugger';
import BusinessBuilder from './pages/BusinessBuilder';
import TrendHunter from './pages/TrendHunter';
import AIDesigner from './pages/AIDesigner';
import VoiceCreator from './pages/VoiceCreator';
import AILab from './pages/AILab';
import PersonalAssistant from './pages/PersonalAssistant';
import SecurityScanner from './pages/SecurityScanner';
import TranslatorPro from './pages/TranslatorPro';
import LearningMode from './pages/LearningMode';
import VideoGenerator from './pages/VideoGenerator';
import { Language, translations, Translations } from './lib/i18n';

export type Page = 'dashboard' | 'chat' | 'code' | 'image' | 'idea' | 'trends' | 'settings' | 'guide' | 'saved' | 'game' | 'search' | 'project-builder' | 'debugger' | 'business' | 'trend-hunter' | 'designer' | 'voice' | 'lab' | 'assistant' | 'security' | 'translator' | 'learning' | 'video';

export interface AppUser extends User {
  photoURL: string | null;
  displayName: string | null;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language] || translations['en'];

  const refreshUser = async (currentUser: User) => {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        theme: 'dark',
        language: 'en',
        notificationsEnabled: true,
        createdAt: serverTimestamp(),
      });
      setUser(currentUser as AppUser);
    } else {
      const data = userSnap.data();
      if (data.theme) setTheme(data.theme);
      if (data.language) setLanguage(data.language as Language);
      
      // Merge Firestore data into user object for the UI
      setUser({
        ...currentUser,
        photoURL: data.photoURL || currentUser.photoURL,
        displayName: data.displayName || currentUser.displayName,
      } as AppUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await refreshUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-blue-500 border-zinc-800"></div>
          <p className="text-zinc-400 animate-pulse">Initializing AI Assistant...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    const handleNavigate = (page: Page, id?: string) => {
      setCurrentPage(page);
      if (page === 'chat') {
        setChatSessionId(id || null);
      }
    };

    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'chat': return <Chat sessionId={chatSessionId} onNavigate={handleNavigate} />;
      case 'code': return <CodeGenerator />;
      case 'image': return <ImageGenerator />;
      case 'idea': return <IdeaAnalyzer />;
      case 'trends': return <Trends />;
      case 'settings': return <Settings theme={theme} setTheme={setTheme} onRefreshUser={() => auth.currentUser && refreshUser(auth.currentUser)} />;
      case 'guide': return <PromptGuide />;
      case 'saved': return <SavedItems onNavigate={handleNavigate} />;
      case 'game': return <GameSandbox />;
      case 'search': return <DeepSearch onNavigate={handleNavigate} />;
      case 'project-builder': return <ProjectBuilder />;
      case 'debugger': return <AIDebugger />;
      case 'business': return <BusinessBuilder />;
      case 'trend-hunter': return <TrendHunter />;
      case 'designer': return <AIDesigner />;
      case 'voice': return <VoiceCreator />;
      case 'lab': return <AILab />;
      case 'assistant': return <PersonalAssistant />;
      case 'security': return <SecurityScanner />;
      case 'translator': return <TranslatorPro />;
      case 'learning': return <LearningMode />;
      case 'video': return <VideoGenerator />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Layout 
        currentPage={currentPage} 
        onNavigate={(page) => {
          setCurrentPage(page);
          setChatSessionId(null);
        }} 
        user={user}
        language={language}
        t={translations[language]}
      >
        {renderPage()}
      </Layout>
    </LanguageContext.Provider>
  );
}
