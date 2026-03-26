/**
 * Shared helpers for compact test data factories.
 */

import { vi } from "vitest";

export function createFnMap(names) {
  return Object.fromEntries(names.map((name) => [name, vi.fn()]));
}

export function mergeNested(base, overrides = {}, nestedKeys = []) {
  return nestedKeys.reduce(
    (next, key) => ({ ...next, [key]: { ...base[key], ...(overrides[key] || {}) } }),
    { ...base, ...overrides },
  );
}
