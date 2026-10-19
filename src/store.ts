import { create } from 'zustand';

export interface Macro {
  id: string;
  name: string;
  keys: string[];
  delay: number;
  repeat: number;
  assignedKey?: string;
}

export interface Profile {
  id: string;
  name: string;
  icon: string;
  color: string;
  macros: Macro[];
  rgbMode: string;
  rgbColor: string;
  rgbBrightness: number;
  hotkeys: Record<string, string>;
  deviceType: string;
}

export interface KeepAliveState {
  enabled: boolean;
  interval: number;
  method: 'bluetooth' | 'keypress' | 'mouse' | 'combined';
  lastPing: number | null;
  pingCount: number;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  logs: string[];
}

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  keepAlive: KeepAliveState;
  setKeepAlive: (state: Partial<KeepAliveState>) => void;
  toggleKeepAlive: () => void;
  
  profiles: Profile[];
  activeProfileId: string;
  addProfile: (profile: Profile) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  
  addMacro: (profileId: string, macro: Macro) => void;
  removeMacro: (profileId: string, macroId: string) => void;
  updateMacro: (profileId: string, macroId: string, updates: Partial<Macro>) => void;
  
  rgbColor: string;
  setRgbColor: (color: string) => void;
  rgbMode: string;
  setRgbMode: (mode: string) => void;
  rgbBrightness: number;
  setRgbBrightness: (brightness: number) => void;
}

const defaultProfiles: Profile[] = [
  {
    id: 'default',
    name: 'Arteck Keyboard',
    icon: '⌨️',
    color: '#6366f1',
    macros: [],
    rgbMode: 'static',
    rgbColor: '#6366f1',
    rgbBrightness: 80,
    hotkeys: {},
    deviceType: 'keyboard',
  },
  {
    id: 'mouse-profile',
    name: 'Bluetooth Mouse',
    icon: '🖱️',
    color: '#10b981',
    macros: [],
    rgbMode: 'static',
    rgbColor: '#10b981',
    rgbBrightness: 50,
    hotkeys: {},
    deviceType: 'mouse',
  },
];

export const useStore = create<AppState>((set) => ({
  activeTab: 'keepalive',
  setActiveTab: (tab) => set({ activeTab: tab }),

  keepAlive: {
    enabled: false,
    interval: 5000,
    method: 'combined',
    lastPing: null,
    pingCount: 0,
    status: 'disconnected',
    logs: [],
  },
  setKeepAlive: (state) =>
    set((s) => ({ keepAlive: { ...s.keepAlive, ...state } })),
  toggleKeepAlive: () =>
    set((s) => ({
      keepAlive: {
        ...s.keepAlive,
        enabled: !s.keepAlive.enabled,
        status: !s.keepAlive.enabled ? 'connecting' : 'disconnected',
      },
    })),

  profiles: defaultProfiles,
  activeProfileId: 'default',
  addProfile: (profile) =>
    set((s) => ({ profiles: [...s.profiles, profile] })),
  removeProfile: (id) =>
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      activeProfileId: s.activeProfileId === id ? 'default' : s.activeProfileId,
    })),
  setActiveProfile: (id) => set({ activeProfileId: id }),
  updateProfile: (id, updates) =>
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  addMacro: (profileId, macro) =>
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === profileId ? { ...p, macros: [...p.macros, macro] } : p
      ),
    })),
  removeMacro: (profileId, macroId) =>
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === profileId
          ? { ...p, macros: p.macros.filter((m) => m.id !== macroId) }
          : p
      ),
    })),
  updateMacro: (profileId, macroId, updates) =>
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              macros: p.macros.map((m) =>
                m.id === macroId ? { ...m, ...updates } : m
              ),
            }
          : p
      ),
    })),

  rgbColor: '#6366f1',
  setRgbColor: (color) => set({ rgbColor: color }),
  rgbMode: 'static',
  setRgbMode: (mode) => set({ rgbMode: mode }),
  rgbBrightness: 80,
  setRgbBrightness: (brightness) => set({ rgbBrightness: brightness }),
}));
