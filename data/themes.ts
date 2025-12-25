import { EditorTheme } from "../types";

export const THEMES: EditorTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Pro',
    type: 'dark',
    colors: {
      background: 'bg-slate-900',
      text: 'text-blue-100',
      caret: 'caret-indigo-500',
      lineNumbersBg: 'bg-slate-950',
      lineNumbersText: 'text-slate-500',
      uiBackground: 'bg-slate-950',
      uiBorder: 'border-slate-800',
      uiText: 'text-slate-400',
      placeholder: 'placeholder-slate-600'
    }
  },
  {
    id: 'dracula',
    name: 'Vampire Dark',
    type: 'dark',
    colors: {
      background: 'bg-[#282a36]',
      text: 'text-[#f8f8f2]',
      caret: 'caret-[#ff79c6]',
      lineNumbersBg: 'bg-[#21222c]',
      lineNumbersText: 'text-[#6272a4]',
      uiBackground: 'bg-[#21222c]',
      uiBorder: 'border-[#44475a]',
      uiText: 'text-[#bd93f9]',
      placeholder: 'placeholder-[#6272a4]'
    }
  },
  {
    id: 'oceanic',
    name: 'Deep Ocean',
    type: 'dark',
    colors: {
      background: 'bg-[#0f111a]',
      text: 'text-[#89ddff]',
      caret: 'caret-[#ffcb6b]',
      lineNumbersBg: 'bg-[#090b10]',
      lineNumbersText: 'text-[#464b5d]',
      uiBackground: 'bg-[#090b10]',
      uiBorder: 'border-[#1a1c25]',
      uiText: 'text-[#c3ccde]',
      placeholder: 'placeholder-[#464b5d]'
    }
  },
  {
    id: 'dawn',
    name: 'Polar Dawn',
    type: 'light',
    colors: {
      background: 'bg-white',
      text: 'text-slate-800',
      caret: 'caret-indigo-600',
      lineNumbersBg: 'bg-slate-50',
      lineNumbersText: 'text-slate-400',
      uiBackground: 'bg-white',
      uiBorder: 'border-slate-200',
      uiText: 'text-slate-600',
      placeholder: 'placeholder-slate-300'
    }
  },
  {
    id: 'forest',
    name: 'Zen Forest',
    type: 'dark',
    colors: {
      background: 'bg-[#1b2b24]',
      text: 'text-[#d4f5dd]',
      caret: 'caret-[#4ade80]',
      lineNumbersBg: 'bg-[#111f1a]',
      lineNumbersText: 'text-[#4a6b5d]',
      uiBackground: 'bg-[#111f1a]',
      uiBorder: 'border-[#2d4a3e]',
      uiText: 'text-[#86efac]',
      placeholder: 'placeholder-[#2d4a3e]'
    }
  }
];