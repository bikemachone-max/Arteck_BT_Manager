import { create } from 'zustand';
import { bluetoothService, BLEDevice } from './services/bluetooth';
import { keyboardService } from './services/keyboard';

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
  deviceId?: string;
}

export interface LogEntry {
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Bluetooth state
  btAvailable: boolean;
  btScanning: boolean;
  connectedDevices: BLEDevice[];
  logs: LogEntry[];
  addLog: (type: LogEntry['type'], message: string) => void;
  clearLogs: () => void;

  // Keep-alive state
  keepAliveEnabled: boolean;
  keepAliveInterval: number;
  keepAliveDeviceId: string | null;
  keepAlivePingCount: number;
  keepAliveLastPing: number | null;
  setKeepAliveInterval: (ms: number) => void;
  startKeepAlive: (deviceId: string) => void;
  stopKeepAlive: () => void;

  // Profiles
  profiles: Profile[];
  activeProfileId: string;
  addProfile: (profile: Profile) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  linkDeviceToProfile: (profileId: string, deviceId: string) => void;

  // Macros
  addMacro: (profileId: string, macro: Macro) => void;
  removeMacro: (profileId: string, macroId: string) => void;
  executeMacro: (macro: Macro) => Promise<void>;

  // RGB
  rgbColor: string;
  setRgbColor: (color: string) => void;
  rgbMode: string;
  setRgbMode: (mode: string) => void;
  rgbBrightness: number;
  setRgbBrightness: (brightness: number) => void;

  // Actions
  scanForDevice: (nameFilter?: string) => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<boolean>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  reconnectDevice: (deviceId: string) => Promise<boolean>;
  readBattery: (deviceId: string) => Promise<number | null>;
  sendKeepAlivePing: (deviceId: string) => Promise<void>;
}

const loadProfiles = (): Profile[] => {
  try {
    const saved = localStorage.getItem('arteck-profiles');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
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
  ];
};

const saveProfiles = (profiles: Profile[]) => {
  try {
    localStorage.setItem('arteck-profiles', JSON.stringify(profiles));
  } catch {}
};

export const useStore = create<AppState>((set, get) => {
  // Set up Bluetooth event listeners
  bluetoothService.on((event, data) => {
    const state = get();
    switch (event) {
      case 'scanning':
        set({ btScanning: data });
        break;
      case 'device_found':
        set({ connectedDevices: bluetoothService.getDevices() });
        state.addLog('success', `Found device: ${data.name}`);
        break;
      case 'connecting':
        state.addLog('info', `Connecting to ${data.name}...`);
        break;
      case 'connected':
        set({ connectedDevices: bluetoothService.getDevices() });
        state.addLog('success', `Connected to ${data.name}`);
        break;
      case 'disconnected':
        set({ connectedDevices: bluetoothService.getDevices() });
        state.addLog('warning', `Disconnected from ${data.name}`);
        if (state.keepAliveDeviceId === data.id) {
          set({ keepAliveEnabled: false, keepAliveDeviceId: null });
        }
        break;
      case 'services_discovered':
        state.addLog('info', `Discovered ${data.services.length} services on ${data.name}`);
        set({ connectedDevices: bluetoothService.getDevices() });
        break;
      case 'battery_update':
        set({ connectedDevices: bluetoothService.getDevices() });
        state.addLog('info', `Battery: ${data.level}%`);
        break;
      case 'keepalive_ping':
        set({
          keepAlivePingCount: state.keepAlivePingCount + 1,
          keepAliveLastPing: Date.now(),
        });
        break;
      case 'keepalive_started':
        state.addLog('success', `Keep-alive started (${data.interval}ms interval)`);
        break;
      case 'keepalive_stopped':
        state.addLog('info', `Keep-alive stopped${data.reason ? `: ${data.reason}` : ''}`);
        break;
      case 'keepalive_failed':
        state.addLog('error', 'Keep-alive ping failed - device may have disconnected');
        break;
      case 'error':
        state.addLog('error', data);
        break;
      case 'info':
        state.addLog('info', data);
        break;
      case 'notification':
        state.addLog('info', `Notification received on ${data.characteristicUuid.slice(4, 8)}`);
        break;
    }
  });

  // Check BT availability
  bluetoothService.checkAvailability().then((available) => {
    set({ btAvailable: available });
  });

  return {
    activeTab: 'keepalive',
    setActiveTab: (tab) => set({ activeTab: tab }),

    btAvailable: false,
    btScanning: false,
    connectedDevices: [],
    logs: [{ timestamp: Date.now(), type: 'info', message: 'Arteck BT Manager initialized' }],
    addLog: (type, message) =>
      set((s) => ({
        logs: [{ timestamp: Date.now(), type, message }, ...s.logs].slice(0, 200),
      })),
    clearLogs: () => set({ logs: [] }),

    keepAliveEnabled: false,
    keepAliveInterval: 5000,
    keepAliveDeviceId: null,
    keepAlivePingCount: 0,
    keepAliveLastPing: null,
    setKeepAliveInterval: (ms) => set({ keepAliveInterval: ms }),
    startKeepAlive: (deviceId) => {
      const state = get();
      bluetoothService.startKeepAlive(deviceId, state.keepAliveInterval);
      set({
        keepAliveEnabled: true,
        keepAliveDeviceId: deviceId,
        keepAlivePingCount: 0,
      });
    },
    stopKeepAlive: () => {
      const state = get();
      if (state.keepAliveDeviceId) {
        bluetoothService.stopKeepAlive(state.keepAliveDeviceId);
      }
      set({ keepAliveEnabled: false, keepAliveDeviceId: null });
    },

    profiles: loadProfiles(),
    activeProfileId: 'default',
    addProfile: (profile) => {
      set((s) => {
        const profiles = [...s.profiles, profile];
        saveProfiles(profiles);
        return { profiles };
      });
    },
    removeProfile: (id) =>
      set((s) => {
        const profiles = s.profiles.filter((p) => p.id !== id);
        saveProfiles(profiles);
        return {
          profiles,
          activeProfileId: s.activeProfileId === id ? 'default' : s.activeProfileId,
        };
      }),
    setActiveProfile: (id) => set({ activeProfileId: id }),
    updateProfile: (id, updates) =>
      set((s) => {
        const profiles = s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p));
        saveProfiles(profiles);
        return { profiles };
      }),
    linkDeviceToProfile: (profileId, deviceId) => {
      const state = get();
      state.updateProfile(profileId, { deviceId });
    },

    addMacro: (profileId, macro) =>
      set((s) => {
        const profiles = s.profiles.map((p) =>
          p.id === profileId ? { ...p, macros: [...p.macros, macro] } : p
        );
        saveProfiles(profiles);
        return { profiles };
      }),
    removeMacro: (profileId, macroId) =>
      set((s) => {
        const profiles = s.profiles.map((p) =>
          p.id === profileId ? { ...p, macros: p.macros.filter((m) => m.id !== macroId) } : p
        );
        saveProfiles(profiles);
        return { profiles };
      }),
    executeMacro: async (macro) => {
      get().addLog('info', `Executing macro: ${macro.name}`);
      await keyboardService.executeMacro(macro.keys, macro.delay, macro.repeat);
      get().addLog('success', `Macro completed: ${macro.name}`);
    },

    rgbColor: '#6366f1',
    setRgbColor: (color) => set({ rgbColor: color }),
    rgbMode: 'static',
    setRgbMode: (mode) => set({ rgbMode: mode }),
    rgbBrightness: 80,
    setRgbBrightness: (brightness) => set({ rgbBrightness: brightness }),

    scanForDevice: async (nameFilter) => {
      const state = get();
      state.addLog('info', 'Scanning for Bluetooth devices...');
      await bluetoothService.requestDevice({
        nameFilter,
        acceptAll: !nameFilter,
      });
    },

    connectToDevice: async (deviceId) => {
      const state = get();
      state.addLog('info', 'Connecting...');
      return await bluetoothService.connect(deviceId);
    },

    disconnectDevice: async (deviceId) => {
      await bluetoothService.disconnect(deviceId);
      set({ connectedDevices: bluetoothService.getDevices() });
    },

    reconnectDevice: async (deviceId) => {
      const state = get();
      state.addLog('info', 'Reconnecting...');
      return await bluetoothService.reconnect(deviceId);
    },

    readBattery: async (deviceId) => {
      const device = bluetoothService.getDevice(deviceId);
      if (!device) return null;
      return await bluetoothService.readBatteryLevel(device);
    },

    sendKeepAlivePing: async (deviceId) => {
      const device = bluetoothService.getDevice(deviceId);
      if (!device?.server) return;
      await bluetoothService.readBatteryLevel(device);
    },
  };
});
