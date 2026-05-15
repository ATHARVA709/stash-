import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, LogOut, Zap } from 'lucide-react';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-dark">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold font-display tracking-tight text-white">
          STASH
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Library</a>
          <a href="#" className="hover:text-white transition-colors">Collections</a>
          <a href="#" className="text-blue-500">Home</a>
        </div>
        
        {user ? (
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-slate-200">{user.displayName}</span>
              <button 
                onClick={handleLogout}
                className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-1"
              >
                Sign out <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-9 h-9 rounded-full border border-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user.displayName?.[0] || 'U'}</span>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-medium text-sm"
          >
            <LogIn className="w-4 h-4" /> Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
