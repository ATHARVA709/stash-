import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Send, Loader2, Link as LinkIcon, FileText, Sparkles } from 'lucide-react';
import { processItem } from '../services/geminiService';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AddCard() {
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!auth.currentUser) {
      toast.error('Please sign in to save items');
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('AI is organizing your stash...');

    try {
      const processed = await processItem(content, note);
      
      const itemData = {
        title: processed.title,
        url: content.startsWith('http') ? content : '',
        content: content,
        type: processed.type,
        note: note,
        aiSummary: processed.summary,
        categories: processed.categories,
        tags: processed.tags,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'saved_items'), itemData);
      
      // Update categories count (simplified for now, eventually real indexing)
      // For each category, we could update a categories collection
      
      toast.success('Saved to your library!', { id: loadingToast });
      setContent('');
      setNote('');
      setShowNote(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save item', { id: loadingToast });
      handleFirestoreError(error, OperationType.WRITE, 'saved_items');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <motion.div 
        layout
        className="glass rounded-3xl p-6 relative overflow-hidden shadow-2xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste URL, app name, or text..."
              disabled={isProcessing}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-6 text-xl focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600 shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isProcessing}
                className="px-6 py-3 gradient-button rounded-xl font-semibold text-sm shadow-lg shadow-blue-900/20 hover:brightness-110 active:scale-95 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'STASH'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a quick note... (optional)"
              disabled={isProcessing}
              className="bg-transparent text-sm text-slate-400 focus:outline-none flex-1 placeholder:text-slate-700"
            />
          </div>
        </div>

        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-none"
          />
        )}
      </motion.div>
    </div>
  );
}
