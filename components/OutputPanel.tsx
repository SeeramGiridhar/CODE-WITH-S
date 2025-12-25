
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ViewMode, SimulationResult, SupportedLanguage } from '../types';
import { Icons } from './Icon';

interface OutputPanelProps {
  viewMode: ViewMode;
  simulationResult: SimulationResult;
  explanation: string;
  suggestions: string;
  isSimulating: boolean;
  isThinking: boolean;
  language: SupportedLanguage;
  code: string; 
  onFixError?: (error: string) => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ 
  viewMode, 
  simulationResult, 
  explanation, 
  suggestions,
  isSimulating,
  isThinking,
  language,
  code,
  onFixError
}) => {
  const [isFixing, setIsFixing] = useState(false);

  const handleOpenInBrowser = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleFixClick = async () => {
      if (onFixError && simulationResult.output) {
          setIsFixing(true);
          await onFixError(simulationResult.output);
          setIsFixing(false);
      }
  }

  const renderContent = () => {
    // 1. Logic Explanation Mode
    if (viewMode === 'EXPLANATION') {
      if (isThinking) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <Icons.Spinner className="w-8 h-8 animate-spin text-purple-500" />
            <p>Analyzing Logic for Beginners...</p>
          </div>
        );
      }
      return (
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-headings:text-indigo-300">
           <ReactMarkdown>{explanation || "No explanation generated yet. Click the book icon!"}</ReactMarkdown>
        </div>
      );
    }

    // 2. Suggestions Mode
    if (viewMode === 'SUGGESTIONS') {
      if (isThinking) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <Icons.Spinner className="w-8 h-8 animate-spin text-amber-500" />
            <p>Generating Helpful Hints...</p>
          </div>
        );
      }
      return (
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-headings:text-amber-300 prose-code:text-amber-200">
          <ReactMarkdown>{suggestions || "Stuck? Ask for a hint!"}</ReactMarkdown>
        </div>
      );
    }

    // 3. Output Mode (Default)
    if (viewMode === 'OUTPUT') {
      // Special handling for HTML: Live Preview
      if (language === SupportedLanguage.HTML) {
        return (
          <div className="w-full h-full bg-white rounded-lg overflow-hidden relative group">
            <iframe 
              srcDoc={code}
              title="Live Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
            
            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={handleOpenInBrowser}
                className="bg-black/70 hover:bg-black text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                title="Open in new browser tab"
              >
                <Icons.ExternalLink className="w-3 h-3" />
                Open Browser
              </button>
              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none self-center">
                Live Preview
              </div>
            </div>
          </div>
        );
      }

      // Standard Console Output
      if (isSimulating && !simulationResult.output) {
         return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <Icons.Spinner className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Compiling & Running...</p>
          </div>
        );
      }

      if (!simulationResult.output && !simulationResult.isError && !isSimulating) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
            <Icons.Terminal className="w-12 h-12 opacity-20" />
            <p>Run the code to see output</p>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full">
            <div className={`flex-1 w-full h-full font-mono text-sm whitespace-pre-wrap overflow-auto p-1 ${simulationResult.isError ? 'text-red-400' : 'text-emerald-400'}`}>
            {simulationResult.output}
            </div>
            
            {simulationResult.isError && onFixError && (
                <div className="mt-2 pt-2 border-t border-red-500/20 flex justify-end">
                    <button 
                        onClick={handleFixClick}
                        disabled={isFixing}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {/* Fix: Using Icons.Format instead of Icons.Wand2 */}
                        {isFixing ? <Icons.Spinner className="w-3 h-3 animate-spin"/> : <Icons.Format className="w-3 h-3"/>}
                        {isFixing ? 'Fixing...' : 'Fix Code with AI'}
                    </button>
                </div>
            )}
        </div>
      );
    }
  };

  return (
    <div className={`w-full h-full bg-slate-900 border-2 rounded-xl p-4 overflow-hidden shadow-inner relative flex flex-col ${simulationResult.isError && viewMode === 'OUTPUT' ? 'border-red-900/50' : 'border-slate-800'}`}>
      {renderContent()}
    </div>
  );
};

export default OutputPanel;
