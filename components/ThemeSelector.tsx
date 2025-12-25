import React, { useRef, useState, useEffect } from 'react';
import { Icons } from './Icon';
import { EditorTheme } from '../types';
import { THEMES } from '../data/themes';

interface ThemeSelectorProps {
  currentTheme: EditorTheme;
  onSelect: (theme: EditorTheme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
        title="Change Editor Theme"
      >
        <Icons.Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-800 bg-slate-950">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Theme</h3>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onSelect(theme);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                  currentTheme.id === theme.id 
                    ? 'bg-indigo-600/10 text-indigo-400' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Theme Preview Dot */}
                  <div className={`w-4 h-4 rounded-full border border-white/10 shadow-sm ${theme.colors.background.replace('text-', 'bg-').replace('bg-', 'bg-')}`}></div>
                  <span>{theme.name}</span>
                </div>
                {currentTheme.id === theme.id && <Icons.CheckSimple className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;