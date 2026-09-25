import { create } from 'zustand';

/** Short-lived UI state that is not saved: toasts and the ad placeholder. */
interface UiState {
  toasts: { id: number; icon: string; title: string; body: string }[];
  adOpen: boolean;
  adOpenedAt: number;
  adResolve: ((watched: boolean) => void) | null;
  toast: (icon: string, title: string, body: string) => void;
  dismissToast: (id: number) => void;
  openAd: (resolve: (watched: boolean) => void) => void;
  closeAd: (watched: boolean) => void;
}

let nextId = 1;

export const useUi = create<UiState>()((set, get) => ({
  toasts: [],
  adOpen: false,
  adOpenedAt: 0,
  adResolve: null,
  toast: (icon, title, body) => set((s) => ({ toasts: [...s.toasts, { id: nextId++, icon, title, body }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openAd: (resolve) => set({ adOpen: true, adOpenedAt: Date.now(), adResolve: resolve }),
  closeAd: (watched) => {
    get().adResolve?.(watched);
    set({ adOpen: false, adResolve: null });
  },
}));
