import React, { useState } from 'react';
import { Icons } from './Icon';
import { loginWithGoogle, loginAsGuest } from '../services/firebase';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onSkip: () => void; 
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{message: string, isConfigError: boolean, domain?: string} | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (e: any) {
      console.error("Google Login Error:", e);
      const code = e?.code || '';
      
      if (code === 'auth/unauthorized-domain') {
        // Automatically detect the current domain to help the user
        const currentDomain = window.location.hostname;
        setError({
          message: "Domain not authorized.",
          isConfigError: true,
          domain: currentDomain
        });
      } else if (code === 'auth/popup-closed-by-user') {
        setError({ message: "Sign-in cancelled.", isConfigError: false });
      } else if (code === 'auth/popup-blocked') {
        setError({ message: "Popup blocked. Please allow popups for this site.", isConfigError: false });
      } else {
        setError({ message: e.message || "Could not connect to Google.", isConfigError: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginAsGuest();
      onLoginSuccess(user);
    } catch (e: any) {
      console.warn("Guest login failed, falling back to local mode:", e);
      onSkip(); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans text-slate-200">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm p-8">
        
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
            <div className="relative p-1 bg-slate-900 rounded-full border border-slate-800">
              <img 
                src="/logo.png" 
                alt="CODE WITH S" 
                className="w-20 h-20 rounded-full object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg class="w-10 h-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
                  icon.className = "flex items-center justify-center w-20 h-20";
                  e.currentTarget.parentElement?.appendChild(icon);
                }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">CODE WITH S</h1>
          <p className="text-slate-400 text-sm">Your intelligent coding workspace.</p>
        </div>

        {/* Login Container */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
          
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-70 group"
            >
              {isLoading ? (
                <Icons.Spinner className="animate-spin w-5 h-5"/> 
              ) : (
                <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              Continue with Google
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-slate-900/80 px-2 text-slate-600">Or</span></div>
            </div>

            <button 
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 font-medium py-3 rounded-xl hover:bg-slate-700 hover:text-white transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <Icons.User className="w-5 h-5" />
              Continue as Guest
            </button>
          </div>

          {error && (
            <div className={`mt-5 p-3 rounded-lg flex flex-col gap-2 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 ${
              error.isConfigError ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              <div className="flex items-start gap-2">
                <Icons.Error className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-semibold">{error.message}</span>
              </div>
              
              {error.isConfigError && error.domain && (
                <div className="ml-6 flex flex-col gap-2">
                  <p className="opacity-80">
                    Go to <b>Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains</b> and add:
                  </p>
                  <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-amber-500/30 font-mono select-all">
                    <span className="truncate">{error.domain}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-slate-600 leading-normal">
            By continuing, you accept our Terms of Service. <br/>
            Guest sessions are saved locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;