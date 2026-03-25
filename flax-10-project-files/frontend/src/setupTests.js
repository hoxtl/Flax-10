import '@testing-library/jest-dom';

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

window.scrollTo = window.scrollTo || (() => {});
