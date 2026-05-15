import { motion } from 'motion/react';
import { ExternalLink, Tag, Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    url?: string;
    aiSummary: string;
    note?: string;
    categories: string[];
    tags: string[];
    type: string;
    createdAt: any;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this stash?')) return;
    
    try {
      await deleteDoc(doc(db, 'saved_items', item.id));
      toast.success('Stash removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `saved_items/${item.id}`);
    }
  };

  const formattedDate = item.createdAt?.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass group relative overflow-hidden rounded-3xl flex flex-col h-full"
    >
      {/* Type Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-2 py-1 rounded-md bg-white/10 text-[10px] uppercase font-bold tracking-widest text-white/70 border border-white/5 backdrop-blur-md">
          {item.type}
        </span>
      </div>

      {/* Action Popover (Simple for now) */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={handleDelete}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-neon-red/20 hover:text-neon-red border border-white/5 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Content Placeholder (Would be thumbnail/favicon in real app) */}
      <div className="h-24 bg-white/[0.02] flex items-center justify-center border-b border-white/5">
        {item.url ? (
           <img 
            src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(item.url || '').hostname}`} 
            alt="favicon" 
            className="w-10 h-10 rounded-xl shadow-lg brightness-90 group-hover:brightness-110 transition-all"
            onError={(e) => (e.currentTarget.style.display = 'none')}
           />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-500" />
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-sm font-medium leading-tight mb-2 group-hover:text-blue-400 transition-colors truncate">
          {item.title}
        </h3>
        
        <p className="text-[11px] text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-grow">
          {item.aiSummary || 'No summary available.'}
        </p>

        {item.note && (
          <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 italic text-[10px] text-slate-600">
            "{item.note}"
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.categories.map((cat) => (
            <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/20 text-blue-300 border border-blue-800/30">
              {cat}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <span className="text-[9px] text-slate-600 uppercase tracking-tighter">{formattedDate}</span>
          {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
