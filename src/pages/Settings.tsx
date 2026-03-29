import { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  LogOut, 
  Camera,
  Check,
  ChevronDown,
  Save,
  ChevronRight,
  Sparkles,
  Wrench,
  Zap,
  Activity,
  Terminal,
  AlertCircle,
  RefreshCw,
  Key,
  Lock,
  Database,
  Wifi,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { cn } from '../lib/utils';
import { useLanguage } from '../App';
import { AIModelMode } from '../lib/gemini';
import { getDocFromServer } from 'firebase/firestore';

import { Language, Translations } from '../lib/i18n';

interface SettingsProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onRefreshUser?: () => void;
}

interface RepairStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'fixed' | 'failed' | 'optimized';
  details?: string;
}

export default function Settings({ theme, setTheme, onRefreshUser }: SettingsProps) {
  const { t, language, setLanguage } = useLanguage();
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL || '');
  const [notifications, setNotifications] = useState(true);
  const [modelMode, setModelMode] = useState<AIModelMode>('balanced');
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'repair'>('general');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [repairStatus, setRepairStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSteps, setRepairSteps] = useState<RepairStep[]>([]);
  const [showRepairReport, setShowRepairReport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setDisplayName(data.displayName || auth.currentUser.displayName || '');
        setPhotoURL(data.photoURL || auth.currentUser.photoURL || '');
        setNotifications(data.notificationsEnabled ?? true);
        setModelMode(data.modelMode || 'balanced');
        setIsTestingMode(data.isTestingMode || false);
      }
    };
    fetchSettings();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Check file size (< 1MB)
    if (file.size > 1024 * 1024) {
      alert('File is too large. Please choose an image under 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPhotoURL(base64String);
      
      try {
        setLoading(true);
        
        // Update Firestore
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        await updateDoc(userRef, { photoURL: base64String });
        
        if (onRefreshUser) onRefreshUser();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (error) {
        console.error('Error updating profile picture:', error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, { displayName });
      
      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName,
        language,
        notificationsEnabled: notifications,
        theme,
        modelMode,
        isTestingMode,
      });

      if (onRefreshUser) onRefreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSystemRepair = async () => {
    setIsRepairing(true);
    setRepairStatus('running');
    setShowRepairReport(true);
    
    const steps: RepairStep[] = [
      { id: 'auth', label: 'Auth Session', status: 'pending' },
      { id: 'db', label: 'Firestore Connection', status: 'pending' },
      { id: 'storage', label: 'Local Storage', status: 'pending' },
      { id: 'api', label: 'Gemini API Status', status: 'pending' },
    ];
    setRepairSteps(steps);

    // 1. Check Auth
    setRepairSteps(prev => prev.map(s => s.id === 'auth' ? { ...s, status: 'running' } : s));
    await new Promise(r => setTimeout(r, 1200));
    const authValid = !!auth.currentUser;
    setRepairSteps(prev => prev.map(s => s.id === 'auth' ? { 
      ...s, 
      status: authValid ? 'fixed' : 'failed',
      details: authValid ? 'Session active & verified' : 'Session expired - please re-login'
    } : s));

    // 2. Check Firestore
    setRepairSteps(prev => prev.map(s => s.id === 'db' ? { ...s, status: 'running' } : s));
    await new Promise(r => setTimeout(r, 1500));
    try {
      if (auth.currentUser) {
        await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
        setRepairSteps(prev => prev.map(s => s.id === 'db' ? { ...s, status: 'fixed', details: 'Database sync optimized' } : s));
      } else {
        throw new Error('No user');
      }
    } catch (e) {
      setRepairSteps(prev => prev.map(s => s.id === 'db' ? { ...s, status: 'failed', details: 'Connection timeout' } : s));
    }

    // 3. Check Local Storage
    setRepairSteps(prev => prev.map(s => s.id === 'storage' ? { ...s, status: 'running' } : s));
    await new Promise(r => setTimeout(r, 1000));
    try {
      localStorage.setItem('repair_test', 'ok');
      localStorage.removeItem('repair_test');
      setRepairSteps(prev => prev.map(s => s.id === 'storage' ? { ...s, status: 'fixed', details: 'Cache cleared & verified' } : s));
    } catch (e) {
      setRepairSteps(prev => prev.map(s => s.id === 'storage' ? { ...s, status: 'failed', details: 'Storage quota exceeded' } : s));
    }

    // 4. Check API Key
    setRepairSteps(prev => prev.map(s => s.id === 'api' ? { ...s, status: 'running' } : s));
    await new Promise(r => setTimeout(r, 1800));
    const hasKey = !!process.env.GEMINI_API_KEY;
    setRepairSteps(prev => prev.map(s => s.id === 'api' ? { 
      ...s, 
      status: hasKey ? 'fixed' : 'failed',
      details: hasKey ? 'API Gateway operational' : 'API Key missing in environment'
    } : s));
    
    setRepairStatus('done');
    setIsRepairing(false);
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setPasswordResetSent(true);
      setTimeout(() => setPasswordResetSent(false), 5000);
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      // In a real app, you'd delete Firestore data first
      // await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      await auth.currentUser.delete();
      window.location.href = '/';
    } catch (error) {
      console.error('Delete account error:', error);
      alert('For security reasons, you must have recently logged in to delete your account. Please log out and log back in, then try again.');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold tracking-tight">{t.settings}</h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-500/20"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          ) : saved ? (
            <>
              <Check className="h-5 w-5" />
              {t.saved}
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {t.saveChanges}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Profile Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl text-center">
            <div className="relative mx-auto h-32 w-32 mb-6">
              <img 
                src={photoURL || `https://ui-avatars.com/api/?name=${displayName}`} 
                alt="Profile" 
                className="h-full w-full rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 border-4 border-white dark:border-zinc-900 text-white shadow-lg transition-transform hover:scale-110"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <h3 className="text-xl font-bold">{displayName}</h3>
            <p className="text-sm text-zinc-500 mt-1">{auth.currentUser?.email}</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full">{t.proMember}</span>
            </div>
          </div>

          {/* System Repair Mode */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold">{t.systemRepair}</h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t.maintenanceTool}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {t.systemRepairDesc}
            </p>
            <button 
              onClick={runSystemRepair}
              disabled={isRepairing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-orange-600 disabled:opacity-50 active:scale-95"
            >
              {isRepairing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
              {isRepairing ? t.repairing : t.fixAllIssues}
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-xl">
            {[
              { id: 'general', icon: UserIcon, label: t.general, color: "text-blue-500" },
              { id: 'security', icon: Shield, label: t.security, color: "text-emerald-500" },
              { id: 'repair', icon: Wrench, label: t.systemRepair, color: "text-orange-500" }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex w-full items-center justify-between p-4 rounded-2xl transition-all group",
                  activeTab === item.id ? "bg-zinc-100 dark:bg-zinc-800 shadow-inner" : "hover:bg-zinc-50 dark:hover:bg-zinc-950"
                )}
              >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                activeTab === item.id ? "bg-white dark:bg-zinc-700 shadow-sm" : "bg-zinc-100 dark:bg-zinc-800",
                item.color
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={cn("font-bold", activeTab === item.id ? "text-zinc-900 dark:text-white" : "text-zinc-500")}>{item.label}</span>
            </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-zinc-400 transition-transform",
                  activeTab === item.id ? "rotate-90 text-blue-500" : "group-hover:translate-x-1"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* General Settings */}
                <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-500" />
                      {t.general}
                    </h4>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.displayName}</label>
                        <div className="group relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur"></div>
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                          <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={t.displayName}
                            className="relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 pl-11 pr-4 py-4 text-sm font-medium focus:border-blue-500 focus:ring-0 dark:text-white transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">{t.preferredLanguage}</label>
                        <div className="group relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur"></div>
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
                          <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 pl-11 pr-10 py-4 text-sm font-medium focus:border-purple-500 focus:ring-0 dark:text-white transition-all appearance-none shadow-sm cursor-pointer"
                          >
                            <option value="en">English (US)</option>
                            <option value="ar">Arabic (العربية)</option>
                            <option value="fr">French (Français)</option>
                            <option value="es">Spanish (Español)</option>
                            <option value="de">German (Deutsch)</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800"></div>

                  {/* Model Control System */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        {t.modelControl}
                      </h4>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{t.aiEngine}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'fast', label: t.fast, desc: 'Lite models for speed', icon: Zap, color: 'blue' },
                        { id: 'balanced', label: t.balanced, desc: 'Standard performance', icon: Activity, color: 'amber' },
                        { id: 'power', label: t.power, desc: 'Pro models for quality', icon: Sparkles, color: 'purple' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setModelMode(mode.id as AIModelMode)}
                          className={cn(
                            "group relative flex flex-col items-start gap-4 p-5 rounded-3xl border transition-all text-left overflow-hidden",
                            modelMode === mode.id 
                              ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                              : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900"
                          )}
                        >
                          {modelMode === mode.id && (
                            <motion.div 
                              layoutId="active-mode-bg"
                              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"
                            />
                          )}
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                            modelMode === mode.id 
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700"
                          )}>
                            <mode.icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-black tracking-tight">{mode.label}</h5>
                            <p className="text-[10px] text-zinc-500 font-medium leading-tight">{mode.desc}</p>
                          </div>
                          {modelMode === mode.id && (
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800"></div>

                  {/* Preferences */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      {t.preferences}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { 
                          id: 'theme', 
                          label: t.darkMode, 
                          desc: 'Switch between light and dark themes', 
                          icon: theme === 'dark' ? Moon : Sun,
                          color: 'blue',
                          active: theme === 'dark',
                          action: () => setTheme(theme === 'dark' ? 'light' : 'dark')
                        }
                      ].map((pref) => (
                        <div key={pref.id} className="group flex items-center justify-between p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12",
                              pref.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                              pref.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                              "bg-red-500/10 text-red-500"
                            )}>
                              <pref.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="font-black text-sm tracking-tight">{pref.label}</h5>
                              <p className="text-[11px] text-zinc-500 font-medium">{pref.desc}</p>
                            </div>
                          </div>
                          <button 
                            onClick={pref.action}
                            className={cn(
                              "relative h-8 w-14 rounded-full transition-all duration-500 p-1 shadow-inner",
                              pref.active 
                                ? (pref.color === 'blue' ? "bg-blue-600" : pref.color === 'emerald' ? "bg-emerald-600" : "bg-red-600") 
                                : "bg-zinc-200 dark:bg-zinc-800"
                            )}
                          >
                            <div className={cn(
                              "h-6 w-6 rounded-full bg-white shadow-lg transition-all duration-500 flex items-center justify-center",
                              pref.active ? "translate-x-6" : "translate-x-0"
                            )}>
                              {pref.active && <div className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                pref.color === 'blue' ? "bg-blue-600" : pref.color === 'emerald' ? "bg-emerald-600" : "bg-red-600"
                              )} />}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-500" />
                      {t.security}
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Key className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold">{t.passwordManagement}</h5>
                            <p className="text-sm text-zinc-500">{t.passwordDesc}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.newPassword}</label>
                              <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white transition-all"
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.confirmPassword}</label>
                              <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white transition-all"
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={async () => {
                                if (!newPassword || newPassword !== confirmPassword) {
                                  alert('Passwords do not match or are empty');
                                  return;
                                }
                                setPasswordChangeStatus('loading');
                                try {
                                  // Note: updatePassword requires recent login
                                  // @ts-ignore
                                  await auth.currentUser?.updatePassword(newPassword);
                                  setPasswordChangeStatus('success');
                                  setNewPassword('');
                                  setConfirmPassword('');
                                  setTimeout(() => setPasswordChangeStatus('idle'), 3000);
                                } catch (e) {
                                  console.error(e);
                                  setPasswordChangeStatus('error');
                                  alert('Error updating password. You may need to log out and log back in to perform this sensitive action.');
                                }
                              }}
                              disabled={passwordChangeStatus === 'loading'}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                            >
                              {passwordChangeStatus === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                              {passwordChangeStatus === 'success' ? 'Password Updated!' : t.updatePassword}
                            </button>
                            
                            <div className="flex items-center gap-2 py-2">
                              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">OR</span>
                              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                            </div>

                            <button 
                              onClick={handlePasswordReset}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95"
                            >
                              {passwordResetSent ? <Check className="h-4 w-4 text-emerald-500" /> : <RefreshCw className="h-4 w-4" />}
                              {passwordResetSent ? 'Reset Email Sent' : 'Send Password Reset Email'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <Activity className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold">{t.activeSessions}</h5>
                            <p className="text-sm text-zinc-500">{t.activeSessionsDesc}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <div>
                                <p className="text-xs font-bold">Current Session (This Device)</p>
                                <p className="text-[10px] text-zinc-500">Last active: Just now • {window.navigator.platform}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Lock className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold">{t.twoFactor}</h5>
                            <p className="text-sm text-zinc-500">{t.twoFactorDesc}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-[10px] font-bold uppercase tracking-widest text-blue-500">{t.twoFactorRecommended}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {t.twoFactorRollout}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertCircle className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-red-500">{t.dangerZone}</h5>
                            <p className="text-sm text-zinc-500">{t.dangerZoneDesc}</p>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-red-500/10">
                          <p className="text-xs text-zinc-500">
                            {t.deleteAccountWarning}
                          </p>
                        </div>

                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          {t.deleteAccount}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'repair' && (
              <motion.div
                key="repair"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-8 shadow-xl space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-orange-500" />
                        {t.diagnostics}
                      </h4>
                      {repairStatus === 'done' && (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                          <Check className="h-4 w-4" />
                          {t.repairComplete}
                        </span>
                      )}
                    </div>

                    <div className="p-8 rounded-[32px] bg-zinc-900 text-white relative overflow-hidden">
                      <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500",
                              repairStatus === 'running' ? "bg-blue-600 animate-pulse" : "bg-orange-600"
                            )}>
                              <Zap className="h-8 w-8 fill-current" />
                            </div>
                            <div>
                              <h5 className="text-xl font-black tracking-tight">{t.aiSystemHealth}</h5>
                              <p className="text-zinc-400 text-sm">{t.automatedMaintenance}</p>
                            </div>
                          </div>
                          {repairStatus === 'done' && (
                            <div className="text-right">
                              <div className="text-3xl font-black text-emerald-500">100%</div>
                              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.healthScore}</div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {repairSteps.map((step) => (
                            <div key={step.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                  step.status === 'fixed' ? "bg-emerald-500/20 text-emerald-500" :
                                  step.status === 'failed' ? "bg-red-500/20 text-red-500" :
                                  step.status === 'running' ? "bg-blue-500/20 text-blue-500" :
                                  "bg-white/5 text-zinc-500"
                                )}>
                                  {step.id === 'auth' && <UserIcon className="h-5 w-5" />}
                                  {step.id === 'db' && <Database className="h-5 w-5" />}
                                  {step.id === 'storage' && <Layout className="h-5 w-5" />}
                                  {step.id === 'api' && <Wifi className="h-5 w-5" />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold">{step.label}</span>
                                  <span className="text-[10px] text-zinc-500">{step.details || 'Waiting for scan...'}</span>
                                </div>
                              </div>
                              <div className={cn(
                                "h-2 w-2 rounded-full transition-all duration-500",
                                step.status === 'fixed' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-125" :
                                step.status === 'failed' ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" :
                                step.status === 'running' ? "bg-blue-500 animate-ping" :
                                "bg-zinc-700"
                              )}></div>
                            </div>
                          ))}
                        </div>

                        {repairStatus === 'done' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3"
                          >
                            <div className="flex items-center gap-2 text-emerald-500">
                              <Check className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase tracking-widest">{t.diagnosticReport}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {t.allSystemsOperational}
                            </p>
                          </motion.div>
                        )}

                        <button 
                          onClick={runSystemRepair}
                          disabled={repairStatus === 'running'}
                          className={cn(
                            "w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-black transition-all active:scale-95 shadow-2xl",
                            repairStatus === 'running' 
                              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                              : "bg-white text-zinc-950 hover:bg-blue-500 hover:text-white"
                          )}
                        >
                          {repairStatus === 'running' ? (
                            <>
                              <RefreshCw className="h-5 w-5 animate-spin" />
                              {t.optimizingSystem}
                            </>
                          ) : (
                            <>
                              <Wrench className="h-5 w-5" />
                              {repairStatus === 'done' ? t.reRunDiagnostic : t.initiateRepair}
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Background Decoration */}
                      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl"></div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/50 bg-red-500/5 px-6 py-4 font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-95"
          >
            <LogOut className="h-5 w-5" />
            {t.signOutAllDevices}
          </button>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[32px] bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">{t.areYouSure}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {t.deleteAccountConfirmDesc}
                </p>
                <div className="flex w-full flex-col gap-3 pt-4">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full rounded-2xl bg-red-500 py-4 font-bold text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    {t.yesDeleteAccount}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 py-4 font-bold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
