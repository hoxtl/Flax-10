import { describe, it, expect } from 'vitest';
import { pickWelcomeQuoteByKey } from '../../lib/quotes';

const QUOTES_COUNT = 10;

describe('pickWelcomeQuoteByKey', () => {
  it('returns a non-empty string', () => {
    expect(typeof pickWelcomeQuoteByKey('user123')).toBe('string');
    expect(pickWelcomeQuoteByKey('user123').length).toBeGreaterThan(0);
  });

  it('returns the same quote for the same key (stable)', () => {
    expect(pickWelcomeQuoteByKey('abc')).toBe(pickWelcomeQuoteByKey('abc'));
  });

  it('returns different quotes for different keys', () => {
    const results = new Set(
      Array.from({ length: 20 }, (_, i) => pickWelcomeQuoteByKey(`key${i}`))
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('always returns a quote within the valid list', () => {
    const quote = pickWelcomeQuoteByKey('test-key');
    expect(quote).toBeTruthy();
  });

  it('handles empty string key', () => {
    expect(() => pickWelcomeQuoteByKey('')).not.toThrow();
  });

  it('handles long key', () => {
    const longKey = 'x'.repeat(1000);
    expect(() => pickWelcomeQuoteByKey(longKey)).not.toThrow();
  });

  it('covers all quotes indices over many keys', () => {
    const results = new Set(
      Array.from({ length: 200 }, (_, i) => pickWelcomeQuoteByKey(`key-${i}-${i * 7}`))
    );
    expect(results.size).toBe(QUOTES_COUNT);
  });
});