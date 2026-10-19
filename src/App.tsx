import { useStore } from './store';
import KeepAlive from './components/KeepAlive';
import MacroEditor from './components/MacroEditor';
import ProfileSwapper from './components/ProfileSwapper';
import RGBControl from './components/RGBControl';
import HotkeyMapper from './components/HotkeyMapper';
import {
  Activity,
  Keyboard,
  Layers,
  Palette,
  KeyRound,
  Bluetooth,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'keepalive', label: 'Keep-Alive', icon: Activity, color: 'text-green-400' },
  { id: 'macros', label: 'Macros', icon: Keyboard, color: 'text-purple-400' },
  { id: 'profiles', label: 'Profiles', icon: Layers, color: 'text-cyan-400' },
  { id: 'rgb', label: 'RGB Control', icon: Palette, color: 'text-pink-400' },
  { id: 'hotkeys', label: 'Hotkeys', icon: KeyRound, color: 'text-amber-400' },
];

function App() {
  const { activeTab, setActiveTab, keepAlive, profiles, activeProfileId } = useStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const renderContent = () => {
    switch (activeTab) {
      case 'keepalive': return <KeepAlive />;
      case 'macros': return <MacroEditor />;
      case 'profiles': return <ProfileSwapper />;
      case 'rgb': return <RGBControl />;
      case 'hotkeys': return <HotkeyMapper />;
      default: return <KeepAlive />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900/80 border-r border-gray-800/50 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">Arteck BT</h1>
              <p className="text-xs text-gray-500">Manager v1.0</p>
            </div>
          </div>
        </div>

        {/* Active Device */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Device</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeProfile?.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{activeProfile?.name}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${keepAlive.enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-400">
                    {keepAlive.enabled ? 'Protected' : 'Unprotected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-800/80 border border-gray-700/50 shadow-lg'
                    : 'hover:bg-gray-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {item.id === 'keepalive' && keepAlive.enabled && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">Quick Status</span>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Keep-Alive:</span>
                <span className={keepAlive.enabled ? 'text-green-400' : 'text-red-400'}>
                  {keepAlive.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Signals Sent:</span>
                <span className="text-white">{keepAlive.pingCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Macros:</span>
                <span className="text-white">{activeProfile?.macros.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Hotkeys:</span>
                <span className="text-white">{Object.keys(activeProfile?.hotkeys || {}).length}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-5 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {NAV_ITEMS.find((item) => item.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500">
                {activeTab === 'keepalive' && 'Prevent your keyboard from disconnecting'}
                {activeTab === 'macros' && 'Create and manage custom key sequences'}
                {activeTab === 'profiles' && 'Switch between device configurations'}
                {activeTab === 'rgb' && 'Customize your keyboard lighting'}
                {activeTab === 'hotkeys' && 'Assign custom actions to any key'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                keepAlive.enabled
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${keepAlive.enabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {keepAlive.enabled ? 'Protected' : 'At Risk'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-6xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
