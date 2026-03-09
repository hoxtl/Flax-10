import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockMap } = vi.hoisted(() => {
    const mockMap = {
        on: vi.fn(),
        off: vi.fn(),
        remove: vi.fn(),
        addControl: vi.fn(),
        getStyle: vi.fn(() => ({ layers: [] })),
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getSource: vi.fn(() => null),
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
        getTfLRoute: vi.fn().mockResolvedValue(null),
    },
}));

vi.mock('../../api/userService', () => ({
    getHomeAddress: vi.fn().mockResolvedValue(null),
}));

import CampusMap from '../../pages/CampusMap/CampusMap';

describe('CampusMap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Simulate map 'load' event firing immediately
        mockMap.on.mockImplementation((event, cb) => {
            if (event === 'load') cb();
        });
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
});
