import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockMap } = vi.hoisted(() => {
    const mockMap = {
        on: vi.fn(),
        off: vi.fn(),
        remove: vi.fn(),
        addControl: vi.fn(),
        getStyle: vi.fn(() => ({ layers: [{ id: 'labels', type: 'symbol', layout: { 'text-field': 'x' } }] })),
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getSource: vi.fn(() => ({ setData: vi.fn() })),
        getLayer: vi.fn(() => null),
        setLayoutProperty: vi.fn(),
        setFilter: vi.fn(),
        flyTo: vi.fn(),
        fitBounds: vi.fn(),
    };
    return { mockMap };
});

vi.mock('mapbox-gl', () => {
    const mockPopup = {
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        isOpen: vi.fn(() => false),
    };
    const mockMarker = {
        setLngLat: vi.fn().mockReturnThis(),
        setPopup: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        getElement: vi.fn(() => document.createElement('button')),
        getPopup: vi.fn(() => mockPopup),
        togglePopup: vi.fn(),
    };
    return {
        default: {
            Map: function() { return mockMap; },
            NavigationControl: function() {},
            Marker: function() { return mockMarker; },
            Popup: function() { return mockPopup; },
            accessToken: '',
            LngLatBounds: function() { return { extend: function() { return this; } }; },
        },
    };
});

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, drag, dragConstraints, dragElastic, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
    useMotionValue: vi.fn(() => ({ set: vi.fn(), get: vi.fn(() => 0) })),
    useTransform: vi.fn(() => 0),
}));

vi.mock('../../api/tflApi', () => ({
    tflService: {
        getTfLDelays: vi.fn().mockResolvedValue([]),
        journeyPlanner: vi.fn().mockResolvedValue(null),
    },
}));

vi.mock('../../api/userApi', () => ({
    getHomeAddress: vi.fn().mockResolvedValue({}),
}));

import CampusMap from '../../pages/CampusMap/CampusMap';
import { getHomeAddress } from '../../api/userApi';
import { tflService } from '../../api/tflApi';

describe('CampusMap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // default fetch for directions
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                routes: [{
                    duration: 600,
                    distance: 1200,
                    geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                    legs: [{
                        steps: [
                            { maneuver: { instruction: 'Walk straight', type: 'turn' }, distance: 100, duration: 60 },
                            { maneuver: { instruction: 'Turn left', type: 'turn' }, distance: 200, duration: 120 },
                        ],
                    }],
                }],
            }),
        });
        // geolocation
        global.navigator.geolocation = {
            getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 51.5, longitude: -0.1 } })),
        };
        // Simulate map 'load' event firing immediately
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb();
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the map container', () => {
        const { container } = render(<CampusMap />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders KCL campus list', () => {
        render(<CampusMap />);
        expect(screen.getAllByText('Strand').length).toBeGreaterThan(0);
        expect(screen.getAllByText("Guy's").length).toBeGreaterThan(0);
        expect(screen.getAllByText('Waterloo').length).toBeGreaterThan(0);
    });

    it('renders Set My Current Location button', () => {
        render(<CampusMap />);
        expect(screen.getByText(/Set My Current Location/)).toBeTruthy();
    });

    it('loads home address when available and handles home-address-updated event', async () => {
        getHomeAddress.mockResolvedValueOnce({
            home_address: 'Home',
            home_latitude: 51.49,
            home_longitude: -0.12,
        });
        render(<CampusMap />);

        await waitFor(() => {
            expect(getHomeAddress).toHaveBeenCalled();
        });

        // Trigger update event
        window.dispatchEvent(new Event('home-address-updated'));
        await waitFor(() => {
            expect(getHomeAddress).toHaveBeenCalledTimes(2);
        });
    });

    it('handles getHomeAddress error without crashing', async () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        getHomeAddress.mockRejectedValueOnce(new Error('network error'));
        render(<CampusMap />);
        await waitFor(() => expect(getHomeAddress).toHaveBeenCalled());
        expect(errSpy).toHaveBeenCalledWith('User home could not be loaded: ', expect.any(Error));
        errSpy.mockRestore();
    });

    it('calculates walking route when start location and campus selected', async () => {
        render(<CampusMap />);

        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        // walking card shows duration and distance
        expect(screen.getByText('Walking')).toBeTruthy();
        expect(screen.getByText(/Duration/)).toBeTruthy();
        expect(screen.getByText(/Distance/)).toBeTruthy();

        // show directions toggle reveals step instructions
        fireEvent.click(screen.getByText('Show directions'));
        expect(screen.getByText('Walk straight')).toBeTruthy();
        expect(screen.getByText('Turn left')).toBeTruthy();
    });

    it('renders TfL error when journeyPlanner returns null', async () => {
        tflService.journeyPlanner.mockResolvedValueOnce(null);
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);

        await waitFor(() => {
            expect(tflService.journeyPlanner).toHaveBeenCalled();
        });
        expect(screen.getByText(/No TfL journey found/i)).toBeTruthy();
    });

    it('shows route error when Mapbox API fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false });
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => expect(screen.getByText(/Could not calculate the route/i)).toBeTruthy());
    });

    it('shows no walking route when API returns empty routes', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ routes: [] }) });
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => expect(screen.getByText(/No walking route found/i)).toBeTruthy());
    });

    it('displays duration over 1 hour and distance in km', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                routes: [{
                    duration: 7200,
                    distance: 5500,
                    geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                    legs: [{ steps: [{ maneuver: { instruction: 'Go', type: 'depart' }, distance: 5500, duration: 7200 }] }],
                }],
            }),
        });
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => {
            expect(screen.getByText(/2h 0m/)).toBeTruthy();
            expect(screen.getByText(/5\.5 km/)).toBeTruthy();
        });
    });

    it('handleClearStart clears start and route', async () => {
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => expect(screen.getByText('Walking')).toBeInTheDocument());
        fireEvent.click(screen.getAllByTitle('Clear')[0]);
        await waitFor(() => expect(screen.getByText(/Click a point on the map/)).toBeInTheDocument());
    });

    it('handleClearCampus clears campus and route', async () => {
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => expect(screen.getByText('Walking')).toBeInTheDocument());
        fireEvent.click(screen.getAllByTitle('Clear')[1]);
        await waitFor(() => expect(screen.getByText(/Select a campus or event as destination/)).toBeInTheDocument());
    });

    it('shows TfL journey when journeyPlanner returns data', async () => {
        tflService.journeyPlanner.mockResolvedValueOnce({
            duration: 25,
            legs: [
                { mode: 'walking', departurePoint: 'A', arrivalPoint: 'B', duration: 5, routeOptions: [] },
                { mode: 'tube', departurePoint: 'B', arrivalPoint: 'C', duration: 15, routeOptions: [{ name: 'Northern' }] },
            ],
        });
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => expect(screen.getByText(/Public Transport/)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Show step-by-step directions/));
        await waitFor(() => expect(screen.getByText(/Northern/)).toBeTruthy());
    });

    it('shows TfL error when journeyPlanner throws', async () => {
        tflService.journeyPlanner.mockRejectedValueOnce(new Error('err'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        fireEvent.click(screen.getAllByText('Strand')[0]);
        await waitFor(() => expect(screen.getByText(/Failed to calculate TfL route/i)).toBeTruthy());
    });

    it('shows good service when disruptions empty', async () => {
        tflService.getTfLDelays.mockResolvedValueOnce([]);
        render(<CampusMap />);
        await waitFor(() => expect(screen.getByText(/Good Service!/)).toBeInTheDocument());
    });

    it('shows disruptions list when TfL returns delays', async () => {
        tflService.getTfLDelays.mockResolvedValueOnce([
            { lineName: 'Central', severityDescription: 'Minor', reason: 'Signal failure', color: '#E32017' },
        ]);
        render(<CampusMap />);
        await waitFor(() => expect(screen.getByText(/Central/)).toBeInTheDocument());
        expect(screen.getByText(/Minor/)).toBeInTheDocument();
    });

    it('geolocation error clears locating state', async () => {
        let errCb;
        global.navigator.geolocation = {
            getCurrentPosition: vi.fn((_s, err) => { errCb = err; }),
        };
        render(<CampusMap />);
        fireEvent.click(screen.getByText(/Set My Current Location/));
        if (errCb) errCb();
        await waitFor(() => expect(screen.getByText(/Set My Current Location/)).toBeInTheDocument());
    });

    it('campus list click selects and shows address', async () => {
        render(<CampusMap />);
        fireEvent.click(screen.getAllByText("Guy's")[0]);
        await waitFor(() => expect(screen.getByText(/Great Maze Pond/)).toBeInTheDocument());
    });

    it('shows empty state when no start or campus', () => {
        render(<CampusMap />);
        expect(screen.getByText(/Set a starting location and destination/)).toBeInTheDocument();
    });
});
