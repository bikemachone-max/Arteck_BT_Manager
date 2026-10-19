import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Palette, Sun, Sparkles, Waves, Zap, Heart, Rainbow } from 'lucide-react';

const RGB_MODES = [
  { id: 'static', name: 'Static', icon: Sun, desc: 'Single solid color' },
  { id: 'breathing', name: 'Breathing', icon: Heart, desc: 'Pulsing fade in/out' },
  { id: 'rainbow', name: 'Rainbow', icon: Rainbow, desc: 'Full spectrum cycle' },
  { id: 'wave', name: 'Wave', icon: Waves, desc: 'Color wave across keys' },
  { id: 'reactive', name: 'Reactive', icon: Zap, desc: 'Lights up on keypress' },
  { id: 'sparkle', name: 'Sparkle', icon: Sparkles, desc: 'Random twinkling' },
];

const PRESET_COLORS = [
  '#ff0000', '#ff4400', '#ff8800', '#ffcc00',
  '#ffff00', '#88ff00', '#00ff00', '#00ff88',
  '#00ffff', '#0088ff', '#0000ff', '#4400ff',
  '#8800ff', '#ff00ff', '#ff0088', '#ffffff',
];

// Keyboard layout for RGB preview
const KEYBOARD_ROWS = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Back'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Fn', 'Win', 'Alt', 'Space', 'Alt', 'Fn', 'Ctrl', '←', '↑', '↓', '→'],
];

export default function RGBControl() {
  const { rgbColor, setRgbColor, rgbMode, setRgbMode, rgbBrightness, setRgbBrightness, activeProfileId, profiles, updateProfile } = useStore();
  const [animFrame, setAnimFrame] = useState(0);
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  useEffect(() => {
    if (rgbMode === 'rainbow' || rgbMode === 'wave' || rgbMode === 'sparkle') {
      const interval = setInterval(() => {
        setAnimFrame((prev) => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [rgbMode]);

  const getKeyColor = (rowIndex: number, colIndex: number): string => {
    const opacity = rgbBrightness / 100;
    
    switch (rgbMode) {
      case 'static':
        return `${rgbColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
      case 'breathing': {
        const breath = (Math.sin(animFrame * 0.1) + 1) / 2;
        const alpha = Math.round(breath * opacity * 255).toString(16).padStart(2, '0');
        return `${rgbColor}${alpha}`;
      }
      case 'rainbow': {
        const hue = ((animFrame * 3 + colIndex * 20 + rowIndex * 30) % 360);
        return `hsla(${hue}, 100%, 50%, ${opacity})`;
      }
      case 'wave': {
        const wave = (Math.sin((animFrame * 0.2 + colIndex * 0.5)) + 1) / 2;
        const alpha = Math.round(wave * opacity * 255).toString(16).padStart(2, '0');
        return `${rgbColor}${alpha}`;
      }
      case 'reactive': {
        const random = Math.random();
        if (random > 0.9) {
          return `${rgbColor}ff`;
        }
        return `${rgbColor}22`;
      }
      case 'sparkle': {
        const sparkle = Math.random() > 0.85;
        return sparkle ? `#ffffff${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : `${rgbColor}33`;
      }
      default:
        return `${rgbColor}88`;
    }
  };

  const handleColorChange = (color: string) => {
    setRgbColor(color);
    updateProfile(activeProfileId, { rgbColor: color });
  };

  const handleModeChange = (mode: string) => {
    setRgbMode(mode);
    updateProfile(activeProfileId, { rgbMode: mode });
  };

  const handleBrightnessChange = (brightness: number) => {
    setRgbBrightness(brightness);
    updateProfile(activeProfileId, { rgbBrightness: brightness });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Palette className="w-7 h-7 text-pink-400" />
          RGB Lighting Control
        </h2>
        <p className="text-gray-400 mt-1">
          Customize your keyboard backlight — {activeProfile?.name || 'Device'}
        </p>
      </div>

      {/* Live Preview */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Live Preview
        </h3>
        <div className="space-y-1">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((key, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative flex items-center justify-center rounded-md transition-all duration-150"
                  style={{
                    backgroundColor: getKeyColor(rowIndex, colIndex),
                    minWidth: key.length > 3 ? '3rem' : key === 'Space' ? '6rem' : '1.75rem',
                    height: '1.75rem',
                    boxShadow: `0 0 8px ${getKeyColor(rowIndex, colIndex)}`,
                  }}
                >
                  <span className="text-[8px] font-bold text-black/60 select-none">
                    {key.length > 4 ? key.slice(0, 3) : key}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Lighting Mode
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {RGB_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = rgbMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                  isActive
                    ? 'bg-pink-500/20 border-2 border-pink-500/50 text-pink-300'
                    : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">{mode.name}</div>
                  <div className="text-xs opacity-60">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color & Brightness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Picker */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-pink-400" />
            Color
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-9 h-9 rounded-lg transition-all ${
                  rgbColor === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={rgbColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <div className="flex-1">
              <input
                type="text"
                value={rgbColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>
        </div>

        {/* Brightness */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-yellow-400" />
            Brightness
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                value={rgbBrightness}
                onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${rgbColor} 0%, ${rgbColor} ${rgbBrightness}%, #374151 ${rgbBrightness}%, #374151 100%)`,
                }}
              />
              <span className="text-2xl font-bold text-white w-16 text-right">
                {rgbBrightness}%
              </span>
            </div>
            <div className="flex gap-2">
              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => handleBrightnessChange(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    rgbBrightness === val
                      ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                      : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
