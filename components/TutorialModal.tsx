import React, { useState } from 'react';
import { Icons } from './Icon';
import { SupportedLanguage } from '../types';
import { TUTORIALS, TutorialTopic } from '../data/tutorials';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onLoadCode: (code: string) => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, language, onLoadCode }) => {
  const [selectedTopic, setSelectedTopic] = useState<TutorialTopic | null>(null);

  if (!isOpen) return null;

  const topics = TUTORIALS[language] || [];

  // If no topics found for language
  if (topics.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md text-center">
          <Icons.Learn className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Tutorials Found</h3>
          <p className="text-slate-400 mb-6">We haven't added tutorials for {language} yet. Check back soon!</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Set first topic by default if none selected
  const activeTopic = selectedTopic || topics[0];

  const handleLoad = () => {
    onLoadCode(activeTopic.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Icons.Learn className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Learn {language}</h2>
              <p className="text-sm text-slate-400">Beginner friendly concepts and examples</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <Icons.Close className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 bg-slate-900/50 border-r border-slate-800 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Topics</h3>
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                  activeTopic.title === topic.title 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                   activeTopic.title === topic.title ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium truncate">{topic.title}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="w-2/3 p-8 overflow-y-auto bg-slate-950/30">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">{activeTopic.title}</h3>
              <p className="text-slate-300 leading-relaxed mb-8 text-lg">
                {activeTopic.description}
              </p>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-8">
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-500">Example Code</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm font-mono text-indigo-300 bg-slate-900/50">
                  {activeTopic.code}
                </pre>
              </div>

              <button
                onClick={handleLoad}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Icons.Code2 className="w-5 h-5" />
                Try this Example
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;