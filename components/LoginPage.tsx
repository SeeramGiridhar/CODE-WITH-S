
import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';
import { loginUser, registerUser, resetUserPassword } from '../services/firebase';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RESET'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when switching modes
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      let user;
      
      if (mode === 'RESET') {
        await resetUserPassword(email);
        setSuccessMessage("Recovery email sent. Please check your inbox.");
        setIsLoading(false);
        return; 
      }
      
      if (mode === 'LOGIN') {
        user = await loginUser(email, password);
      } else if (mode === 'REGISTER') {
        if (!name.trim()) throw new Error("Full name is required.");
        user = await registerUser(email, password, name);
      }
      
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError("Invalid email or password.");
      } else if (code === 'auth/email-already-in-use') {
        setError("This email is already associated with an account.");
      } else if (code === 'auth/weak-password') {
        setError("Password must be at least 6 characters long.");
      } else if (code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#0a0c10] font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      {/* Left Panel: Content & Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
                <Icons.Code2 className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-black text-white tracking-tighter">CODE WITH S</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              {mode === 'LOGIN' && 'Welcome back'}
              {mode === 'REGISTER' && 'Join the workspace'}
              {mode === 'RESET' && 'Reset security'}
            </h1>
            <p className="text-slate-400 text-base">
              {mode === 'LOGIN' && 'Enter your credentials to resume your progress.'}
              {mode === 'REGISTER' && 'Create an account to start building with AI.'}
              {mode === 'RESET' && 'Provide your email to reset your workspace access.'}
            </p>
          </div>

          {/* Social Logins */}
          {mode !== 'RESET' && (
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
              >
                <Icons.Google className="w-4 h-4" />
                Google
              </button>
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
              >
                <Icons.Github className="w-4 h-4" />
                GitHub
              </button>
            </div>
          )}

          {mode !== 'RESET' && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0c10] px-3 text-slate-500 font-bold tracking-widest">Or continue with</span></div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3 animate-in shake duration-300">
                <Icons.Error className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm flex items-start gap-3">
                <Icons.Check className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {mode === 'REGISTER' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Connor"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              {mode !== 'RESET' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                     {mode === 'LOGIN' && (
                       <button 
                         type="button"
                         onClick={() => setMode('RESET')}
                         className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                       >
                         Forgot password?
                       </button>
                     )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 pr-10 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <Icons.EyeOff className="w-5 h-5"/> : <Icons.Eye className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Icons.Spinner className="w-5 h-5 animate-spin"/>
              ) : (
                <>
                  {mode === 'LOGIN' && 'Sign into Workspace'}
                  {mode === 'REGISTER' && 'Create Member Account'}
                  {mode === 'RESET' && 'Send Recovery Email'}
                  {/* Fix: Using Icons.Fast instead of Icons.Zap */}
                  <Icons.Fast className="w-4 h-4 text-indigo-200 group-hover:scale-125 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-2">
            {mode === 'LOGIN' && (
               <p className="text-sm text-slate-400">
                 New to Code With S?{' '}
                 <button onClick={() => setMode('REGISTER')} className="text-white font-bold hover:text-indigo-400 hover:underline transition-all">Create account</button>
               </p>
            )}
            {mode === 'REGISTER' && (
               <p className="text-sm text-slate-400">
                 Already a member?{' '}
                 <button onClick={() => setMode('LOGIN')} className="text-white font-bold hover:text-indigo-400 hover:underline transition-all">Sign in here</button>
               </p>
            )}
            {mode === 'RESET' && (
              <button 
                onClick={() => setMode('LOGIN')}
                className="text-sm text-slate-400 hover:text-white font-bold flex items-center justify-center gap-2 w-full transition-colors"
              >
                <Icons.Logout className="w-4 h-4 rotate-180" /> Back to Login
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Right Panel: Hero / Showcase */}
      <div className="hidden lg:flex w-1/2 bg-[#0d0f14] border-l border-slate-800 relative items-center justify-center p-12 overflow-hidden">
          
          {/* High-quality background grid */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/5 via-transparent to-purple-600/5"></div>

          {/* Hero Content Card */}
          <div className="relative z-10 max-w-lg w-full">
             
             {/* Floating Code Editor Graphic */}
             <div className="relative mb-12 animate-in slide-in-from-right-12 duration-1000">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-3xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/50 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Gemini-Engine-v2.0</div>
                  </div>
                  <div className="p-8 font-mono text-sm leading-relaxed">
                     <div className="flex gap-3">
                       <span className="text-indigo-400 select-none">1</span>
                       <span className="text-purple-400">import</span>
                       <span className="text-slate-300">{" { GoogleGenAI } "}</span>
                       <span className="text-purple-400">from</span>
                       <span className="text-emerald-400">"@google/genai"</span>
                     </div>
                     <div className="flex gap-3">
                       <span className="text-indigo-400 select-none">2</span>
                       <span className="text-slate-500">// Initialize Workspace</span>
                     </div>
                     <div className="flex gap-3">
                       <span className="text-indigo-400 select-none">3</span>
                       <span className="text-purple-400">const</span>
                       <span className="text-indigo-300">app</span>
                       <span className="text-slate-300">=</span>
                       <span className="text-indigo-300">new</span>
                       <span className="text-white">Workspace</span>
                       <span className="text-slate-300">();</span>
                     </div>
                     <div className="flex gap-3 mt-4">
                       <span className="text-indigo-400 select-none">4</span>
                       <span className="text-indigo-300">app</span>
                       <span className="text-slate-300">.</span>
                       <span className="text-yellow-300">startLearning</span>
                       <span className="text-slate-300">();</span>
                     </div>
                     <div className="mt-6 flex items-center gap-2 text-emerald-400/80">
                        <Icons.CheckSimple className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider uppercase animate-pulse">Ready for development</span>
                     </div>
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                  {/* Fix: Using Icons.Fast instead of Icons.Zap */}
                  <Icons.Fast className="w-3 h-3" /> New: Gemini 2.0 Integration
                </div>
                <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">
                  Build the future <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">at the speed of thought.</span>
                </h2>
                <p className="text-slate-400 text-xl leading-relaxed max-w-md">
                  The first intelligent playground designed to teach you coding while you build.
                </p>

                <div className="pt-4 flex items-center gap-8">
                   <div className="space-y-1">
                      <div className="text-white font-bold text-2xl tracking-tight">10+</div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Languages</div>
                   </div>
                   <div className="w-px h-10 bg-slate-800"></div>
                   <div className="space-y-1">
                      <div className="text-white font-bold text-2xl tracking-tight">Real-time</div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Visualization</div>
                   </div>
                </div>
             </div>
          </div>
      </div>

    </div>
  );
};

export default LoginPage;
