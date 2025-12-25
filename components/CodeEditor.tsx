import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, EditorTheme } from '../types';
import { Icons } from './Icon';
// @ts-ignore - Prettier imports are handled by importmap
import { format } from 'prettier/standalone';
// @ts-ignore
import * as parserBabel from 'prettier/plugins/babel';
// @ts-ignore
import * as parserEstree from 'prettier/plugins/estree';
// @ts-ignore
import * as parserHtml from 'prettier/plugins/html';
import { formatCodeWithAI, getIntelliSenseCandidates } from '../services/geminiService';
import { KEYWORDS } from '../data/keywords';

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (code: string) => void;
  onRun?: () => void;
  isSaving?: boolean;
  onImageUpload?: (file: File) => void;
  isThinkingMode?: boolean;
  onToggleThinking?: () => void;
  theme: EditorTheme;
}

interface Suggestion {
  text: string;
  type: 'keyword' | 'variable' | 'ai';
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  language, 
  onChange, 
  onRun, 
  isSaving,
  onImageUpload,
  isThinkingMode,
  onToggleThinking,
  theme
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  
  // IntelliSense State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(0);
    setMenuPosition(null);
  }, []);

  // Extract variables and functions from current code
  const extractLocalSymbols = useCallback((codeContent: string): string[] => {
    // Basic regex for common variable/function names
    const wordPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = codeContent.matchAll(wordPattern);
    const words = new Set<string>();
    for (const match of matches) {
      const word = match[1];
      if (word.length > 2 && !KEYWORDS[language].includes(word)) {
        words.add(word);
      }
    }
    return Array.from(words);
  }, [language]);

  const calculateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea || !ghostRef.current) return;

    const { selectionEnd } = textarea;
    const textBeforeCursor = code.substring(0, selectionEnd);
    
    // Use the ghost div to calculate coordinates
    ghostRef.current.textContent = textBeforeCursor;
    const span = document.createElement('span');
    span.textContent = '|'; // Placeholder for measurement
    ghostRef.current.appendChild(span);

    const spanRect = span.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    return {
      x: spanRect.left - textareaRect.left + textarea.scrollLeft,
      y: spanRect.top - textareaRect.top + textarea.scrollTop + 24 // 24 is line height approx
    };
  };

  const handleAutocompleteTrigger = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentPos = textarea.selectionEnd;
    const lastWordMatch = code.substring(0, currentPos).match(/\b(\w+)$/);
    const prefix = lastWordMatch ? lastWordMatch[1] : '';

    const localKeywords: Suggestion[] = KEYWORDS[language]
      .filter(k => k.startsWith(prefix) && k !== prefix)
      .map(k => ({ text: k, type: 'keyword' }));

    const localSymbols: Suggestion[] = extractLocalSymbols(code)
      .filter(s => s.startsWith(prefix) && s !== prefix)
      .map(s => ({ text: s, type: 'variable' }));

    const combined = [...localKeywords, ...localSymbols].slice(0, 10);
    
    setSuggestions(combined);
    setSelectedIndex(0);
    setMenuPosition(calculateCursorPosition());

    // Fetch AI suggestions if combined list is small
    if (combined.length < 5) {
      setIsAiLoading(true);
      const aiResults = await getIntelliSenseCandidates(code.substring(0, currentPos), language);
      const aiSuggestions: Suggestion[] = aiResults
        .filter(t => !combined.some(c => c.text === t))
        .map(t => ({ text: t, type: 'ai' }));
      
      setSuggestions(prev => [...prev, ...aiSuggestions].slice(0, 15));
      setIsAiLoading(false);
    }
  };

  const commitSuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentPos = textarea.selectionEnd;
    const lastWordMatch = code.substring(0, currentPos).match(/\b(\w+)$/);
    const prefix = lastWordMatch ? lastWordMatch[1] : '';

    const startPos = currentPos - prefix.length;
    const newValue = code.substring(0, startPos) + suggestion + code.substring(currentPos);
    
    onChange(newValue);
    
    // Move cursor to end of inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = startPos + suggestion.length;
      textarea.focus();
    }, 0);
    
    closeMenu();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If suggestion menu is open
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        commitSuggestion(suggestions[selectedIndex].text);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
    }

    // Handle Tab Indentation (if menu closed)
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
      handleAutocompleteTrigger();
    }
  };

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
      onChange(code.split('\n').map(l => l.trimEnd()).join('\n'));
    } finally {
      setIsFormatting(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      onImageUpload(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const lineCount = code.split('\n').length;
  const isPrettierSupported = language === SupportedLanguage.JAVASCRIPT || language === SupportedLanguage.HTML;

  return (
    <div 
      className={`relative flex flex-col w-full h-full border-2 rounded-xl overflow-hidden transition-all duration-300 group ${theme.colors.uiBackground} ${theme.colors.uiBorder} ${
        isFocused ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : ''
      }`}
    >
      {/* Ghost Div for measurement */}
      <div 
        ref={ghostRef} 
        className="absolute inset-0 p-4 font-mono text-sm leading-6 invisible whitespace-pre-wrap break-words pointer-events-none"
        aria-hidden="true"
      />

      {/* Suggestion Menu */}
      {menuPosition && suggestions.length > 0 && (
        <div 
          className="fixed z-[100] w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ 
            left: `${menuPosition.x + 48}px`, // 48 compensates for line numbers padding
            top: `${menuPosition.y + 100}px` // Offset for UI toolbar
          }}
        >
          <div className="max-h-56 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={`${suggestion.text}-${idx}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSuggestion(suggestion.text);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-3 transition-colors ${
                  selectedIndex === idx ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {suggestion.type === 'keyword' && <Icons.Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  {suggestion.type === 'variable' && <Icons.Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {suggestion.type === 'ai' && <Icons.Brain className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  <span className="truncate">{suggestion.text}</span>
                </div>
                <span className="text-[10px] opacity-50 uppercase">{suggestion.type}</span>
              </button>
            ))}
            {isAiLoading && (
              <div className="px-3 py-1.5 text-[10px] text-slate-500 italic flex items-center gap-2 border-t border-slate-800 bg-slate-900/50">
                <Icons.Spinner className="w-3 h-3 animate-spin" />
                Gemini is thinking...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${theme.colors.uiBackground} ${theme.colors.uiBorder}`}>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <span className={`text-xs uppercase tracking-widest font-bold mr-2 ${theme.colors.uiText}`}>{language}</span>
             
             <div className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors duration-500 ${isSaving ? 'text-indigo-400' : theme.colors.uiText}`}>
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

           <div className={`flex items-center gap-1 pl-4 border-l ${theme.colors.uiBorder}`}>
              <input 
                 type="file" 
                 ref={fileInputRef}
                 className="hidden"
                 accept=".js,.py,.java,.c,.cpp,.html,.sql,.rs,.swift,.txt,.go"
                 onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                     const reader = new FileReader();
                     reader.onload = (ev) => onChange(ev.target?.result as string);
                     reader.readAsText(file);
                   }
                 }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 rounded-md transition-colors ${theme.colors.background} ${theme.colors.uiText} hover:text-indigo-400`}
                title="Open File"
              >
                <Icons.Open className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  const blob = new Blob([code], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `script.txt`;
                  a.click();
                }}
                className={`p-1.5 rounded-md transition-colors ${theme.colors.background} ${theme.colors.uiText} hover:text-indigo-400`}
                title="Download Code"
              >
                <Icons.Download className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={onToggleThinking}
             className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                isThinkingMode 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                : `${theme.colors.background} ${theme.colors.uiBorder} ${theme.colors.uiText} hover:opacity-80`
             }`}
             title={isThinkingMode ? "Thinking Mode Active (Gemini 3 Pro)" : "Fast Mode (Flash Lite)"}
           >
             {isThinkingMode ? <Icons.Brain className="w-3.5 h-3.5" /> : <Icons.Fast className="w-3.5 h-3.5" />}
             <span className="hidden sm:inline">{isThinkingMode ? 'Thinking' : 'Fast'}</span>
           </button>

           <input 
             type="file" 
             ref={imageInputRef} 
             className="hidden" 
             accept="image/*" 
             onChange={handleImageFileChange}
           />
           <button 
             onClick={() => imageInputRef.current?.click()}
             className={`p-1.5 rounded-md transition-colors ${theme.colors.background} ${theme.colors.uiText} hover:text-indigo-400`}
             title="Upload Image to Code"
           >
             <Icons.Image className="w-4 h-4" />
           </button>

           <button 
             onClick={handleFormat}
             className={`p-1.5 rounded-md transition-all ${
               isFormatting 
                 ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' 
                 : `${theme.colors.background} ${theme.colors.uiText} hover:text-indigo-400`
             }`}
             title={`Format Code ${!isPrettierSupported ? '(via AI)' : ''}`}
           >
             {isFormatting ? <Icons.Spinner className="w-4 h-4 animate-spin" /> : <Icons.Format className="w-4 h-4" />}
           </button>
        </div>
      </div>

      <div className="flex flex-1 relative min-h-0">
        <div className={`hidden md:flex flex-col items-end px-3 py-4 font-mono text-sm border-r select-none min-w-[3rem] overflow-hidden ${theme.colors.lineNumbersBg} ${theme.colors.lineNumbersText} ${theme.colors.uiBorder}`}>
          {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            // Optional: Auto-trigger as user types after space or dot
            const char = e.target.value[e.target.selectionEnd - 1];
            if (char === '.' || char === ' ') {
              // handleAutocompleteTrigger(); // Uncomment for aggressive IntelliSense
            } else {
              if (suggestions.length > 0) closeMenu();
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Delay closing to allow clicking menu items
            setTimeout(closeMenu, 200);
            if (isPrettierSupported) handleFormat();
          }}
          spellCheck={false}
          className={`flex-1 w-full h-full p-4 font-mono text-sm outline-none resize-none leading-6 transition-colors duration-300 ${theme.colors.background} ${theme.colors.text} ${theme.colors.caret} ${theme.colors.placeholder}`}
          placeholder={`// Start coding in ${language}...`}
        />

        <div className={`absolute bottom-4 right-4 pointer-events-none opacity-50 text-[10px] hidden md:block ${theme.colors.uiText}`}>
            Ctrl + Space for IntelliSense
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
