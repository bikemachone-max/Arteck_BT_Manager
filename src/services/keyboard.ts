// Real keyboard event dispatcher for macro execution
// Uses the actual KeyboardEvent API to dispatch real keystrokes

export interface KeyMapping {
  key: string;
  code: string;
  keyCode: number;
  requiresShift?: boolean;
}

// Map of common keys to their KeyboardEvent properties
const KEY_MAP: Record<string, KeyMapping> = {
  // Letters
  ...Object.fromEntries(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((k) => [
      k,
      { key: k.toLowerCase(), code: `Key${k}`, keyCode: k.charCodeAt(0) },
    ])
  ),
  // Numbers
  ...Object.fromEntries(
    '0123456789'.split('').map((k) => [
      k,
      { key: k, code: `Digit${k}`, keyCode: k.charCodeAt(0) },
    ])
  ),
  // Function keys
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [
      `F${i + 1}`,
      { key: `F${i + 1}`, code: `F${i + 1}`, keyCode: 112 + i },
    ])
  ),
  // Special keys
  Enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
  Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
  Tab: { key: 'Tab', code: 'Tab', keyCode: 9 },
  Space: { key: ' ', code: 'Space', keyCode: 32 },
  Backspace: { key: 'Backspace', code: 'Backspace', keyCode: 8 },
  Delete: { key: 'Delete', code: 'Delete', keyCode: 46 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  Home: { key: 'Home', code: 'Home', keyCode: 36 },
  End: { key: 'End', code: 'End', keyCode: 35 },
  PageUp: { key: 'PageUp', code: 'PageUp', keyCode: 33 },
  PageDown: { key: 'PageDown', code: 'PageDown', keyCode: 34 },
  // Modifiers
  Ctrl: { key: 'Control', code: 'ControlLeft', keyCode: 17 },
  Alt: { key: 'Alt', code: 'AltLeft', keyCode: 18 },
  Shift: { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
  Meta: { key: 'Meta', code: 'MetaLeft', keyCode: 91 },
  // Symbols
  '-': { key: '-', code: 'Minus', keyCode: 189 },
  '=': { key: '=', code: 'Equal', keyCode: 187 },
  '[': { key: '[', code: 'BracketLeft', keyCode: 219 },
  ']': { key: ']', code: 'BracketRight', keyCode: 221 },
  '\\': { key: '\\', code: 'Backslash', keyCode: 220 },
  ';': { key: ';', code: 'Semicolon', keyCode: 186 },
  "'": { key: "'", code: 'Quote', keyCode: 222 },
  ',': { key: ',', code: 'Comma', keyCode: 188 },
  '.': { key: '.', code: 'Period', keyCode: 190 },
  '/': { key: '/', code: 'Slash', keyCode: 191 },
  '`': { key: '`', code: 'Backquote', keyCode: 192 },
};

export class KeyboardService {
  private isExecuting = false;

  // Dispatch a real keyboard event
  dispatchKeyEvent(
    type: 'keydown' | 'keyup' | 'keypress',
    key: string,
    options: {
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      metaKey?: boolean;
    } = {}
  ): boolean {
    const mapping = KEY_MAP[key] || KEY_MAP[key.toUpperCase()];
    if (!mapping) {
      console.warn(`[Keyboard] Unknown key: ${key}`);
      return false;
    }

    const event = new KeyboardEvent(type, {
      key: mapping.key,
      code: mapping.code,
      keyCode: mapping.keyCode,
      which: mapping.keyCode,
      bubbles: true,
      cancelable: true,
      ctrlKey: options.ctrlKey || false,
      altKey: options.altKey || false,
      shiftKey: options.shiftKey || false,
      metaKey: options.metaKey || false,
    });

    document.dispatchEvent(event);
    return true;
  }

  // Press and release a single key
  async pressKey(key: string, delay: number = 50): Promise<void> {
    const mapping = KEY_MAP[key] || KEY_MAP[key.toUpperCase()];
    if (!mapping) return;

    this.dispatchKeyEvent('keydown', key);
    await this.sleep(delay);
    this.dispatchKeyEvent('keyup', key);
  }

  // Execute a key combination (e.g., Ctrl+C)
  async pressCombination(keys: string[], delay: number = 50): Promise<void> {
    const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'];
    const modKeys = keys.filter((k) => modifiers.includes(k));
    const regularKeys = keys.filter((k) => !modifiers.includes(k));

    // Press modifiers down
    for (const mod of modKeys) {
      this.dispatchKeyEvent('keydown', mod);
      await this.sleep(20);
    }

    // Press regular keys
    for (const key of regularKeys) {
      await this.pressKey(key, delay);
    }

    // Release modifiers (reverse order)
    for (const mod of modKeys.reverse()) {
      this.dispatchKeyEvent('keyup', mod);
      await this.sleep(20);
    }
  }

  // Execute a macro sequence
  async executeMacro(
    keys: string[],
    delay: number = 50,
    repeat: number = 1
  ): Promise<void> {
    if (this.isExecuting) {
      console.warn('[Keyboard] Already executing a macro');
      return;
    }

    this.isExecuting = true;

    try {
      for (let r = 0; r < repeat; r++) {
        for (const key of keys) {
          // Check if it's a combination (contains +)
          if (key.includes('+')) {
            const combo = key.split('+').map((k) => k.trim());
            await this.pressCombination(combo, delay);
          } else {
            await this.pressKey(key, delay);
          }
          await this.sleep(delay);
        }
      }
    } finally {
      this.isExecuting = false;
    }
  }

  // Type a string of text
  async typeText(text: string, delay: number = 50): Promise<void> {
    if (this.isExecuting) return;
    this.isExecuting = true;

    try {
      for (const char of text) {
        const isUpperCase = char === char.toUpperCase() && char !== char.toLowerCase();
        const needsShift = '!@#$%^&*()_+{}|:"<>?~'.includes(char);

        if (needsShift) {
          this.dispatchKeyEvent('keydown', 'Shift');
          await this.sleep(10);
        }

        const keyToPress = needsShift
          ? this.getShiftedKey(char)
          : isUpperCase
          ? char.toUpperCase()
          : char;

        await this.pressKey(keyToPress, delay);

        if (needsShift) {
          this.dispatchKeyEvent('keyup', 'Shift');
        }

        await this.sleep(delay);
      }
    } finally {
      this.isExecuting = false;
    }
  }

  // Get the unshifted key for a shifted character
  private getShiftedKey(char: string): string {
    const shiftMap: Record<string, string> = {
      '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
      '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
      '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\',
      ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
      '~': '`',
    };
    return shiftMap[char] || char;
  }

  // Simulate mouse movement (for keep-alive)
  simulateMouseActivity(): void {
    const event = new MouseEvent('mousemove', {
      movementX: 0,
      movementY: 0,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  // Check if currently executing
  getIsExecuting(): boolean {
    return this.isExecuting;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const keyboardService = new KeyboardService();
