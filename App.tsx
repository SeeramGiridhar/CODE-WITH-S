import React, { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, ViewMode, SimulationResult, HistoryItem, EditorTheme } from './types';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import HistoryPanel from './components/HistoryPanel';
import TutorialModal from './components/TutorialModal';
import LoginPage from './components/LoginPage';
import GitPanel from './components/GitPanel';
import ThemeSelector from './components/ThemeSelector';
import { Icons } from './components/Icon';
import { simulateCodeExecutionStream, explainCodeLogic, getCodeSuggestions, generateCodeFromImage, fixCodeError } from './services/geminiService';
import { loginWithGoogle, logoutUser, subscribeToAuth, saveSnippetToCloud, getHistoryFromCloud, deleteHistoryFromCloud } from './services/firebase';
import { THEMES } from './data/themes';

// Initial Code Templates
const TEMPLATES: Record<SupportedLanguage, string> = {
  [SupportedLanguage.JAVASCRIPT]: `// JavaScript Playground
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Beginner"));
console.log("Welcome to CODE WITH S!");`,
  
  [SupportedLanguage.PYTHON]: `# Python Playground
def check_even(number):
    if number % 2 == 0:
        return "Even"
    else:
        return "Odd"

num = 42
print(f"The number {num} is {check_even(num)}")`,

  [SupportedLanguage.JAVA]: `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int sum = a + b;
        System.out.println("Sum of " + a + " and " + b + " is: " + sum);
    }
}`,

  [SupportedLanguage.CPP]: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to C++ Programming!" << endl;
    for(int i=1; i<=3; i++) {
        cout << "Step " << i << endl;
    }
    return 0;
}`,

  [SupportedLanguage.C]: `#include <stdio.h>

int main() {
    printf("Hello from C language!\\n");
    int x = 5;
    printf("Value of x is: %d\\n", x);
    return 0;
}`,

  [SupportedLanguage.HTML]: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; text-align: center; color: #333; padding: 20px; }
    h1 { color: #6366f1; }
    button { padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <h1>My Website</h1>
  <p>Edit the code to change this page instantly!</p>
  <button onclick="alert('You clicked me!')">Click Me</button>
</body>
</html>`,

  [SupportedLanguage.GO]: `package main
import "fmt"

func main() {
    fmt.Println("Go is fun and fast!")
}`,

  [SupportedLanguage.SQL]: `-- SQL Playground
CREATE TABLE Users (ID INT, Name TEXT);
INSERT INTO Users VALUES (1, 'Alice');
INSERT INTO Users VALUES (2, 'Bob');
SELECT * FROM Users;`,

  [SupportedLanguage.RUST]: `fn main() {
    println!("Hello, Rustaceans!");
    let x = 10;
    println!("The value of x is: {}", x);
}`,

  [SupportedLanguage.SWIFT]: `print("Hello from Swift!")
let message = "Swift is great for iOS"
print(message)`
};

const STORAGE_KEY = 'codeflow_autosave_v1';
const THEME_STORAGE_KEY = 'codeflow_theme_v1';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);

  // App State
  const [language, setLanguage] = useState<SupportedLanguage>(SupportedLanguage.JAVASCRIPT);
  const [code, setCode] = useState<string>(TEMPLATES[SupportedLanguage.JAVASCRIPT]);
  const [comment, setComment] = useState<string>('');
  const [output, setOutput] = useState<SimulationResult>({ output: '', isError: false });
  const [explanation, setExplanation] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<EditorTheme>(THEMES[0]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('OUTPUT');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [autoRun, setAutoRun] = useState(true);

  // New Feature States
  const [isSaving, setIsSaving] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Panels State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // --- Auth & Persistence Logic ---

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setCurrentUser(user);
        setShowLogin(false);
        refreshHistory(user.uid);
      } else {
        // If not authenticated, we keep them as null initially. 
        // If they skipped login, currentUser will be set manually to guest.
        // We only check currentUser here if it was already set to guest
        setCurrentUser((prev: any) => {
           if (prev?.uid === 'offline-guest') {
               refreshHistory('offline-guest');
               return prev;
           }
           return null;
        });
        setShowLogin((prev) => (currentUser?.uid === 'offline-guest' ? false : true));
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Load Code
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { code: savedCode, language: savedLang } = JSON.parse(saved);
        if (savedCode && savedLang) {
          setCode(savedCode);
          setLanguage(savedLang as SupportedLanguage);
        }
      } catch (e) {
        console.error("Failed to parse autosave data");
      }
    }
    
    // Load Theme
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      const found = THEMES.find(t => t.id === savedThemeId);
      if (found) setCurrentTheme(found);
    }
  }, []);

  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (code) {
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, language }));
      
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 800);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [code, language]);

  const handleThemeChange = (theme: EditorTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  };

  // --- Helper Functions ---

  const refreshHistory = async (uid: string) => {
    // We now support history for offline-guest via local storage fallback
    const data = await getHistoryFromCloud(uid);
    setHistory(data);
  };

  const saveToHistory = async (lang: SupportedLanguage, codeStr: string, note: string) => {
    if (!currentUser) return;
    if (history.length > 0 && history[0].code === codeStr && history[0].language === lang && history[0].comment === note) return;

    await saveSnippetToCloud(currentUser.uid, lang, codeStr, note);
    refreshHistory(currentUser.uid);
  };

  const handleLogout = async () => {
    if (currentUser?.uid === 'offline-guest') {
       setCurrentUser(null);
       setShowLogin(true);
    } else {
       await logoutUser();
    }
  };

  const handleClearHistory = async () => {
    if(!currentUser) return;
    if(confirm("Are you sure you want to delete all history?")) {
       // Ideally we batch delete, for now we clear UI and rely on user to delete items
       // Or implement batch delete in firebase service
       setHistory([]);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setLanguage(item.language);
    setCode(item.code);
    setComment(item.comment || '');
    setIsHistoryOpen(false);
  };

  // --- Image Analysis ---

  const handleImageUpload = async (file: File) => {
    setIsAiThinking(true);
    setViewMode('OUTPUT'); 
    setOutput({ output: "Analyzing image...", isError: false });
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) {
        try {
          const generatedCode = await generateCodeFromImage(base64String, language);
          setCode(generatedCode);
          setOutput({ output: "Code generated from image successfully!", isError: false });
        } catch (e) {
          setOutput({ output: "Failed to analyze image.", isError: true });
        } finally {
          setIsAiThinking(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Code Execution ---

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setCode(TEMPLATES[lang]);
    setComment('');
    setOutput({ output: '', isError: false });
    setExplanation('');
    setSuggestions('');
  };

  const executeCode = useCallback(async (codeToRun: string, lang: SupportedLanguage) => {
    if (!codeToRun.trim()) return;

    setViewMode('OUTPUT');
    
    if (lang === SupportedLanguage.HTML) {
      setOutput({ output: "Rendering...", isError: false });
      saveToHistory(lang, codeToRun, comment);
      return;
    }

    setIsSimulating(true);

    if (lang === SupportedLanguage.JAVASCRIPT) {
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      try {
        console.log = (...args) => logs.push(args.map(a => String(a)).join(' '));
        console.error = (...args) => logs.push("Error: " + args.map(a => String(a)).join(' '));
        
        new Function(codeToRun)(); 
        
        setOutput({ output: logs.join('\n') || "Done (No Output)", isError: false });
        saveToHistory(lang, codeToRun, comment);
      } catch (e: any) {
        setOutput({ output: e.toString(), isError: true });
      } finally {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        setIsSimulating(false);
      }
    } else {
      // Gemini Streaming for other languages
      try {
        const stream = simulateCodeExecutionStream(codeToRun, lang);
        let fullOutput = "";
        // Reset output initially
        setOutput({ output: "", isError: false });
        
        for await (const chunk of stream) {
            fullOutput += chunk;
            setOutput(prev => ({ ...prev, output: fullOutput }));
        }

        const isErr = fullOutput.toLowerCase().includes('error') || fullOutput.toLowerCase().includes('exception');
        setOutput({ output: fullOutput, isError: isErr });
        
        if (!isErr) saveToHistory(lang, codeToRun, comment);
      } catch (err) {
        setOutput({ output: "Execution failed.", isError: true });
      } finally {
        setIsSimulating(false);
      }
    }
  }, [currentUser, comment, history]); 

  const handleFixError = async (errorMsg: string) => {
      const fixed = await fixCodeError(code, errorMsg, language);
      setCode(fixed);
  };

  const handleRunClick = () => {
    executeCode(code, language);
  };

  const handleExplainClick = async () => {
    setViewMode('EXPLANATION');
    if (!code.trim()) return;
    
    setIsAiThinking(true);
    const exp = await explainCodeLogic(code, language, isThinkingMode);
    setExplanation(exp);
    setIsAiThinking(false);
  };

  const handleSuggestionClick = async () => {
    setViewMode('SUGGESTIONS');
    setIsAiThinking(true);
    const sug = await getCodeSuggestions(code, language);
    setSuggestions(sug);
    setIsAiThinking(false);
  };

  // Auto-run effect
  useEffect(() => {
    if (autoRun && code) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        executeCode(code, language);
      }, 800);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, autoRun, language, executeCode]);

  // --- Render Logic ---

  if (authLoading && !currentUser) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <Icons.Spinner className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Initializing CODE WITH S...</p>
      </div>
    );
  }

  if (showLogin && !currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setShowLogin(false);
          refreshHistory(user.uid);
        }}
        onSkip={() => {
           const guestUser = { uid: 'offline-guest', isAnonymous: true, displayName: 'Guest' };
           setCurrentUser(guestUser);
           setShowLogin(false);
           refreshHistory(guestUser.uid);
        }}
      />
    );
  }

  return (
    <div className={`flex flex-col h-screen ${currentTheme.type === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-slate-100'} overflow-hidden font-sans relative transition-colors duration-500`}>
      
      <TutorialModal 
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        language={language}
        onLoadCode={(newCode) => {
          setCode(newCode);
          setComment(''); 
        }}
      />

      <HistoryPanel 
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
        isLoggedIn={!!currentUser}
        onLogin={() => setShowLogin(true)} 
      />

      <GitPanel 
        isOpen={isGitOpen}
        onClose={() => setIsGitOpen(false)}
        currentCode={code}
        currentLanguage={language}
        currentUser={currentUser}
        onCheckout={(newCode, newLang) => {
          setCode(newCode);
          setLanguage(newLang);
          setIsGitOpen(false);
        }}
      />

      {/* Header */}
      <header className={`flex items-center justify-between px-6 py-4 border-b z-10 shrink-0 transition-colors duration-500 ${
        currentTheme.type === 'light' 
          ? 'bg-white border-slate-200' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
            <img 
              src="/logo.png" 
              alt="Logo" 
              className={`relative w-10 h-10 rounded-full border object-cover ${currentTheme.type === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('hidden');
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-xl font-bold tracking-tight bg-clip-text text-transparent ${currentTheme.type === 'light' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-white to-slate-400'}`}>
              CODE WITH S
            </h1>
            <span className={`text-[10px] font-medium ${currentTheme.type === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Learn. Code. Visualize.</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           {/* Language Selector */}
           <div className="relative group flex items-center gap-2">
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className={`appearance-none pl-4 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer font-medium text-sm w-40 ${
                currentTheme.type === 'light' 
                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-500' 
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-indigo-500'
              }`}
            >
              {Object.values(SupportedLanguage).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icons.Code2 className="w-4 h-4 text-slate-400" />
            </div>

            <button
               onClick={() => setIsTutorialOpen(true)}
               className={`p-2 rounded-lg border transition-all ${
                 currentTheme.type === 'light'
                   ? 'bg-slate-50 text-slate-500 border-slate-200 hover:text-indigo-600 hover:bg-indigo-50'
                   : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-indigo-400 hover:bg-indigo-600/20'
               }`}
               title={`Learn ${language}`}
            >
               <Icons.Learn className="w-5 h-5" />
            </button>
          </div>

          <div className={`h-6 w-px mx-2 hidden md:block ${currentTheme.type === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}></div>

          {/* Theme Selector */}
          <ThemeSelector currentTheme={currentTheme} onSelect={handleThemeChange} />

          {/* Controls */}
          <div className={`hidden md:flex items-center rounded-lg p-1 border ${
             currentTheme.type === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
             <button
              onClick={() => setAutoRun(!autoRun)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                autoRun 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : `${currentTheme.type === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-slate-200'}`
              }`}
             >
               {autoRun ? 'Auto-Run' : 'Manual'}
             </button>
          </div>

          <button
            onClick={handleRunClick}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            title="Ctrl + Enter"
          >
            <Icons.Play className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            onClick={() => setIsGitOpen(true)}
            className="p-2 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition-colors relative group"
            title="Version Control (Git)"
          >
             <Icons.GitBranch className="w-6 h-6" />
             <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-slate-900"></span>
          </button>

          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors relative"
            title="Run History"
          >
             <Icons.History className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative">
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3 px-1 gap-4">
            <h2 className={`text-sm font-semibold flex items-center gap-2 shrink-0 ${currentTheme.type === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              <Icons.Code2 className="w-4 h-4" />
              Editor
            </h2>
            <div className="flex-1 max-w-md relative group">
              <Icons.Comment className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note to this snippet (saved on Run)..."
                className={`w-full border-b text-xs focus:outline-none transition-all pl-7 pr-2 py-1 ${
                  currentTheme.type === 'light' 
                    ? 'bg-slate-100 border-slate-200 hover:border-slate-400 focus:border-indigo-500 text-slate-700 placeholder-slate-400'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 focus:border-indigo-500 text-slate-300 placeholder-slate-600'
                }`}
              />
            </div>
          </div>
          <div className="flex-1 h-full min-h-[300px]">
             <CodeEditor 
                code={code} 
                language={language} 
                onChange={setCode} 
                onRun={handleRunClick}
                isSaving={isSaving}
                onImageUpload={handleImageUpload}
                isThinkingMode={isThinkingMode}
                onToggleThinking={() => setIsThinkingMode(!isThinkingMode)}
                theme={currentTheme}
             />
          </div>
        </section>

        <section className="flex-1 flex flex-col min-w-0 md:max-w-[45%] lg:max-w-[40%] transition-all">
          <div className="flex items-center justify-between mb-3 px-1">
             <div className={`flex space-x-1 p-1 rounded-lg ${currentTheme.type === 'light' ? 'bg-slate-200' : 'bg-slate-900/50'}`}>
                <button
                  onClick={() => setViewMode('OUTPUT')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'OUTPUT' 
                      ? `${currentTheme.type === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-800 text-indigo-400 shadow-sm'}` 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icons.Terminal className="w-3.5 h-3.5" />
                  <span>Output</span>
                </button>
                <button
                  onClick={handleExplainClick}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'EXPLANATION' 
                      ? `${currentTheme.type === 'light' ? 'bg-white text-purple-600 shadow-sm' : 'bg-slate-800 text-purple-400 shadow-sm'}` 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icons.BookOpen className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
                <button
                  onClick={handleSuggestionClick}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'SUGGESTIONS' 
                      ? `${currentTheme.type === 'light' ? 'bg-white text-amber-600 shadow-sm' : 'bg-slate-800 text-amber-400 shadow-sm'}` 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icons.Lightbulb className="w-3.5 h-3.5" />
                  <span>Hints</span>
                </button>
             </div>

             <div className="flex items-center gap-2">
                {isSimulating || isAiThinking ? (
                  <span className="flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 ${isThinkingMode ? 'bg-purple-400' : 'bg-indigo-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isThinkingMode ? 'bg-purple-500' : 'bg-indigo-500'}`}></span>
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                )}
             </div>

          </div>
          
          <div className="flex-1 h-full min-h-[300px]">
             <OutputPanel 
                viewMode={viewMode}
                simulationResult={output}
                explanation={explanation}
                suggestions={suggestions}
                isSimulating={isSimulating}
                isThinking={isAiThinking}
                language={language}
                code={code}
                onFixError={handleFixError}
             />
          </div>
        </section>

      </main>

      <footer className={`py-2 px-6 border-t text-xs flex justify-between items-center shrink-0 ${
         currentTheme.type === 'light' 
           ? 'bg-white border-slate-200 text-slate-400' 
           : 'bg-slate-900 border-slate-800 text-slate-500'
      }`}>
        <div className="flex items-center gap-4">
           <p>Powered by Google Gemini 2.0</p>
           {currentUser && (
             <button onClick={handleLogout} className="text-red-400 hover:underline">
               {currentUser.isAnonymous ? 'Exit Guest Mode' : `Sign Out (${currentUser.email || currentUser.displayName})`}
             </button>
           )}
        </div>
        <div className="flex gap-4">
           <span>Tab to indent</span>
           <span>Ctrl+Space to Complete</span>
           <span>Ctrl+Enter to Run</span>
        </div>
      </footer>
    </div>
  );
};

export default App;