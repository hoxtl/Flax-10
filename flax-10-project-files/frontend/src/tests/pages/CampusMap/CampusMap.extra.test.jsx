import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
        getElement: vi.fn(() => document.createElement('div')),
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

vi.mock('../../api/geocodeApi', () => ({
    reverseGeocode: vi.fn().mockResolvedValue('My location'),
    geocodeAddress: vi.fn().mockResolvedValue({ latitude: 51.5, longitude: -0.1 }),
}));

import CampusMap from '../../pages/CampusMap/CampusMap';
import { getHomeAddress } from '../../api/userApi';
import { tflService } from '../../api/tflApi';

function renderCampusMap() {
    return render(
        <MemoryRouter>
            <CampusMap />
        </MemoryRouter>,
    );
}

describe('CampusMap', () => {
    async function renderLoadedCampusMap() {
        renderCampusMap();
        await waitFor(
            () => expect(screen.queryByTestId('campus-map-skeleton')).not.toBeInTheDocument(),
            { timeout: 2500 },
        );
    }

    function getStartLocationButton() {
        return screen.getByRole('button', { name: /set start to current location/i });
    }

    function getDestinationLocationButton() {
        return screen.getByRole('button', { name: /set destination to current location/i });
    }

    function getDestinationSection() {
        return screen.getByText('Destination').closest('section');
    }

    function getDestinationCampusButton(name) {
        return within(getDestinationSection()).getByRole('button', { name: new RegExp(`^${name}$`, 'i') });
    }

    function getJourneySection() {
        return screen.getByText(/Plan Custom Journey/i).closest('section');
    }

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
        window.scrollTo = vi.fn();
        // Simulate map 'load' event firing immediately
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb();
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the map container', () => {
        const { container } = renderCampusMap();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders KCL campus list', () => {
        renderCampusMap();
        expect(screen.getAllByText('Strand').length).toBeGreaterThan(0);
        expect(screen.getAllByText("Guy's").length).toBeGreaterThan(0);
        expect(screen.getAllByText('Waterloo').length).toBeGreaterThan(0);
    });

    it('renders current location buttons', async () => {
        await renderLoadedCampusMap();
        expect(getStartLocationButton()).toBeTruthy();
        expect(getDestinationLocationButton()).toBeTruthy();
    }, 15000);

    it('loads home address when available and handles home-address-updated event', async () => {
        getHomeAddress.mockResolvedValueOnce({
            home_address: 'Home',
            home_latitude: 51.49,
            home_longitude: -0.12,
        });
        renderCampusMap();

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
        getHomeAddress.mockRejectedValueOnce(new Error('network error'));
        renderCampusMap();
        await waitFor(() => expect(getHomeAddress).toHaveBeenCalled());
        expect(screen.getByText(/StudyFlax Map/i)).toBeInTheDocument();
    });

    it('calculates walking route when start location and campus selected', async () => {
        await renderLoadedCampusMap();

        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        // walking card shows duration and distance
        await waitFor(() => expect(screen.getByText('Walking')).toBeInTheDocument());
        expect(screen.getByText(/Duration/)).toBeTruthy();
        expect(screen.getByText(/Distance/)).toBeTruthy();

        // show directions toggle reveals step instructions
        fireEvent.click(screen.getByText('Show directions'));
        expect(screen.getByText('Walk straight')).toBeTruthy();
        expect(screen.getByText('Turn left')).toBeTruthy();
    }, 15000);

    it('renders TfL error when journeyPlanner returns null', async () => {
        tflService.journeyPlanner.mockResolvedValueOnce(null);
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));

        await waitFor(() => {
            expect(tflService.journeyPlanner).toHaveBeenCalled();
        });
        expect(screen.getByText(/No TfL journey found/i)).toBeTruthy();
    }, 15000);

    it('shows route error when Mapbox API fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false });
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => expect(screen.getByText(/Could not calculate the route/i)).toBeTruthy());
    }, 15000);

    it('shows no walking route when API returns empty routes', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ routes: [] }) });
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => expect(screen.getByText(/No walking route found/i)).toBeTruthy());
    }, 15000);

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
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => {
            expect(screen.getByText(/2h 0m/)).toBeTruthy();
            expect(screen.getByText(/5\.5 km/)).toBeTruthy();
        });
    }, 15000);

    it('handleClearStart clears start and route', async () => {
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => expect(screen.getByText('Walking')).toBeInTheDocument());
        fireEvent.click(within(getJourneySection()).getByRole('button', { name: 'Clear' }));
        await waitFor(() => expect(screen.getByText(/Set a starting location and destination/)).toBeInTheDocument());
    }, 15000);

    it('handleClearCampus clears campus and route', async () => {
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => expect(screen.getByText('Walking')).toBeInTheDocument());
        const destinationSection = getDestinationSection();
        fireEvent.click(within(destinationSection).getByTitle('Clear'));
        await waitFor(() => expect(within(destinationSection).getByText(/Strand Campus/i)).toBeInTheDocument());
        fireEvent.click(within(destinationSection).getByTitle('Clear'));
        await waitFor(() => expect(within(destinationSection).getByText(/Select a campus or event as destination/i)).toBeInTheDocument());
        expect(screen.getByText(/Set a starting location and destination to see your journey options!/)).toBeInTheDocument();
    }, 15000);

    it('shows TfL journey when journeyPlanner returns data', async () => {
        tflService.journeyPlanner.mockResolvedValueOnce({
            duration: 25,
            legs: [
                { mode: 'walking', departurePoint: 'A', arrivalPoint: 'B', duration: 5, routeOptions: [] },
                { mode: 'tube', departurePoint: 'B', arrivalPoint: 'C', duration: 15, routeOptions: [{ name: 'Northern' }] },
            ],
        });
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => expect(screen.getByText(/Public Transport/)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Show step-by-step directions/));
        await waitFor(() => expect(screen.getByText(/Northern/)).toBeTruthy());
    }, 15000);

    it('shows TfL error when journeyPlanner throws', async () => {
        tflService.journeyPlanner.mockRejectedValueOnce(new Error('err'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        fireEvent.click(getDestinationCampusButton('Strand'));
        await waitFor(() => expect(screen.getByText(/Failed to calculate TfL route/i)).toBeTruthy());
    }, 15000);

    it('shows good service when disruptions empty', async () => {
        tflService.getTfLDelays.mockResolvedValueOnce([]);
        renderCampusMap();
        await waitFor(() => expect(screen.getByText(/Good Service!/)).toBeInTheDocument());
    });

    it('shows disruptions list when TfL returns delays', async () => {
        tflService.getTfLDelays.mockResolvedValueOnce([
            { lineName: 'Central', severityDescription: 'Minor', reason: 'Signal failure', color: '#E32017' },
        ]);
        renderCampusMap();
        await waitFor(() => expect(screen.getByText(/Central/)).toBeInTheDocument());
        expect(screen.getByText(/Minor/)).toBeInTheDocument();
    });

    it('geolocation error clears locating state', async () => {
        let errCb;
        global.navigator.geolocation = {
            getCurrentPosition: vi.fn((_s, err) => { errCb = err; }),
        };
        await renderLoadedCampusMap();
        fireEvent.click(getStartLocationButton());
        if (errCb) errCb();
        await waitFor(() => expect(getStartLocationButton()).toBeInTheDocument());
    }, 15000);

    it('campus list click selects and shows address', async () => {
        await renderLoadedCampusMap();
        fireEvent.click(getDestinationCampusButton("Guy's"));
        await waitFor(() => expect(screen.getAllByText(/Guy's Campus/)[0]).toBeInTheDocument());
    }, 15000);

    it('shows empty state when no start or campus', async () => {
        await renderLoadedCampusMap();
        expect(screen.getByText(/Set a starting location and destination/)).toBeInTheDocument();
    });
});
