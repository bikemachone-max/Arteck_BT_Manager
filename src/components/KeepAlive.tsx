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
  Bluetooth,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function KeepAlive() {
  const {
    btAvailable,
    connectedDevices,
    keepAliveEnabled,
    keepAliveInterval,
    keepAliveDeviceId,
    keepAlivePingCount,
    keepAliveLastPing,
    setKeepAliveInterval,
    startKeepAlive,
    stopKeepAlive,
    scanForDevice,
    connectToDevice,
    disconnectDevice,
    reconnectDevice,
    readBattery,
    sendKeepAlivePing,
    logs,
  } = useStore();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceNameFilter, setDeviceNameFilter] = useState('');
  const [manualPingActive, setManualPingActive] = useState(false);

  const activeDevice = connectedDevices.find((d) => d.id === (keepAliveDeviceId || selectedDeviceId));

  const handleManualPing = async () => {
    if (!keepAliveDeviceId) return;
    setManualPingActive(true);
    await sendKeepAlivePing(keepAliveDeviceId);
    setTimeout(() => setManualPingActive(false), 500);
  };

  const handleToggleKeepAlive = () => {
    if (keepAliveEnabled) {
      stopKeepAlive();
    } else if (keepAliveDeviceId) {
      startKeepAlive(keepAliveDeviceId);
    }
  };

  const getStatusColor = () => {
    if (!activeDevice) return 'text-gray-400';
    if (keepAliveEnabled) return 'text-green-400';
    if (activeDevice.connected) return 'text-blue-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (!activeDevice) return 'No Device';
    if (keepAliveEnabled) return 'Keep-Alive Active';
    if (activeDevice.connected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-green-400" />
            Keep-Alive Control
          </h2>
          <p className="text-gray-400 mt-1">
            Connect to your Arteck keyboard and prevent Bluetooth timeout
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          btAvailable
            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {btAvailable ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {btAvailable ? 'Web Bluetooth Available' : 'Web Bluetooth Not Available'}
        </div>
      </div>

      {/* BT Not Available Warning */}
      {!btAvailable && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5">
          <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Web Bluetooth Not Available
          </h4>
          <p className="text-sm text-gray-300">
            Your browser doesn't support Web Bluetooth. Please use:
          </p>
          <ul className="text-sm text-gray-400 mt-2 space-y-1">
            <li>• <strong>Google Chrome</strong> (Desktop) — Full support</li>
            <li>• <strong>Microsoft Edge</strong> (Desktop) — Full support</li>
            <li>• <strong>Chrome for Android</strong> — Full support</li>
            <li>• Must be served over <strong>HTTPS</strong> or <strong>localhost</strong></li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            On Linux, enable <code className="bg-gray-800 px-1 rounded">#experimental-web-platform-features</code> in chrome://flags
          </p>
        </div>
      )}

      {/* Device Connection Panel */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Bluetooth className="w-5 h-5 text-blue-400" />
          Device Connection
        </h3>

        {/* Scan for device */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={deviceNameFilter}
            onChange={(e) => setDeviceNameFilter(e.target.value)}
            placeholder="Device name filter (e.g., 'Arteck' or leave empty for all)"
            className="flex-1 bg-gray-900/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={() => scanForDevice(deviceNameFilter || undefined)}
            disabled={!btAvailable}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Radio className="w-5 h-5" />
            Scan & Pair
          </button>
        </div>

        {/* Connected Devices List */}
        {connectedDevices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-2">Discovered Devices:</p>
            {connectedDevices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedDeviceId === device.id
                    ? 'bg-blue-500/10 border-blue-500/50'
                    : 'bg-gray-900/30 border-gray-700/30 hover:border-gray-600/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    device.connected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-white">{device.name}</p>
                    <p className="text-xs text-gray-500">
                      {device.connected ? 'Connected' : 'Not connected'}
                      {device.batteryLevel !== null && ` • Battery: ${device.batteryLevel}%`}
                      {device.services.length > 0 && ` • ${device.services.length} services`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!device.connected ? (
                    <button
                      onClick={() => {
                        connectToDevice(device.id);
                        setSelectedDeviceId(device.id);
                      }}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 text-sm font-semibold transition-all"
                    >
                      Connect
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => readBattery(device.id)}
                        className="px-3 py-2 rounded-lg bg-gray-700/50 text-gray-300 border border-gray-600/30 hover:bg-gray-700 text-sm transition-all"
                      >
                        Battery
                      </button>
                      <button
                        onClick={() => reconnectDevice(device.id)}
                        className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30 text-sm transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => disconnectDevice(device.id)}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 text-sm font-semibold transition-all"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {connectedDevices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bluetooth className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No devices discovered yet</p>
            <p className="text-xs mt-1">Click "Scan & Pair" to find your Arteck keyboard</p>
          </div>
        )}
      </div>

      {/* Keep-Alive Controls */}
      {activeDevice && activeDevice.connected && (
        <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${
          keepAliveEnabled
            ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30'
            : 'bg-gray-800/50 border-gray-700/50'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Keep-Alive for: {activeDevice.name}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Periodically reads from the device to prevent timeout disconnection
              </p>
            </div>
            <button
              onClick={handleToggleKeepAlive}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                keepAliveEnabled
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
              }`}
            >
              <Power className="w-5 h-5" />
              {keepAliveEnabled ? 'STOP' : 'START'}
            </button>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-900/30 rounded-xl">
              <div className={`text-2xl font-bold ${getStatusColor()}`}>
                {keepAlivePingCount}
              </div>
              <p className="text-xs text-gray-500">Pings Sent</p>
            </div>
            <div className="text-center p-3 bg-gray-900/30 rounded-xl">
              <div className="text-2xl font-bold text-white">
                {keepAliveInterval / 1000}s
              </div>
              <p className="text-xs text-gray-500">Interval</p>
            </div>
            <div className="text-center p-3 bg-gray-900/30 rounded-xl">
              <div className="text-2xl font-bold text-white">
                {activeDevice.batteryLevel !== null ? `${activeDevice.batteryLevel}%` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500">Battery</p>
            </div>
            <div className="text-center p-3 bg-gray-900/30 rounded-xl">
              <div className={`text-2xl font-bold ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              <p className="text-xs text-gray-500">Status</p>
            </div>
          </div>

          {/* Interval Config */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Ping Interval
            </label>
            <div className="flex gap-2">
              {[2000, 5000, 10000, 15000, 30000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => setKeepAliveInterval(ms)}
                  disabled={keepAliveEnabled}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    keepAliveInterval === ms
                      ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                      : 'bg-gray-700/30 border border-gray-600/30 text-gray-400 hover:bg-gray-700/50'
                  } disabled:opacity-50`}
                >
                  {ms / 1000}s
                </button>
              ))}
            </div>
          </div>

          {/* Manual Ping */}
          <button
            onClick={handleManualPing}
            disabled={!keepAliveDeviceId}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              manualPingActive
                ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                : 'bg-gray-700/30 text-gray-300 border border-gray-600/30 hover:bg-gray-700/50'
            }`}
          >
            <Zap className={`w-5 h-5 ${manualPingActive ? 'animate-pulse' : ''}`} />
            {manualPingActive ? 'Ping Sent!' : 'Send Manual Keep-Alive Ping'}
          </button>
        </div>
      )}

      {/* Device Services Info */}
      {activeDevice && activeDevice.services.length > 0 && (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Device Services & Characteristics
          </h3>
          <div className="space-y-3">
            {activeDevice.services.map((service) => (
              <div key={service.uuid} className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{service.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{service.uuid.slice(4, 8)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {service.characteristics.map((char) => (
                    <span
                      key={char.uuid}
                      className="px-2 py-1 bg-gray-800/50 border border-gray-700/30 rounded text-xs text-gray-400"
                      title={`UUID: ${char.uuid}\nRead: ${char.properties.read}, Write: ${char.properties.write}, Notify: ${char.properties.notify}`}
                    >
                      {char.name}
                      <span className="ml-1 text-gray-600">
                        {char.properties.read && 'R'}
                        {char.properties.write && 'W'}
                        {char.properties.notify && 'N'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Radio className="w-5 h-5 text-green-400" />
          Activity Log
        </h3>
        <div className="bg-black/40 rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-gray-400'
              }`}
            >
              <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5">
        <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          How This Actually Works
        </h4>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• <strong>Scan & Pair:</strong> Uses the real Web Bluetooth API to discover nearby BLE devices. Your browser will show a device picker dialog.</li>
          <li>• <strong>Connect:</strong> Establishes a real GATT connection to the device's Bluetooth server and discovers all services/characteristics.</li>
          <li>• <strong>Keep-Alive:</strong> Periodically reads the Battery Level characteristic (or Device Info) from the device. This GATT read operation keeps the BLE connection active and prevents the keyboard's idle timeout.</li>
          <li>• <strong>Battery Read:</strong> Reads the actual battery level from the device's Battery Service — a real hardware query.</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          ⚠️ Your device must be paired with your OS first. The Web Bluetooth API requires HTTPS or localhost. Works in Chrome, Edge, and Chrome for Android.
        </p>
      </div>
    </div>
  );
}
