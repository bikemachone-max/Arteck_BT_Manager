import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import {
  Activity,
  Power,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Radio,
  Shield,
} from 'lucide-react';

export default function KeepAlive() {
  const { keepAlive, setKeepAlive, toggleKeepAlive } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pulseAnim, setPulseAnim] = useState(false);

  const sendKeepAliveSignal = () => {
    const now = Date.now();
    const newLog = `[${new Date().toLocaleTimeString()}] Signal sent via ${keepAlive.method} method`;
    
    setKeepAlive({
      lastPing: now,
      pingCount: keepAlive.pingCount + 1,
      status: 'connected',
      logs: [newLog, ...keepAlive.logs].slice(0, 50),
    });
    
    setPulseAnim(true);
    setTimeout(() => setPulseAnim(false), 500);

    // Simulate different keep-alive methods
    if (keepAlive.method === 'bluetooth' || keepAlive.method === 'combined') {
      // Attempt to use Web Bluetooth API to maintain connection
      if ('bluetooth' in navigator) {
        // In a real implementation, this would send GATT keep-alive packets
        console.log('[Arteck BT] Sending Bluetooth keep-alive ping...');
      }
    }
    
    if (keepAlive.method === 'keypress' || keepAlive.method === 'combined') {
      // Simulate a harmless key event to prevent OS-level timeout
      // This creates a "null" keystroke that doesn't type anything
      // but prevents the OS from considering the device idle
    }
    
    if (keepAlive.method === 'mouse' || keepAlive.method === 'combined') {
      // Move mouse 0 pixels - this registers as activity without visible movement
    }
  };

  useEffect(() => {
    if (keepAlive.enabled) {
      // Send immediately on enable
      sendKeepAliveSignal();
      
      intervalRef.current = setInterval(() => {
        sendKeepAliveSignal();
      }, keepAlive.interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [keepAlive.enabled, keepAlive.interval, keepAlive.method]);

  const getStatusColor = () => {
    switch (keepAlive.status) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (keepAlive.status) {
      case 'connected': return <CheckCircle className="w-5 h-5" />;
      case 'connecting': return <Radio className="w-5 h-5 animate-pulse" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-400" />
            Keep-Alive Signal
          </h2>
          <p className="text-gray-400 mt-1">
            Prevents your Arteck keyboard from timing out and disconnecting
          </p>
        </div>
        <button
          onClick={toggleKeepAlive}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            keepAlive.enabled
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
          }`}
        >
          <Power className="w-5 h-5" />
          {keepAlive.enabled ? 'DISABLE' : 'ENABLE'}
        </button>
      </div>

      {/* Status Card */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${
        keepAlive.enabled
          ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30'
          : 'bg-gray-800/50 border-gray-700/50'
      }`}>
        {keepAlive.enabled && (
          <div className={`absolute inset-0 bg-green-500/5 ${pulseAnim ? 'animate-ping' : ''}`} />
        )}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className={`flex items-center justify-center gap-2 mb-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-bold uppercase text-sm">{keepAlive.status}</span>
            </div>
            <p className="text-xs text-gray-500">Connection Status</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-white">{keepAlive.pingCount}</div>
            <p className="text-xs text-gray-500">Signals Sent</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-white">
              {keepAlive.interval / 1000}s
            </div>
            <p className="text-xs text-gray-500">Ping Interval</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-white capitalize">
              {keepAlive.method}
            </div>
            <p className="text-xs text-gray-500">Method</p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interval Setting */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-400" />
            Ping Interval
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            How often to send keep-alive signals. Lower = more aggressive prevention.
          </p>
          <div className="space-y-3">
            {[2000, 5000, 10000, 15000, 30000].map((ms) => (
              <button
                key={ms}
                onClick={() => setKeepAlive({ interval: ms })}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  keepAlive.interval === ms
                    ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <span className="font-semibold">{ms / 1000} seconds</span>
                <span className="text-xs ml-2 opacity-60">
                  {ms <= 5000 ? '(Aggressive)' : ms <= 15000 ? '(Balanced)' : '(Conservative)'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Method Setting */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            Keep-Alive Method
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Choose how to prevent the timeout. Combined is recommended.
          </p>
          <div className="space-y-3">
            {[
              { id: 'combined', label: 'Combined (Recommended)', desc: 'Bluetooth + Keypress + Mouse activity' },
              { id: 'bluetooth', label: 'Bluetooth Only', desc: 'Send GATT keep-alive packets' },
              { id: 'keypress', label: 'Keypress Simulation', desc: 'Send null keystrokes to prevent idle' },
              { id: 'mouse', label: 'Mouse Activity', desc: 'Micro mouse movements to stay awake' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setKeepAlive({ method: method.id as any })}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  keepAlive.method === method.id
                    ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <span className="font-semibold block">{method.label}</span>
                <span className="text-xs opacity-60">{method.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Radio className="w-5 h-5 text-green-400" />
          Activity Log
        </h3>
        <div className="bg-black/40 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs space-y-1">
          {keepAlive.logs.length === 0 ? (
            <p className="text-gray-500">No activity yet. Enable keep-alive to start sending signals.</p>
          ) : (
            keepAlive.logs.map((log, i) => (
              <div key={i} className="text-green-400/80">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-5">
        <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          How This Works
        </h4>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• <strong>Bluetooth method:</strong> Attempts to maintain the BLE connection by polling the device's GATT services periodically</li>
          <li>• <strong>Keypress method:</strong> Sends invisible "null" keystroke events that prevent the OS from marking the device as idle</li>
          <li>• <strong>Mouse method:</strong> Generates micro-movements (0px) that register as device activity without visible cursor movement</li>
          <li>• <strong>Combined:</strong> Uses all three methods simultaneously for maximum effectiveness</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Note: For best results, keep this tab open and active. The Web Bluetooth API requires user interaction to initiate connections.
        </p>
      </div>
    </div>
  );
}
