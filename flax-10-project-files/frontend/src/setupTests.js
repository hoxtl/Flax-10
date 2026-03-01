import '@testing-library/jest-dom';

const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return store[key] || null;
        },
        setItem: function (key, value) {
            store[key] = value.toString();
        },
        removeItem: function (key) {
            delete store[key];
        },
        clear: function () {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock fetch globally to prevent ERR_INVALID_URL from relative paths in jsdom
global.fetch = import.meta.vitest?.vi?.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
    })
) || function () {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
    });
};

// If vi is available globally (it usually is in vitest)
if (typeof vi !== 'undefined') {
    global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve('')
        })
    );
}

