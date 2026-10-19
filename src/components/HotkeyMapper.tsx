import { useState } from 'react';
import { useStore } from '../store';
import {
  KeyRound,
  Link,
  Unlink,
  Mouse,
  Keyboard,
  Monitor,
  Zap,
} from 'lucide-react';

const ACTION_TYPES = [
  { id: 'macro', label: 'Run Macro', icon: Zap },
  { id: 'keystroke', label: 'Key Combination', icon: Keyboard },
  { id: 'text', label: 'Type Text', icon: Monitor },
  { id: 'app', label: 'Launch App', icon: Monitor },
  { id: 'media', label: 'Media Control', icon: Mouse },
  { id: 'system', label: 'System Action', icon: Monitor },
];

const MEDIA_ACTIONS = [
  'Play/Pause', 'Next Track', 'Previous Track', 'Volume Up',
  'Volume Down', 'Mute', 'Stop',
];

const SYSTEM_ACTIONS = [
  'Lock Screen', 'Sleep', 'Screenshot', 'Open Task Manager',
  'Show Desktop', 'Switch Window', 'Close Window',
];

const APP_SHORTCUTS = [
  'Browser', 'Terminal', 'File Manager', 'Calculator',
  'Settings', 'Mail', 'Calendar', 'Notes',
];

export default function HotkeyMapper() {
  const { profiles, activeProfileId, updateProfile } = useStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [actionType, setActionType] = useState('keystroke');
  const [actionValue, setActionValue] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleAssignHotkey = () => {
    if (!selectedKey || !actionValue) return;
    const hotkeys = { ...(activeProfile?.hotkeys || {}) };
    hotkeys[selectedKey] = `${actionType}:${actionValue}`;
    updateProfile(activeProfileId, { hotkeys });
    setSelectedKey(null);
    setActionValue('');
  };

  const handleRemoveHotkey = (key: string) => {
    const hotkeys = { ...(activeProfile?.hotkeys || {}) };
    delete hotkeys[key];
    updateProfile(activeProfileId, { hotkeys });
  };

  const handleKeyCapture = (e: React.KeyboardEvent) => {
    if (isListening) {
      e.preventDefault();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Meta');
      
      const key = e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        keys.push(key.length === 1 ? key.toUpperCase() : key);
      }
      
      if (keys.length > 0) {
        setSelectedKey(keys.join('+'));
        setIsListening(false);
      }
    }
  };

  // Visual keyboard for key selection
  const keyboardLayout = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
    ['Space'],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <KeyRound className="w-7 h-7 text-amber-400" />
          Hotkey Mapper
        </h2>
        <p className="text-gray-400 mt-1">
          Assign actions to any key — works with any connected device
        </p>
      </div>

      {/* Active Profile Indicator */}
      <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
        <span className="text-2xl">{activeProfile?.icon}</span>
        <div>
          <p className="text-white font-semibold">Configuring: {activeProfile?.name}</p>
          <p className="text-xs text-gray-400">Switch profiles to configure different devices</p>
        </div>
        <div className="ml-auto">
          <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs text-amber-300 font-semibold">
            {Object.keys(activeProfile?.hotkeys || {}).length} assigned
          </span>
        </div>
      </div>

      {/* Key Capture / Selection */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Link className="w-5 h-5 text-amber-400" />
          Select Key to Assign
        </h3>

        {/* Key Capture Button */}
        <div className="mb-4">
          <button
            onClick={() => setIsListening(!isListening)}
            onKeyDown={handleKeyCapture}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              isListening
                ? 'bg-amber-500/20 border-2 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            {isListening ? '🎯 Press any key combination...' : '🎹 Click to capture key combination'}
          </button>
          {selectedKey && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-400">Selected:</span>
              <span className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-300 font-mono font-bold">
                {selectedKey}
              </span>
              <button
                onClick={() => setSelectedKey(null)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Visual Keyboard */}
        <div className="bg-gray-900/50 rounded-xl p-4 space-y-1">
          {keyboardLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((key) => {
                const isAssigned = activeProfile?.hotkeys && Object.keys(activeProfile.hotkeys).some(k => k.includes(key));
                const isSelected = selectedKey?.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`flex items-center justify-center rounded-md text-xs font-semibold transition-all ${
                      key === 'Space' ? 'px-12' : 'px-2'
                    } py-2 ${
                      isSelected
                        ? 'bg-amber-500/40 border border-amber-400 text-amber-200'
                        : isAssigned
                        ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                        : 'bg-gray-700/50 border border-gray-600/30 text-gray-400 hover:bg-gray-600/50 hover:text-white'
                    }`}
                    style={{ minWidth: key === 'Space' ? '8rem' : '1.75rem' }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Action Configuration */}
      {selectedKey && (
        <div className="bg-gray-800/50 rounded-2xl border border-amber-500/30 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Assign action to <span className="text-amber-400">{selectedKey}</span>
          </h3>

          {/* Action Type */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Action Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ACTION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => { setActionType(type.id); setActionValue(''); }}
                    className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                      actionType === type.id
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Value */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Action Value</label>
            {actionType === 'keystroke' && (
              <input
                type="text"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                placeholder="e.g., Ctrl+C, Ctrl+Shift+T..."
                className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            )}
            {actionType === 'text' && (
              <textarea
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                placeholder="Text to type when key is pressed..."
                rows={3}
                className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            )}
            {actionType === 'media' && (
              <div className="grid grid-cols-2 gap-2">
                {MEDIA_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => setActionValue(action)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      actionValue === action
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            {actionType === 'system' && (
              <div className="grid grid-cols-2 gap-2">
                {SYSTEM_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => setActionValue(action)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      actionValue === action
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            {actionType === 'app' && (
              <div className="grid grid-cols-2 gap-2">
                {APP_SHORTCUTS.map((action) => (
                  <button
                    key={action}
                    onClick={() => setActionValue(action)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      actionValue === action
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            {actionType === 'macro' && (
              <div className="grid grid-cols-1 gap-2">
                {(activeProfile?.macros || []).length === 0 ? (
                  <p className="text-gray-500 text-sm p-3">No macros available. Create macros in the Macro Editor first.</p>
                ) : (
                  activeProfile?.macros.map((macro) => (
                    <button
                      key={macro.id}
                      onClick={() => setActionValue(macro.id)}
                      className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                        actionValue === macro.id
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      {macro.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleAssignHotkey}
            disabled={!actionValue}
            className="w-full py-3 rounded-xl font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Assign to {selectedKey}
          </button>
        </div>
      )}

      {/* Current Assignments */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Assignments</h3>
        {Object.keys(activeProfile?.hotkeys || {}).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hotkeys assigned yet</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(activeProfile?.hotkeys || {}).map(([key, action]) => {
              const [type, value] = action.split(':');
              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-gray-900/30 rounded-lg p-3 border border-gray-700/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-md text-amber-300 font-mono text-sm font-bold">
                      {key}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-gray-300 text-sm">
                      <span className="text-gray-500 capitalize">{type}:</span> {value}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveHotkey(key)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
