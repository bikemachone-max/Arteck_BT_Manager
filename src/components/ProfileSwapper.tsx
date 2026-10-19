import { useState } from 'react';
import { useStore, Profile } from '../store';
import {
  Layers,
  Plus,
  Trash2,
  Check,
  Keyboard,
  Mouse,
  Gamepad2,
  Monitor,
  Headphones,
  Zap,
} from 'lucide-react';

const DEVICE_ICONS = [
  { icon: '⌨️', label: 'Keyboard', type: 'keyboard' },
  { icon: '🖱️', label: 'Mouse', type: 'mouse' },
  { icon: '🎮', label: 'Controller', type: 'controller' },
  { icon: '🖥️', label: 'Monitor', type: 'monitor' },
  { icon: '🎧', label: 'Headset', type: 'headset' },
  { icon: '📱', label: 'Phone', type: 'phone' },
  { icon: '💡', label: 'Smart Light', type: 'light' },
  { icon: '🔌', label: 'Other BT', type: 'other' },
];

const DEVICE_TYPE_ICONS: Record<string, any> = {
  keyboard: Keyboard,
  mouse: Mouse,
  controller: Gamepad2,
  monitor: Monitor,
  headset: Headphones,
  phone: Monitor,
  light: Zap,
  other: Zap,
};

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#64748b', '#f43f5e',
];

export default function ProfileSwapper() {
  const { profiles, activeProfileId, setActiveProfile, addProfile, removeProfile, updateProfile } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    icon: '⌨️',
    color: '#6366f1',
    deviceType: 'keyboard',
  });

  const handleCreate = () => {
    if (!newProfile.name) return;
    const profile: Profile = {
      id: `profile-${Date.now()}`,
      name: newProfile.name,
      icon: newProfile.icon,
      color: newProfile.color,
      macros: [],
      rgbMode: 'static',
      rgbColor: newProfile.color,
      rgbBrightness: 80,
      hotkeys: {},
      deviceType: newProfile.deviceType,
    };
    addProfile(profile);
    setNewProfile({ name: '', icon: '⌨️', color: '#6366f1', deviceType: 'keyboard' });
    setIsCreating(false);
  };

  const handleQuickSwap = (id: string) => {
    setActiveProfile(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="w-7 h-7 text-cyan-400" />
            Profile Swapper
          </h2>
          <p className="text-gray-400 mt-1">
            Manage profiles for all your Bluetooth devices
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Profile
        </button>
      </div>

      {/* Quick Swap Bar */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Quick Swap — Click to activate
        </h3>
        <div className="flex flex-wrap gap-3">
          {profiles.map((profile) => {
            const IconComponent = DEVICE_TYPE_ICONS[profile.deviceType] || Zap;
            const isActive = profile.id === activeProfileId;
            return (
              <button
                key={profile.id}
                onClick={() => handleQuickSwap(profile.id)}
                className={`relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-2 border-indigo-400/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-gray-700/30 border border-gray-600/30 hover:bg-gray-700/50 hover:border-gray-500/50'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-2xl">{profile.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">{profile.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{profile.deviceType}</div>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: profile.color }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Create Profile Form */}
      {isCreating && (
        <div className="bg-gray-800/50 rounded-2xl border border-cyan-500/30 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">Create New Device Profile</h3>
          
          <div>
            <label className="text-sm text-gray-400 block mb-2">Profile Name</label>
            <input
              type="text"
              value={newProfile.name}
              onChange={(e) => setNewProfile((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Living Room Speaker, Work Mouse..."
              className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Device Type</label>
            <div className="grid grid-cols-4 gap-2">
              {DEVICE_ICONS.map((device) => (
                <button
                  key={device.type}
                  onClick={() => setNewProfile((prev) => ({ ...prev, icon: device.icon, deviceType: device.type }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    newProfile.deviceType === device.type
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  <span className="text-2xl">{device.icon}</span>
                  <span className="text-xs">{device.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Profile Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewProfile((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full transition-all ${
                    newProfile.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={newProfile.color}
                onChange={(e) => setNewProfile((prev) => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!newProfile.name}
            className="w-full py-3 rounded-xl font-semibold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Profile
          </button>
        </div>
      )}

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <div
              key={profile.id}
              className={`relative rounded-2xl border p-5 transition-all ${
                isActive
                  ? 'border-indigo-500/50 bg-gradient-to-br from-indigo-900/20 to-purple-900/20'
                  : 'border-gray-700/50 bg-gray-800/50'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-400 font-semibold">
                  ACTIVE
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{profile.icon}</span>
                <div>
                  <h4 className="font-bold text-white">{profile.name}</h4>
                  <p className="text-xs text-gray-400 capitalize">{profile.deviceType}</p>
                </div>
                <div
                  className="w-4 h-4 rounded-full ml-auto"
                  style={{ backgroundColor: profile.color }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-gray-900/30 rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{profile.macros.length}</div>
                  <div className="text-xs text-gray-500">Macros</div>
                </div>
                <div className="bg-gray-900/30 rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{Object.keys(profile.hotkeys).length}</div>
                  <div className="text-xs text-gray-500">Hotkeys</div>
                </div>
                <div className="bg-gray-900/30 rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{profile.rgbBrightness}%</div>
                  <div className="text-xs text-gray-500">RGB</div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isActive && (
                  <button
                    onClick={() => handleQuickSwap(profile.id)}
                    className="flex-1 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 text-sm font-semibold transition-all"
                  >
                    Activate
                  </button>
                )}
                {profile.id !== 'default' && (
                  <button
                    onClick={() => removeProfile(profile.id)}
                    className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
