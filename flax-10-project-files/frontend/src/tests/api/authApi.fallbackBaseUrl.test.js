import { afterEach, describe, expect, it, vi } from 'vitest';

describe('authService base URL fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('falls back to /api when VITE_API_BASE_URL is empty', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ detail: 'ok' }),
    });

    const { authService } = await import('../../api/authApi');
    await authService.login({ username: 'fallback', password: 'secret' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/login/',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
