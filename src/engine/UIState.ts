import { create } from 'zustand';

interface UIState {
  showSaveLoad: boolean;
  showHistory: boolean;
  showSettings: boolean;
  showStats: boolean;
  showHelp: boolean;
  
  openSaveLoad: () => void;
  closeSaveLoad: () => void;
  openHistory: () => void;
  closeHistory: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openStats: () => void;
  closeStats: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showSaveLoad: false,
  showHistory: false,
  showSettings: false,
  showStats: false,
  showHelp: false,
  
  openSaveLoad: () => set({ showSaveLoad: true }),
  closeSaveLoad: () => set({ showSaveLoad: false }),
  openHistory: () => set({ showHistory: true }),
  closeHistory: () => set({ showHistory: false }),
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  openStats: () => set({ showStats: true }),
  closeStats: () => set({ showStats: false }),
  openHelp: () => set({ showHelp: true }),
  closeHelp: () => set({ showHelp: false }),
  closeAll: () => set({ 
    showSaveLoad: false, 
    showHistory: false, 
    showSettings: false, 
    showStats: false,
    showHelp: false 
  }),
}));