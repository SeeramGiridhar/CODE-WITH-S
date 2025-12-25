import React from 'react';
import { HistoryItem } from '../types';
import { Icons } from './Icon';

interface HistoryPanelProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  isOpen, 
  onClose, 
  onSelect,
  onClear
}) => {
  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Icons.History className="w-5 h-5 text-indigo-500" />
            Code History
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {history.length === 0 ? (
             <div className="text-center text-slate-500 py-10 text-sm">
               No history yet. <br/> Run some code to see it here!
             </div>
           ) : (
             history.map((item) => (
               <button
                 key={item.id}
                 onClick={() => onSelect(item)}
                 className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 transition-all group"
               >
                 <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.language}</span>
                   <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
                 
                 <div className="mb-3">
                   <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-tight">
                     {item.title || "Untitled Snippet"}
                   </h3>
                   {item.comment && item.comment !== item.title && (
                     <p className="text-[11px] text-slate-400 italic mt-1 truncate">
                       {item.comment}
                     </p>
                   )}
                 </div>

                 <div className="relative">
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/40 pointer-events-none"></div>
                   <p className="text-[10px] text-slate-500 font-mono line-clamp-2 pl-2 border-l-2 border-slate-700/50 group-hover:border-indigo-500/50 transition-colors">
                     {item.code}
                   </p>
                 </div>
               </button>
             ))
           )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <button 
              onClick={onClear}
              className="flex items-center justify-center w-full gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 py-2 rounded-lg transition-colors"
            >
              <Icons.Trash className="w-3.5 h-3.5" />
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;