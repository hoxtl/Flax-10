import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress, reverseGeocode } from '../../api/geocodeApi';

// geocodeApi uses fetch directly, not fetchApi from client
beforeEach(() => {
    vi.stubGlobal('import', { meta: { env: { VITE_MAPBOX_TOKEN: 'test-token' } } });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('geocodeAddress', () => {
    it('returns latitude and longitude for a valid address', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                features: [{ center: [-0.127758, 51.507351], place_name: 'London, UK' }],
            }),
        });

        const result = await geocodeAddress('London');
        expect(result).toEqual({ latitude: 51.507351, longitude: -0.127758 });
    });

    it('returns null when features array is empty', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ features: [] }),
        });

        const result = await geocodeAddress('NowherePlace');
        expect(result).toBeNull();
    });

    it('returns null when features property is missing', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({}),
        });

        const result = await geocodeAddress('NowherePlace');
        expect(result).toBeNull();
    });

    it('throws when the HTTP response is not ok', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
        await expect(geocodeAddress('BadAddress')).rejects.toThrow('User home geocoding has failed');
    });

    it('includes the address in the fetch URL', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                features: [{ center: [-1.0, 52.0] }],
            }),
        });

        await geocodeAddress('King\'s College London');
        const calledUrl = global.fetch.mock.calls[0][0];
        expect(calledUrl).toContain('mapbox.places');
        expect(calledUrl).toContain('King');
        expect(calledUrl).toContain('country=GB');
    });
});

describe('reverseGeocode', () => {
    it('returns place name when features are present', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                features: [{ place_name: '10 Downing Street, London, UK' }],
            }),
        });

        const result = await reverseGeocode(51.5034, -0.1276);
        expect(result).toBe('10 Downing Street, London, UK');
    });

    it('returns null when features array is empty', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ features: [] }),
        });

        const result = await reverseGeocode(0, 0);
        expect(result).toBeNull();
    });

    it('returns null when features property is missing', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({}),
        });

        const result = await reverseGeocode(0, 0);
        expect(result).toBeNull();
    });

    it('returns null when fetch throws', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
        const result = await reverseGeocode(51.5, -0.1);
        expect(result).toBeNull();
    });

    it('returns null when json() throws', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockRejectedValue(new Error('Parse error')),
        });

        const result = await reverseGeocode(51.5, -0.1);
        expect(result).toBeNull();
    });

    it('includes coordinates in the fetch URL', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                features: [{ place_name: 'Somewhere' }],
            }),
        });

        await reverseGeocode(51.5034, -0.1276);
        const calledUrl = global.fetch.mock.calls[0][0];
        expect(calledUrl).toContain('-0.1276,51.5034');
        expect(calledUrl).toContain('mapbox.places');
    });
});
