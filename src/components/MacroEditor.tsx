import { useState } from 'react';
import { useStore, Macro } from '../store';
import { keyboardService } from '../services/keyboard';
import {
  Plus,
  Trash2,
  Save,
  X,
  Keyboard,
  Timer,
  Repeat,
  Play,
} from 'lucide-react';

export default function MacroEditor() {
  const { profiles, activeProfileId, addMacro, removeMacro, executeMacro, addLog } = useStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const [isCreating, setIsCreating] = useState(false);
  const [newMacro, setNewMacro] = useState<Partial<Macro>>({
    name: '',
    keys: [],
    delay: 50,
    repeat: 1,
  });
  const [currentKeyInput, setCurrentKeyInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const handleCreateMacro = () => {
    if (!newMacro.name || newMacro.keys?.length === 0) return;
    
    const macro: Macro = {
      id: `macro-${Date.now()}`,
      name: newMacro.name || 'Untitled Macro',
      keys: newMacro.keys || [],
      delay: newMacro.delay || 50,
      repeat: newMacro.repeat || 1,
      assignedKey: newMacro.assignedKey,
    };
    
    addMacro(activeProfileId, macro);
    setNewMacro({ name: '', keys: [], delay: 50, repeat: 1 });
    setIsCreating(false);
    addLog('success', `Macro created: ${macro.name}`);
  };

  const addKeyToMacro = (key: string) => {
    setNewMacro((prev) => ({
      ...prev,
      keys: [...(prev.keys || []), key],
    }));
    setCurrentKeyInput('');
  };

  const removeKeyFromMacro = (index: number) => {
    setNewMacro((prev) => ({
      ...prev,
      keys: (prev.keys || []).filter((_, i) => i !== index),
    }));
  };

  const handleExecuteMacro = async (macro: Macro) => {
    setExecutingId(macro.id);
    await executeMacro(macro);
    setTimeout(() => setExecutingId(null), 1000);
  };

  // Global key listener for recording
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isRecording) return;
      e.preventDefault();
      e.stopPropagation();
      
      if (e.key === 'Escape') {
        setIsRecording(false);
        return;
      }

      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey && !keys.includes('Shift')) keys.push('Shift');
      if (e.metaKey) keys.push('Meta');

      const key = e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        if (key.length === 1) {
          keys.push(key.toUpperCase());
        } else {
          keys.push(key);
        }
      }

      if (keys.length > 0) {
        const combo = keys.join('+');
        addKeyToMacro(combo);
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Keyboard className="w-7 h-7 text-purple-400" />
            Macro Editor
          </h2>
          <p className="text-gray-400 mt-1">
            Create and execute real key sequences for {activeProfile?.name || 'your device'}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 transition-all"
        >
          {isCreating ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isCreating ? 'Cancel' : 'New Macro'}
        </button>
      </div>

      {/* Create Macro Form */}
      {isCreating && (
        <div className="bg-gray-800/50 rounded-2xl border border-purple-500/30 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">Create New Macro</h3>
          
          {/* Name */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Macro Name</label>
            <input
              type="text"
              value={newMacro.name}
              onChange={(e) => setNewMacro((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Copy & Paste All, Quick Save..."
              className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Key Sequence */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Key Sequence</label>
            <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-gray-900/50 rounded-lg border border-gray-600/50">
              {(newMacro.keys || []).map((key, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-md text-purple-300 text-sm"
                >
                  {key}
                  <button
                    onClick={() => removeKeyFromMacro(i)}
                    className="text-purple-400 hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {(newMacro.keys || []).length === 0 && (
                <span className="text-gray-500 text-sm">No keys added yet</span>
              )}
            </div>
            
            {/* Key Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentKeyInput}
                onChange={(e) => setCurrentKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentKeyInput) {
                    addKeyToMacro(currentKeyInput);
                  }
                }}
                placeholder="Type key name and press Enter (e.g., 'Ctrl', 'A', 'F1')..."
                className="flex-1 bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
              />
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                    : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-700'
                }`}
              >
                {isRecording ? '🔴 Recording... (Esc to stop)' : '⌨️ Record Keys'}
              </button>
            </div>

            {/* Quick Key Buttons */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {['Ctrl', 'Alt', 'Shift', 'Enter', 'Escape', 'Tab', 'Space', 'Backspace', 'Delete',
                  'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+S', 'Ctrl+A', 'Alt+Tab', 'Alt+F4'
                ].map((key) => (
                  <button
                    key={key}
                    onClick={() => addKeyToMacro(key)}
                    className="px-2 py-1 bg-gray-700/50 border border-gray-600/30 rounded text-xs text-gray-300 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-purple-300 transition-all"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delay & Repeat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4" />
                Delay Between Keys (ms)
              </label>
              <input
                type="number"
                value={newMacro.delay}
                onChange={(e) => setNewMacro((prev) => ({ ...prev, delay: parseInt(e.target.value) || 50 }))}
                min={10}
                max={5000}
                className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                <Repeat className="w-4 h-4" />
                Repeat Count
              </label>
              <input
                type="number"
                value={newMacro.repeat}
                onChange={(e) => setNewMacro((prev) => ({ ...prev, repeat: parseInt(e.target.value) || 1 }))}
                min={1}
                max={100}
                className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleCreateMacro}
            disabled={!newMacro.name || (newMacro.keys || []).length === 0}
            className="w-full py-3 rounded-xl font-semibold bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Macro
          </button>
        </div>
      )}

      {/* Macro List */}
      <div className="space-y-3">
        {(!activeProfile?.macros || activeProfile.macros.length === 0) && !isCreating && (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/30">
            <Keyboard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No macros yet</p>
            <p className="text-gray-500 text-sm mt-1">Create your first macro to dispatch real keyboard events</p>
          </div>
        )}
        
        {activeProfile?.macros.map((macro) => (
          <div
            key={macro.id}
            className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-5 hover:border-purple-500/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-white">{macro.name}</h4>
                {macro.assignedKey && (
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 rounded text-xs text-indigo-300">
                    {macro.assignedKey}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExecuteMacro(macro)}
                  className={`p-2 rounded-lg transition-all ${
                    executingId === macro.id
                      ? 'bg-green-500/30 text-green-300'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                  title="Execute Macro (dispatches real key events)"
                >
                  <Play className={`w-4 h-4 ${executingId === macro.id ? 'animate-pulse' : ''}`} />
                </button>
                <button
                  onClick={() => removeMacro(activeProfileId, macro.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Key sequence display */}
            <div className="flex flex-wrap gap-1 mb-2">
              {macro.keys.map((key, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-gray-700/50 border border-gray-600/30 rounded text-xs text-gray-300">
                    {key}
                  </span>
                  {i < macro.keys.length - 1 && (
                    <span className="text-gray-600 text-xs">→</span>
                  )}
                </span>
              ))}
            </div>
            
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Delay: {macro.delay}ms</span>
              <span>Repeat: {macro.repeat}x</span>
              <span className="text-purple-400">Dispatches real KeyboardEvents</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
