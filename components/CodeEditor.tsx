import React, { useRef, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { Icons } from './Icon';
// @ts-ignore - Prettier imports are handled by importmap
import { format } from 'prettier/standalone';
// @ts-ignore
import * as parserBabel from 'prettier/plugins/babel';
// @ts-ignore
import * as parserEstree from 'prettier/plugins/estree';
// @ts-ignore
import * as parserHtml from 'prettier/plugins/html';
import { formatCodeWithAI, getAutocompleteSuggestion } from '../services/geminiService';

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (code: string) => void;
  onRun?: () => void;
  isSaving?: boolean;
  onImageUpload?: (file: File) => void;
  isThinkingMode?: boolean;
  onToggleThinking?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  language, 
  onChange, 
  onRun, 
  isSaving,
  onImageUpload,
  isThinkingMode,
  onToggleThinking
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormat = async () => {
    setIsFormatting(true);
    try {
      let formatted = code;
      
      // Client-side lightweight formatting
      if (language === SupportedLanguage.JAVASCRIPT) {
        formatted = await format(code, {
          parser: 'babel',
          plugins: [parserBabel, parserEstree],
          printWidth: 80,
          tabWidth: 2,
          semi: true,
          singleQuote: false,
        });
      } else if (language === SupportedLanguage.HTML) {
        formatted = await format(code, {
          parser: 'html',
          plugins: [parserHtml],
          printWidth: 80,
          tabWidth: 2,
        });
      } else {
        // AI-Powered Robust Formatting for C++, Python, etc.
        formatted = await formatCodeWithAI(code, language);
      }

      onChange(formatted);
    } catch (e) {
      console.error("Formatting failed:", e);
      // Fallback to simple trim if formatting fails
      onChange(code.split('\n').map(l => l.trimEnd()).join('\n'));
    } finally {
      setIsFormatting(false);
    }
  };

  const handleAutocomplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setSuggestion(null);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentPos = textarea.selectionEnd;
    const codeContext = code.substring(0, currentPos);

    const completion = await getAutocompleteSuggestion(codeContext, language);
    if (completion) {
       // Insert the completion
       const newValue = code.substring(0, currentPos) + completion + code.substring(currentPos);
       onChange(newValue);
       
       // Move cursor to end of inserted text
       setTimeout(() => {
         textarea.selectionStart = textarea.selectionEnd = currentPos + completion.length;
         textarea.focus();
       }, 0);
    }
    setIsCompleting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab Indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    // Handle Run Shortcut (Ctrl + Enter or Cmd + Enter)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) {
        onRun();
      }
    }
    
    // Handle Format Shortcut (Alt + Shift + F)
    if (e.shiftKey && e.altKey && e.key === 'F') {
      e.preventDefault();
      handleFormat();
    }

    // Handle Autocomplete (Ctrl + Space)
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      handleAutocomplete();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      onImageUpload(e.target.files[0]);
    }
    // Reset value to allow re-uploading same file
    if (e.target) e.target.value = '';
  };

  const lineCount = code.split('\n').length;
  const isPrettierSupported = language === SupportedLanguage.JAVASCRIPT || language === SupportedLanguage.HTML;

  return (
    <div 
      className={`relative flex flex-col w-full h-full bg-slate-900 border-2 rounded-xl overflow-hidden transition-colors duration-200 group ${
        isFocused ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-slate-800'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
           <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mr-2">{language}</span>
           
           {/* Auto-Save Indicator */}
           <div className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors duration-500 ${isSaving ? 'text-indigo-400' : 'text-slate-600'}`}>
             {isSaving ? (
               <>
                 <Icons.Save className="w-3 h-3 animate-pulse" />
                 <span>Saving...</span>
               </>
             ) : (
                <>
                 <Icons.CheckSimple className="w-3 h-3" />
                 <span>Saved</span>
                </>
             )}
           </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Thinking Mode Toggle */}
           <button 
             onClick={onToggleThinking}
             className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                isThinkingMode 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
             }`}
             title={isThinkingMode ? "Thinking Mode Active (Gemini 3 Pro)" : "Fast Mode (Flash Lite)"}
           >
             {isThinkingMode ? <Icons.Brain className="w-3.5 h-3.5" /> : <Icons.Fast className="w-3.5 h-3.5" />}
             <span className="hidden sm:inline">{isThinkingMode ? 'Thinking' : 'Fast'}</span>
           </button>

           {/* Image Upload */}
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*" 
             onChange={handleFileChange}
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
             title="Upload Image to Code"
           >
             <Icons.Image className="w-4 h-4" />
           </button>

           {/* Format Button */}
           <button 
             onClick={handleFormat}
             className={`p-1.5 rounded-md transition-all ${
               isFormatting 
                 ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' 
                 : 'bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700'
             }`}
             title={`Format Code ${!isPrettierSupported ? '(via AI)' : ''}`}
           >
             {isFormatting ? <Icons.Spinner className="w-4 h-4 animate-spin" /> : <Icons.Format className="w-4 h-4" />}
           </button>
        </div>
      </div>

      <div className="flex flex-1 relative min-h-0">
        {/* Line Numbers */}
        <div className="hidden md:flex flex-col items-end px-3 py-4 bg-slate-950 text-slate-500 font-mono text-sm border-r border-slate-800 select-none min-w-[3rem] overflow-hidden">
          {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Editor Area */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (isPrettierSupported) handleFormat();
          }}
          spellCheck={false}
          className="flex-1 w-full h-full bg-slate-900 p-4 font-mono text-sm text-blue-100 outline-none resize-none leading-6 placeholder-slate-600"
          placeholder={`// Start coding in ${language}...`}
        />

        {/* IntelliSense Overlay (Bottom) */}
        {isCompleting && (
             <div className="absolute bottom-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                 <Icons.Spinner className="w-3 h-3 animate-spin" />
                 Fetching suggestions...
             </div>
        )}
        <div className="absolute bottom-4 right-4 pointer-events-none opacity-50 text-[10px] text-slate-500 hidden md:block">
            Ctrl + Space to complete
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;