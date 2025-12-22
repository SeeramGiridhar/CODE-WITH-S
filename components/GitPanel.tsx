import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';
import { Commit, SupportedLanguage } from '../types';
import { pushCommitsToCloud, pullCommitsFromCloud } from '../services/firebase';

interface GitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  currentLanguage: SupportedLanguage;
  currentUser: any;
  onCheckout: (code: string, language: SupportedLanguage) => void;
}

const GitPanel: React.FC<GitPanelProps> = ({ 
  isOpen, 
  onClose, 
  currentCode, 
  currentLanguage,
  currentUser,
  onCheckout
}) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Storage Key for Local Commits
  const LOCAL_STORAGE_KEY = `codeflow_commits_${currentUser?.uid || 'guest'}`;

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setCommits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local commits", e);
      }
    }
  }, [LOCAL_STORAGE_KEY]);

  // Save to local storage whenever commits change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(commits));
  }, [commits, LOCAL_STORAGE_KEY]);

  const handleCommit = () => {
    if (!message.trim()) {
      setError("Commit message cannot be empty");
      return;
    }

    const newCommit: Commit = {
      id: crypto.randomUUID(),
      message: message.trim(),
      timestamp: Date.now(),
      code: currentCode,
      language: currentLanguage,
      author: currentUser?.displayName || 'Guest',
      isSynced: false
    };

    setCommits([newCommit, ...commits]);
    setMessage('');
    setError('');
  };

  const handlePush = async () => {
    if (!currentUser || currentUser.uid === 'offline-guest') {
      setError("You must be logged in to push to cloud.");
      return;
    }

    const unsynced = commits.filter(c => !c.isSynced);
    if (unsynced.length === 0) {
      setError("Nothing to push. All commits are synced.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      await pushCommitsToCloud(currentUser.uid, unsynced);
      
      // Mark as synced
      const updated = commits.map(c => ({ ...c, isSynced: true }));
      setCommits(updated);
    } catch (e) {
      setError("Failed to push changes. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!currentUser || currentUser.uid === 'offline-guest') {
      setError("You must be logged in to pull.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const remoteCommits = await pullCommitsFromCloud(currentUser.uid);
      
      // Merge logic: Combine remote and local, unique by ID
      // If remote has same ID as local, remote wins (source of truth) but usually they are same.
      // We prioritize preserving local unsynced work if conflicts (but here IDs are unique UUIDs)
      
      const combined = [...remoteCommits];
      // Add local commits that are NOT in remote yet
      commits.forEach(local => {
        if (!combined.find(r => r.id === local.id)) {
          combined.push(local);
        }
      });
      
      // Sort by time desc
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setCommits(combined);
    } catch (e) {
      setError("Failed to pull changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this commit locally?")) {
      setCommits(commits.filter(c => c.id !== id));
    }
  };

  // derived state for modified status (naive check against latest commit)
  const isModified = commits.length === 0 || commits[0].code !== currentCode;
  const unsyncedCount = commits.filter(c => !c.isSynced).length;

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Icons.GitBranch className="w-5 h-5 text-orange-500" />
          Version Control
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <Icons.Close className="w-5 h-5" />
        </button>
      </div>

      {/* Commit Section */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="mb-3 flex items-center justify-between">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
             {isModified ? 'Uncommitted Changes' : 'Working Tree Clean'}
           </span>
           {isModified && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
        </div>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What did you change?"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none h-20 mb-3"
        />
        
        <button
          onClick={handleCommit}
          disabled={!isModified && !message}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-all"
        >
          <Icons.GitCommit className="w-4 h-4" />
          Commit Changes
        </button>

        {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><Icons.Error className="w-3 h-3"/> {error}</p>}
      </div>

      {/* Sync Controls */}
      <div className="p-2 grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-950/30">
        <button 
           onClick={handlePush}
           disabled={loading || unsyncedCount === 0}
           className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
           title="Push local commits to cloud"
        >
          {loading ? <Icons.Spinner className="w-3 h-3 animate-spin"/> : <Icons.Push className="w-3 h-3" />}
          Push {unsyncedCount > 0 && `(${unsyncedCount})`}
        </button>
        <button 
           onClick={handlePull}
           disabled={loading}
           className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
           title="Pull remote commits"
        >
          {loading ? <Icons.Spinner className="w-3 h-3 animate-spin"/> : <Icons.Pull className="w-3 h-3" />}
          Pull
        </button>
      </div>

      {/* Commit Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
        {commits.length === 0 ? (
          <div className="text-center text-slate-600 mt-10">
            <Icons.GitPullRequest className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No commits yet.</p>
          </div>
        ) : (
          commits.map((commit) => (
            <div key={commit.id} className="group relative bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-slate-200">{commit.message}</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  {new Date(commit.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {!commit.isSynced && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Not pushed"></div>}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                <Icons.User className="w-3 h-3" /> {commit.author}
                <span className="bg-slate-800 px-1.5 rounded text-slate-400">{commit.language}</span>
              </div>

              <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => onCheckout(commit.code, commit.language)}
                   className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-1.5 rounded text-xs font-medium transition-colors"
                 >
                   Checkout
                 </button>
                 <button 
                   onClick={() => handleDelete(commit.id)}
                   className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors"
                   title="Delete locally"
                 >
                   <Icons.Trash className="w-3.5 h-3.5" />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GitPanel;