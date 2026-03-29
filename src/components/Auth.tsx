import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, Sparkles, Shield, Zap, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 text-white p-4">
      <div className="grid w-full max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI All-in-One</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold leading-tight lg:text-6xl">
              Your Ultimate <span className="text-blue-500">AI Platform</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-lg">
              Experience the power of multiple AI models in one place. Chat, code, generate images, and analyze ideas with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              { icon: Zap, title: "Fast Responses", desc: "Powered by Gemini 3 Flash" },
              { icon: Shield, title: "Secure & Private", desc: "Your data is safe with us" },
              { icon: Globe, title: "Multilingual", desc: "Support for 50+ languages" },
              { icon: Sparkles, title: "Creative Tools", desc: "Images, Code, and more" }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
                  <feature.icon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-zinc-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center justify-center rounded-3xl bg-zinc-900/50 p-12 border border-zinc-800 backdrop-blur-xl"
        >
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold">Welcome Back</h3>
            <p className="text-zinc-400 mt-2">Sign in to access your AI workspace</p>
          </div>

          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-black transition-all hover:bg-zinc-200 active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-6 w-6" />
            Continue with Google
          </button>

          <div className="mt-8 flex items-center gap-4 text-zinc-600">
            <div className="h-px w-12 bg-zinc-800"></div>
            <span className="text-sm uppercase tracking-widest font-bold">Trusted by thousands</span>
            <div className="h-px w-12 bg-zinc-800"></div>
          </div>

          <div className="mt-8 flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <img 
                key={i}
                src={`https://picsum.photos/seed/user${i}/100/100`} 
                alt="User" 
                className="h-10 w-10 rounded-full border-2 border-zinc-900 object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500">Join 10,000+ users today</p>
        </motion.div>
      </div>
    </div>
  );
}
