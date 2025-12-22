import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Icons } from './Icon';
import { loginWithGoogle, loginWithGithub, loginWithFacebook, loginAsGuest } from '../services/firebase';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onSkip: () => void; 
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (method: 'google' | 'github' | 'facebook' | 'guest') => {
    setIsLoading(true);
    setError('');
    try {
      let user;
      if (method === 'google') user = await loginWithGoogle();
      else if (method === 'github') user = await loginWithGithub();
      else if (method === 'facebook') user = await loginWithFacebook();
      else if (method === 'guest') user = await loginAsGuest();
      
      onLoginSuccess(user);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("configuration is missing")) {
        // Fallback: If they tried a provider but Firebase is missing, 
        // log them in as an offline guest automatically.
        const offlineUser = { 
          uid: 'offline-guest', 
          isAnonymous: true, 
          displayName: 'Guest (Offline)' 
        };
        onLoginSuccess(offlineUser);
      } else {
        setError("Authentication failed. Please check your connection or try another method.");
      }
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

      <div className="relative z-10 w-full max-w-md p-8">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
            <div className="relative p-1 bg-slate-900 rounded-full border border-slate-800">
              <img 
                src="/logo.png" 
                alt="CODE WITH S" 
                className="w-24 h-24 rounded-full object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Fallback to icon if image missing
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg class="w-12 h-12 text-indigo-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
                  icon.className = "flex items-center justify-center w-24 h-24";
                  e.currentTarget.parentElement?.appendChild(icon);
                }}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">CODE WITH S</h1>
          <p className="text-slate-400 text-lg">Your intelligent, cloud-synced coding playground.</p>
        </div>

        {/* Login Container */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 text-center">
            Sign in to continue
          </h2>

          <div className="space-y-3">
            <button 
              onClick={() => handleLogin('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <Icons.Spinner className="animate-spin w-5 h-5"/> : <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />}
              Continue with Google
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleLogin('github')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-white font-medium py-3 rounded-xl hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                <Icons.Github className="w-5 h-5" />
                GitHub
              </button>
              <button 
                onClick={() => handleLogin('facebook')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-[#1877F2] text-white font-medium py-3 rounded-xl hover:bg-[#166fe5] transition-all active:scale-[0.98] disabled:opacity-70"
              >
                <Icons.Facebook className="w-5 h-5 fill-current" />
                Facebook
              </button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900/50 px-2 text-slate-500">Or</span></div>
            </div>

            <button 
              onClick={() => handleLogin('guest')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 font-medium py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <Icons.User className="w-5 h-5" />
              Continue as Guest
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <Icons.Error className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;