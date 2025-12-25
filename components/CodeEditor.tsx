import React, { useRef, useState } from 'react';
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
  theme: EditorTheme;
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
  const [isCompleting, setIsCompleting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExtension = (lang: SupportedLanguage): string => {
    switch (lang) {
      case SupportedLanguage.JAVASCRIPT: return 'js';
      case SupportedLanguage.PYTHON: return 'py';
      case SupportedLanguage.JAVA: return 'java';
      case SupportedLanguage.CPP: return 'cpp';
      case SupportedLanguage.C: return 'c';
      case SupportedLanguage.GO: return 'go';
      case SupportedLanguage.HTML: return 'html';
      case SupportedLanguage.SQL: return 'sql';
      case SupportedLanguage.RUST: return 'rs';
      case SupportedLanguage.SWIFT: return 'swift';
      default: return 'txt';
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChange(content);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Reset
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
      // Fallback to simple trim if formatting fails
      onChange(code.split('\n').map(l => l.trimEnd()).join('\n'));
    } finally {
      setIsFormatting(false);
    }
  };

  const handleAutocomplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      className={`relative flex flex-col w-full h-full border-2 rounded-xl overflow-hidden transition-all duration-300 group ${theme.colors.uiBackground} ${theme.colors.uiBorder} ${
        isFocused ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${theme.colors.uiBackground} ${theme.colors.uiBorder}`}>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <span className={`text-xs uppercase tracking-widest font-bold mr-2 ${theme.colors.uiText}`}>{language}</span>
             
             {/* Auto-Save Indicator */}
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

           {/* File Operations */}
           <div className={`flex items-center gap-1 pl-4 border-l ${theme.colors.uiBorder}`}>
              <input 
                 type="file" 
                 ref={fileInputRef}
                 className="hidden"
                 accept=".js,.py,.java,.c,.cpp,.html,.sql,.rs,.swift,.txt,.go"
                 onChange={handleFileOpen}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 rounded-md transition-colors ${theme.colors.background} ${theme.colors.uiText} hover:text-indigo-400`}
                title="Open File"
              >
                <Icons.Open className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDownload}
                className={`p-1.5 rounded-md transition-colors ${theme.colors.background} ${theme.colors.uiText} hover:text-indigo-400`}
                title="Download Code"
              >
                <Icons.Download className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Thinking Mode Toggle */}
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

           {/* Image Upload */}
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

           {/* Format Button */}
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
        {/* Line Numbers */}
        <div className={`hidden md:flex flex-col items-end px-3 py-4 font-mono text-sm border-r select-none min-w-[3rem] overflow-hidden ${theme.colors.lineNumbersBg} ${theme.colors.lineNumbersText} ${theme.colors.uiBorder}`}>
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
          className={`flex-1 w-full h-full p-4 font-mono text-sm outline-none resize-none leading-6 transition-colors duration-300 ${theme.colors.background} ${theme.colors.text} ${theme.colors.caret} ${theme.colors.placeholder}`}
          placeholder={`// Start coding in ${language}...`}
        />

        {/* IntelliSense Overlay (Bottom) */}
        {isCompleting && (
             <div className="absolute bottom-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                 <Icons.Spinner className="w-3 h-3 animate-spin" />
                 Fetching suggestions...
             </div>
        )}
        <div className={`absolute bottom-4 right-4 pointer-events-none opacity-50 text-[10px] hidden md:block ${theme.colors.uiText}`}>
            Ctrl + Space to complete
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;