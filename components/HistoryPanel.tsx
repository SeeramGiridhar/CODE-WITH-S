import React from 'react';
import { HistoryItem } from '../types';
import { Icons } from './Icon';

interface HistoryPanelProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  isOpen, 
  onClose, 
  onSelect,
  onClear,
  isLoggedIn,
  onLogin
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
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
               <div className="bg-slate-800 p-3 rounded-full">
                 <Icons.User className="w-8 h-8 text-slate-400" />
               </div>
               <div className="space-y-1">
                 <p className="text-slate-300 font-medium">Sync with Cloud</p>
                 <p className="text-xs text-slate-500 max-w-[200px]">Sign in to save your coding history and access it anywhere.</p>
               </div>
               <button 
                 onClick={onLogin}
                 className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
               >
                 <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                 Sign in with Google
               </button>
            </div>
          ) : (
             <>
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
                     <div className="flex justify-between items-start mb-1">
                       <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">{item.language}</span>
                       <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                     </div>
                     
                     {item.comment && (
                       <div className="flex items-start gap-1.5 mb-2 bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                         <Icons.Comment className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                         <span className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed">"{item.comment}"</span>
                       </div>
                     )}

                     <p className="text-xs text-slate-400 font-mono line-clamp-2 opacity-80 group-hover:opacity-100 pl-1 border-l-2 border-slate-700">
                       {item.code}
                     </p>
                   </button>
                 ))
               )}
             </>
          )}
        </div>

        {/* Footer */}
        {isLoggedIn && history.length > 0 && (
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