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

vi.mock('../../api/tflService', () => ({
    tflService: {
        getTfLDelays: vi.fn().mockResolvedValue([]),
        journeyPlanner: vi.fn().mockResolvedValue(null),
    },
}));

vi.mock('../../api/userService', () => ({
    getHomeAddress: vi.fn().mockResolvedValue({}),
}));

import CampusMap from '../../pages/CampusMap/CampusMap';
import { getHomeAddress } from '../../api/userService';
import { tflService } from '../../api/tflService';

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
});
