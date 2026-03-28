import fs from 'node:fs';
import path from 'node:path';
import '@testing-library/jest-dom';

const coverageTmpDir = path.resolve(process.cwd(), 'coverage/.tmp');
try {
    fs.mkdirSync(coverageTmpDir, { recursive: true });
} catch (error) {
    // Ignore filesystem race conditions while preparing coverage output directories.
}

global.ResizeObserver = global.ResizeObserver || class ResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
});

Object.defineProperty(window, 'scrollTo', {
    value: () => {},
    writable: true,
});
