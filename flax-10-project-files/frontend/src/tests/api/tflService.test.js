import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tflService } from '../../api/tflService';

describe('tflService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('journeyPlanner', () => {
        it('returns journey data on success', async () => {
            const mockData = {
                journeys: [{
                    duration: 30,
                    legs: [{
                        mode: { name: 'tube' },
                        duration: 15,
                        instruction: { summary: 'Take tube' },
                        departurePoint: { commonName: 'King Cross' },
                        arrivalPoint: { commonName: 'Oxford Circus' },
                        routeOptions: [{ name: 'Victoria', lineIdentifier: { id: 'victoria' } }],
                        path: { lineString: null },
                    }],
                }],
            };
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const result = await tflService.journeyPlanner(51.5, -0.1, 51.52, -0.12);
            expect(result.duration).toBe(30);
            expect(result.legs).toHaveLength(1);
            expect(result.legs[0].mode).toBe('tube');
        });

        it('returns null when no journeys', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ journeys: [] }),
            });
            const result = await tflService.journeyPlanner(51.5, -0.1, 51.52, -0.12);
            expect(result).toBeNull();
        });

        it('throws when response is not ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
            await expect(tflService.journeyPlanner(51.5, -0.1, 51.52, -0.12)).rejects.toThrow('TfL API error');
        });

        it('handles leg with no instruction, departurePoint, arrivalPoint, routeOptions', async () => {
            const mockData = {
                journeys: [{
                    duration: 10,
                    legs: [{
                        mode: { name: 'walking' },
                        duration: 10,
                        path: null,
                    }],
                }],
            };
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const result = await tflService.journeyPlanner(51.5, -0.1, 51.52, -0.12);
            expect(result.legs[0].instruction).toBe('');
            expect(result.legs[0].departurePoint).toBe('');
            expect(result.legs[0].path).toBeNull();
        });

        it('decodes path.lineString when present', async () => {
            const mockData = {
                journeys: [{
                    duration: 20,
                    legs: [{
                        mode: { name: 'tube' },
                        duration: 20,
                        instruction: { summary: 'Board' },
                        departurePoint: { commonName: 'A' },
                        arrivalPoint: { commonName: 'B' },
                        routeOptions: [],
                        path: { lineString: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
                    }],
                }],
            };
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const result = await tflService.journeyPlanner(51.5, -0.1, 51.52, -0.12);
            expect(result.legs[0].path).toBeDefined();
            expect(Array.isArray(result.legs[0].path)).toBe(true);
        });
    });

    describe('getTfLDelays', () => {
        it('returns delays when severity < 10', async () => {
            const mockData = [{
                id: 'victoria',
                name: 'Victoria',
                modeName: 'tube',
                lineStatuses: [{
                    statusSeverity: 5,
                    statusSeverityDescription: 'Minor Delays',
                    reason: 'Signal failure',
                }],
            }];
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const delays = await tflService.getTfLDelays();
            expect(delays).toHaveLength(1);
            expect(delays[0].lineName).toBe('Victoria');
            expect(delays[0].severity).toBe(5);
        });

        it('returns empty array when all lines have severity >= 10 (good service)', async () => {
            const mockData = [{
                id: 'central',
                name: 'Central',
                modeName: 'tube',
                lineStatuses: [{ statusSeverity: 10, statusSeverityDescription: 'Good Service' }],
            }];
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const delays = await tflService.getTfLDelays();
            expect(delays).toHaveLength(0);
        });

        it('returns empty array when fetch fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
            const delays = await tflService.getTfLDelays();
            expect(delays).toEqual([]);
        });

        it('uses fallback reason when reason is missing', async () => {
            const mockData = [{
                id: 'dlr',
                name: 'DLR',
                modeName: 'dlr',
                lineStatuses: [{ statusSeverity: 3, statusSeverityDescription: 'Delayed' }],
            }];
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const delays = await tflService.getTfLDelays();
            expect(delays[0].reason).toBe('Service Delay/Disruption');
        });
    });

    describe('getDelayLineColor', () => {
        it('returns correct color for known line', () => {
            expect(tflService.getDelayLineColor('victoria')).toBe('#0098D4');
            expect(tflService.getDelayLineColor('elizabeth')).toBe('#7156A5');
            expect(tflService.getDelayLineColor('dlr')).toBe('#00A4A7');
        });

        it('returns fallback color for unknown line', () => {
            expect(tflService.getDelayLineColor('unknown-line')).toBe('#a5a5a5ff');
        });
    });

    describe('decodeTfLPolyline', () => {
        it('returns empty array for falsy input', () => {
            expect(tflService.decodeTfLPolyline(null)).toEqual([]);
            expect(tflService.decodeTfLPolyline('')).toEqual([]);
        });

        it('decodes a valid polyline string', () => {
            // Simple encoded polyline for a single point
            const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
            const result = tflService.decodeTfLPolyline(encoded);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveLength(2);
        });

        it('decodes multiple points when encoded string has repeated pattern', () => {
            // Longer encoded string to exercise full while loop (lat and lng decoding)
            const encoded = 'gxs}Fxw}Cu@';
            const result = tflService.decodeTfLPolyline(encoded);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(1);
        });
    });
});
