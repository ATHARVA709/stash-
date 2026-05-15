import { useState, useMemo, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { Search, Sparkles, LayoutGrid, Clock, Filter, Layers, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from './components/Navigation';
import AddCard from './components/AddCard';
import ItemCard from './components/ItemCard';
import { semanticSearch } from './services/geminiService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'explore'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeItems: Unsubscribe | undefined;

    if (user) {
      const itemsQuery = query(
        collection(db, 'saved_items'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(fetchedItems);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'saved_items');
      });
    } else {
      setItems([]);
    }

    return () => {
      if (unsubscribeItems) unsubscribeItems();
    };
  }, [user]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(item => item.categories?.forEach((c: string) => cats.add(c)));
    return Array.from(cats);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCategory) {
      result = result.filter(item => item.categories?.includes(selectedCategory));
    }

    if (searchQuery.trim()) {
      if (semanticResults) {
        // Sort by semantic relevance
        result = result.filter(item => semanticResults.includes(item.id))
                      .sort((a, b) => semanticResults.indexOf(a.id) - semanticResults.indexOf(b.id));
      } else {
        // Simple keyword fallback
        const q = searchQuery.toLowerCase();
        result = result.filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.aiSummary.toLowerCase().includes(q) ||
          item.note?.toLowerCase().includes(q)
        );
      }
    }

    return result;
  }, [items, searchQuery, semanticResults, selectedCategory]);

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || items.length === 0) return;
    setIsSearching(true);
    try {
      const results = await semanticSearch(items, searchQuery);
      setSemanticResults(results);
    } catch (error) {
      console.error(error);
      setSemanticResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32">
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#0f172a', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.05)' }
      }} />
      <Navigation />

      <main className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 px-4 py-1 rounded-full bg-white/[0.02] border border-white/5 flex items-center gap-2 text-slate-500 font-medium tracking-wide text-[10px] uppercase shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Semantic Memory Vault Active
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-light font-display tracking-tight mb-4">
            Throw anything <span className="text-slate-500">here.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-12 font-normal">
            AI remembers and organizes it for you instantly.
          </p>
          
          <AddCard />

          {/* Quick Category Chips */}
          <div className="flex gap-2 mt-8 opacity-40">
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-medium text-slate-400">#Coding</span>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-medium text-slate-400">#DesignInspo</span>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-medium text-slate-400">#AI-Tools</span>
            <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-medium text-slate-400">#ReadingList</span>
          </div>
        </div>

        {/* Content Section */}
        {user ? (
          <div className="mt-24">
            {/* Search and Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 px-4">
              <div className="flex bg-white/[0.02] p-1 rounded-2xl border border-white/5 shadow-inner">
                <button 
                  onClick={() => setActiveTab('recent')}
                  className={`px-8 py-2.5 rounded-xl flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-widest ${activeTab === 'recent' ? 'bg-white/5 text-white shadow-md border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Recent
                </button>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className={`px-8 py-2.5 rounded-xl flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-widest ${activeTab === 'explore' ? 'bg-white/5 text-white shadow-md border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Explore
                </button>
              </div>

              <div className="relative w-full md:w-[400px] group">
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-600 group-focus-within:text-blue-500'}`} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) setSemanticResults(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  placeholder="Semantic retrieval..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-20 focus:outline-none focus:border-blue-500/50 shadow-inner transition-all font-medium placeholder:text-slate-700 text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={handleSemanticSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600/10 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                  >
                    SEARCH
                  </button>
                )}
              </div>
            </div>

            {/* Explore Section */}
            {activeTab === 'explore' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16 px-4"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Active Contexts</h3>
                  <span className="text-[10px] text-blue-500 font-bold uppercase cursor-pointer hover:underline">Manage All</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col gap-1 items-start text-left ${!selectedCategory ? 'bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-900/5' : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-60'}`}
                  >
                    <span className="text-sm font-medium">All Stash</span>
                    <span className="text-[10px] text-slate-600">{items.length} items</span>
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-1 items-start text-left ${selectedCategory === cat ? 'bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-900/5' : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-60'}`}
                    >
                      <span className="text-sm font-medium">{cat}</span>
                      <span className="text-[10px] text-slate-600">
                        {items.filter(i => i.categories?.includes(cat)).length} items
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Items Feed */}
            <div className="px-4">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-700">
                  {selectedCategory ? `Stashed in ${selectedCategory}` : searchQuery ? 'Search Results' : 'Recently Stashed'}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {filteredItems.length === 0 && !loading && (
              <div className="py-24 text-center flex flex-col items-center opacity-20">
                <Layers className="w-16 h-16 mb-4 stroke-1" />
                <p className="text-lg font-light tracking-widest uppercase">Empty Vault</p>
                <p className="text-xs mt-2 px-2 py-1 border border-white/10 rounded tracking-tighter">Initialize by stashing a resource</p>
              </div>
            )}
          </div>
        ) : !loading && (
          <div className="mt-20 py-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-10 shadow-2xl shadow-blue-600/20">
                <Zap className="w-10 h-10 text-white" />
             </div>
            <h2 className="text-3xl font-light tracking-tight mb-4 text-slate-200">Start your memory vault.</h2>
            <p className="text-slate-500 mb-8 max-w-sm text-sm">Sign in with Google to begin building your intelligent personal library.</p>
          </div>
        )}

        {loading && (
          <div className="mt-40 flex items-center justify-center gap-4 text-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Booting Engine...</span>
          </div>
        ) }
      </main>

      {/* Footer System Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 glass-dark border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 font-medium font-mono uppercase tracking-tighter">
        <div className="flex gap-6 mb-2 sm:mb-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            <span>Semantic Engine: Active</span>
          </div>
          <span>Vault Content: {items.length} Items</span>
        </div>
        <div className="flex gap-6">
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Mode</span>
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Endpoint: Google AI Studio</span>
          <span>© 2026 STASH AI</span>
        </div>
      </footer>
    </div>
  );
}
