// Real Web Bluetooth service for connecting to BLE devices
// This handles actual device discovery, connection, GATT communication

export interface BLEDevice {
  id: string;
  name: string;
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer | null;
  connected: boolean;
  services: BLEService[];
  batteryLevel: number | null;
  lastSeen: number;
  rssi?: number;
}

export interface BLEService {
  uuid: string;
  name: string;
  characteristics: BLECharacteristic[];
}

export interface BLECharacteristic {
  uuid: string;
  name: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
  value: DataView | null;
}

// Standard BLE GATT Service UUIDs
export const GATT_SERVICES: Record<string, string> = {
  '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
  '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
  '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
  '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
  '00001812-0000-1000-8000-00805f9b34fb': 'Human Interface Device',
  '00001802-0000-1000-8000-00805f9b34fb': 'Immediate Alert',
  '00001803-0000-1000-8000-00805f9b34fb': 'Link Loss',
  '00001804-0000-1000-8000-00805f9b34fb': 'Tx Power',
  '00001805-0000-1000-8000-00805f9b34fb': 'Current Time',
  '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate',
  '0000fff0-0000-1000-8000-00805f9b34fb': 'Custom Service (common in Chinese BT devices)',
};

// Standard GATT Characteristic UUIDs
export const GATT_CHARACTERISTICS: Record<string, string> = {
  '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
  '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name',
  '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number',
  '00002a25-0000-1000-8000-00805f9b34fb': 'Serial Number',
  '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision',
  '00002a27-0000-1000-8000-00805f9b34fb': 'Hardware Revision',
  '00002a28-0000-1000-8000-00805f9b34fb': 'Software Revision',
  '00002a4d-0000-1000-8000-00805f9b34fb': 'HID Report',
  '00002a4a-0000-1000-8000-00805f9b34fb': 'HID Information',
  '00002a4b-0000-1000-8000-00805f9b34fb': 'HID Report Map',
  '00002a4c-0000-1000-8000-00805f9b34fb': 'HID Control Point',
  '00002a23-0000-1000-8000-00805f9b34fb': 'System ID',
  '00002a50-0000-1000-8000-00805f9b34fb': 'PnP ID',
};

export class BluetoothService {
  private devices: Map<string, BLEDevice> = new Map();
  private listeners: Set<(event: string, data: any) => void> = new Set();
  private keepAliveIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private notificationListeners: Map<string, EventListener> = new Map();

  // Check if Web Bluetooth is available
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Get Bluetooth availability status
  async checkAvailability(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await navigator.bluetooth.getAvailability();
    } catch {
      return false;
    }
  }

  // Request device from user via browser picker
  async requestDevice(options?: {
    nameFilter?: string;
    acceptAll?: boolean;
    services?: string[];
  }): Promise<BLEDevice | null> {
    if (!this.isAvailable()) {
      this.emit('error', 'Web Bluetooth is not available in this browser. Use Chrome/Edge.');
      return null;
    }

    try {
      const requestOpts: RequestDeviceOptions = {};

      if (options?.acceptAll) {
        requestOpts.acceptAllDevices = true;
        requestOpts.optionalServices = [
          'battery_service',
          'device_information',
          'human_interface_device',
          '0000fff0-0000-1000-8000-00805f9b34fb',
        ];
      } else if (options?.nameFilter) {
        requestOpts.filters = [{ namePrefix: options.nameFilter }];
        requestOpts.optionalServices = [
          'battery_service',
          'device_information',
          'human_interface_device',
          '0000fff0-0000-1000-8000-00805f9b34fb',
        ];
      } else if (options?.services) {
        requestOpts.filters = [{ services: options.services }];
      } else {
        // Default: show all devices
        requestOpts.acceptAllDevices = true;
        requestOpts.optionalServices = [
          'battery_service',
          'device_information',
          'human_interface_device',
          'generic_access',
          'generic_attribute',
          '0000fff0-0000-1000-8000-00805f9b34fb',
        ];
      }

      this.emit('scanning', true);
      const device = await navigator.bluetooth.requestDevice(requestOpts);
      this.emit('scanning', false);

      const bleDevice: BLEDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        device,
        server: null,
        connected: false,
        services: [],
        batteryLevel: null,
        lastSeen: Date.now(),
      };

      this.devices.set(device.id, bleDevice);
      this.emit('device_found', bleDevice);
      return bleDevice;
    } catch (error: any) {
      this.emit('scanning', false);
      if (error.name === 'NotFoundError') {
        this.emit('info', 'Device selection cancelled by user');
      } else {
        this.emit('error', `Failed to request device: ${error.message}`);
      }
      return null;
    }
  }

  // Connect to a BLE device and discover services
  async connect(deviceId: string): Promise<boolean> {
    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice) {
      this.emit('error', 'Device not found');
      return false;
    }

    try {
      this.emit('connecting', bleDevice);

      // Connect to GATT server
      const server = await bleDevice.device.gatt!.connect();
      bleDevice.server = server;
      bleDevice.connected = true;
      bleDevice.lastSeen = Date.now();

      // Listen for disconnection
      bleDevice.device.addEventListener('gattserverdisconnected', () => {
        bleDevice.connected = false;
        bleDevice.server = null;
        this.emit('disconnected', bleDevice);
        this.stopKeepAlive(deviceId);
      });

      // Discover services
      await this.discoverServices(bleDevice);

      // Try to read battery level
      await this.readBatteryLevel(bleDevice);

      this.emit('connected', bleDevice);
      return true;
    } catch (error: any) {
      bleDevice.connected = false;
      this.emit('error', `Connection failed: ${error.message}`);
      return false;
    }
  }

  // Discover all services and characteristics on a device
  async discoverServices(bleDevice: BLEDevice): Promise<void> {
    if (!bleDevice.server) return;

    try {
      const services = await bleDevice.server.getPrimaryServices();
      bleDevice.services = [];

      for (const service of services) {
        const bleService: BLEService = {
          uuid: service.uuid,
          name: GATT_SERVICES[service.uuid] || `Unknown (${service.uuid.slice(4, 8)})`,
          characteristics: [],
        };

        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            bleService.characteristics.push({
              uuid: char.uuid,
              name: GATT_CHARACTERISTICS[char.uuid] || `Char (${char.uuid.slice(4, 8)})`,
              properties: {
                read: char.properties.read,
                write: char.properties.write,
                writeWithoutResponse: char.properties.writeWithoutResponse,
                notify: char.properties.notify,
                indicate: char.properties.indicate,
              },
              value: null,
            });
          }
        } catch (e) {
          // Some characteristics may not be accessible
        }

        bleDevice.services.push(bleService);
      }

      this.emit('services_discovered', bleDevice);
    } catch (error: any) {
      this.emit('error', `Service discovery failed: ${error.message}`);
    }
  }

  // Read battery level from device
  async readBatteryLevel(bleDevice: BLEDevice): Promise<number | null> {
    if (!bleDevice.server) return null;

    try {
      const service = await bleDevice.server.getPrimaryService('battery_service');
      const characteristic = await service.getCharacteristic('battery_level');
      const value = await characteristic.readValue();
      const level = value.getUint8(0);
      bleDevice.batteryLevel = level;
      this.emit('battery_update', { deviceId: bleDevice.id, level });
      return level;
    } catch {
      // Battery service may not be available
      return null;
    }
  }

  // Read a specific characteristic value
  async readCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<DataView | null> {
    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice?.server) return null;

    try {
      const service = await bleDevice.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      const value = await characteristic.readValue();
      this.emit('characteristic_read', { deviceId, serviceUuid, characteristicUuid, value });
      return value;
    } catch (error: any) {
      this.emit('error', `Read failed: ${error.message}`);
      return null;
    }
  }

  // Write to a characteristic
  async writeCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    data: Uint8Array
  ): Promise<boolean> {
    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice?.server) return false;

    try {
      const service = await bleDevice.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);

      if (characteristic.properties.write) {
        await (characteristic as any).writeValue(data);
      } else if (characteristic.properties.writeWithoutResponse) {
        await (characteristic as any).writeValueWithoutResponse(data);
      } else {
        this.emit('error', 'Characteristic is not writable');
        return false;
      }

      this.emit('characteristic_written', { deviceId, serviceUuid, characteristicUuid, data });
      return true;
    } catch (error: any) {
      this.emit('error', `Write failed: ${error.message}`);
      return false;
    }
  }

  // Subscribe to notifications from a characteristic
  async subscribeToNotifications(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<boolean> {
    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice?.server) return false;

    try {
      const service = await bleDevice.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);

      await characteristic.startNotifications();

      const listener = (event: Event) => {
        const value = (event.target as unknown as BluetoothRemoteGATTCharacteristic).value;
        this.emit('notification', { deviceId, serviceUuid, characteristicUuid, value });
      };

      characteristic.addEventListener('characteristicvaluechanged', listener);
      const key = `${deviceId}:${serviceUuid}:${characteristicUuid}`;
      this.notificationListeners.set(key, listener);

      this.emit('subscribed', { deviceId, serviceUuid, characteristicUuid });
      return true;
    } catch (error: any) {
      this.emit('error', `Subscribe failed: ${error.message}`);
      return false;
    }
  }

  // Keep-alive: Periodically read battery level to maintain connection
  startKeepAlive(deviceId: string, intervalMs: number = 5000): void {
    this.stopKeepAlive(deviceId);

    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice?.server) {
      this.emit('error', 'Device not connected, cannot start keep-alive');
      return;
    }

    this.emit('keepalive_started', { deviceId, interval: intervalMs });

    const interval = setInterval(async () => {
      if (!bleDevice.connected || !bleDevice.server) {
        this.stopKeepAlive(deviceId);
        this.emit('keepalive_stopped', { deviceId, reason: 'disconnected' });
        return;
      }

      try {
        // Method 1: Read battery level (keeps connection alive)
        const batteryLevel = await this.readBatteryLevel(bleDevice);
        bleDevice.lastSeen = Date.now();
        this.emit('keepalive_ping', {
          deviceId,
          method: 'battery_read',
          batteryLevel,
          timestamp: Date.now(),
        });
      } catch {
        // If battery read fails, try reading device info
        try {
          await this.readCharacteristic(
            deviceId,
            '0000180a-0000-1000-8000-00805f9b34fb',
            '00002a29-0000-1000-8000-00805f9b34fb'
          );
          bleDevice.lastSeen = Date.now();
          this.emit('keepalive_ping', {
            deviceId,
            method: 'device_info_read',
            timestamp: Date.now(),
          });
        } catch {
          // Both methods failed - connection may be lost
          this.emit('keepalive_failed', { deviceId, timestamp: Date.now() });
        }
      }
    }, intervalMs);

    this.keepAliveIntervals.set(deviceId, interval);
  }

  // Stop keep-alive for a device
  stopKeepAlive(deviceId: string): void {
    const interval = this.keepAliveIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.keepAliveIntervals.delete(deviceId);
      this.emit('keepalive_stopped', { deviceId });
    }
  }

  // Disconnect from a device
  async disconnect(deviceId: string): Promise<void> {
    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice) return;

    this.stopKeepAlive(deviceId);

    if (bleDevice.server?.connected) {
      bleDevice.server.disconnect();
    }

    bleDevice.connected = false;
    bleDevice.server = null;
    this.emit('disconnected', bleDevice);
  }

  // Reconnect to a device
  async reconnect(deviceId: string): Promise<boolean> {
    const bleDevice = this.devices.get(deviceId);
    if (!bleDevice) return false;

    try {
      // Disconnect first if still connected
      if (bleDevice.server?.connected) {
        bleDevice.server.disconnect();
      }

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reconnect
      return await this.connect(deviceId);
    } catch (error: any) {
      this.emit('error', `Reconnection failed: ${error.message}`);
      return false;
    }
  }

  // Get all known devices
  getDevices(): BLEDevice[] {
    return Array.from(this.devices.values());
  }

  // Get a specific device
  getDevice(deviceId: string): BLEDevice | undefined {
    return this.devices.get(deviceId);
  }

  // Remove a device
  removeDevice(deviceId: string): void {
    this.stopKeepAlive(deviceId);
    this.disconnect(deviceId);
    this.devices.delete(deviceId);
    this.emit('device_removed', deviceId);
  }

  // Event system
  on(listener: (event: string, data: any) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: string, data: any): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (e) {
        console.error('Bluetooth event listener error:', e);
      }
    });
  }
}

// Singleton instance
export const bluetoothService = new BluetoothService();
