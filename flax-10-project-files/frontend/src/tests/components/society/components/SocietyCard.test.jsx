import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const {
    useReducedMotionMock,
    getPrimarySocietyImageMock,
    getSocietyHeroLayoutIdMock,
    getSocietyTitleLayoutIdMock,
} = vi.hoisted(() => ({
    useReducedMotionMock: vi.fn(() => false),
    getPrimarySocietyImageMock: vi.fn(),
    getSocietyHeroLayoutIdMock: vi.fn(),
    getSocietyTitleLayoutIdMock: vi.fn(),
}));

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        useReducedMotion: useReducedMotionMock,
    };
});

vi.mock('../../../../components/society/utils/societyMotion', async () => {
    const actual = await vi.importActual('../../../../components/society/utils/societyMotion');
    return {
        ...actual,
        getPrimarySocietyImage: getPrimarySocietyImageMock,
        getSocietyHeroLayoutId: getSocietyHeroLayoutIdMock,
        getSocietyTitleLayoutId: getSocietyTitleLayoutIdMock,
    };
});

import SocietyCard from '../../../../components/society/components/SocietyCard';

const society = {
    id: 1,
    name: 'Chess Club',
    member_count: 42,
    is_ratified: false,
    cover_image: null,
    image: null,
};

describe('SocietyCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useReducedMotionMock.mockReturnValue(false);
        getPrimarySocietyImageMock.mockImplementation((item) => (
            item.cover_image
            || item.image
            || item.images?.[0]?.url
            || item.images?.[0]
            || ''
        ));
        getSocietyHeroLayoutIdMock.mockImplementation((id) => `society-hero-${id ?? 'unknown'}`);
        getSocietyTitleLayoutIdMock.mockImplementation((id) => `society-title-${id ?? 'unknown'}`);
    });

    function getCardMedia(container) {
        return container.querySelector('[class*="cardMedia"]');
    }

    it('renders society name', () => {
        render(<SocietyCard society={society} onClick={vi.fn()} />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
    });

    it('renders member count', () => {
        render(<SocietyCard society={society} onClick={vi.fn()} />);
        expect(screen.getByText('42 members')).toBeTruthy();
    });

    it('does not render ratified badge when not ratified', () => {
        render(<SocietyCard society={society} onClick={vi.fn()} />);
    expect(screen.queryByTitle('Official Society')).toBeNull();
    });

    it('renders ratified badge when society is ratified', () => {
        render(<SocietyCard society={{ ...society, is_ratified: true }} onClick={vi.fn()} />);
    expect(screen.getByTitle('Official Society')).toBeTruthy();
    });

    it('calls onClick when card is clicked', () => {
        const onClick = vi.fn();
        const { container } = render(<SocietyCard society={society} onClick={onClick} />);
        fireEvent.click(container.firstChild);
        expect(onClick).toHaveBeenCalledWith(society.id);
    });

    it('does not throw when onClick is undefined', () => {
        const { container } = render(<SocietyCard society={society} />);
        expect(() => fireEvent.click(container.firstChild)).not.toThrow();
    });

    it('sets background image style when cover_image is provided', () => {
        const { container } = render(<SocietyCard society={{ ...society, cover_image: '/img.jpg' }} onClick={vi.fn()} />);
        expect(getCardMedia(container)?.style.backgroundImage).toContain('/img.jpg');
    });

    it('uses image when cover_image is not available', () => {
        const { container } = render(<SocietyCard society={{ ...society, image: '/alt.jpg' }} onClick={vi.fn()} />);
        expect(getCardMedia(container)?.style.backgroundImage).toContain('/alt.jpg');
    });

    it('omits shared layout ids when reduced motion is enabled', () => {
        useReducedMotionMock.mockReturnValue(true);

        render(<SocietyCard society={society} onClick={vi.fn()} />);

        expect(getSocietyHeroLayoutIdMock).not.toHaveBeenCalled();
        expect(getSocietyTitleLayoutIdMock).not.toHaveBeenCalled();
    });

    it('calls onReport when report button clicked and not reported', () => {
        const onReport = vi.fn();
        render(<SocietyCard society={society} onClick={vi.fn()} onReport={onReport} />);
        fireEvent.click(screen.getByRole('button', { name: 'Report society' }));
        expect(onReport).toHaveBeenCalledWith(society);
    });

    it('calls onUnreport when report button clicked and already reported', () => {
        const onUnreport = vi.fn();
        render(<SocietyCard society={{ ...society, has_reported: true }} onClick={vi.fn()} onUnreport={onUnreport} />);
        fireEvent.click(screen.getByRole('button', { name: /unreport/i }));
        expect(onUnreport).toHaveBeenCalledWith(expect.objectContaining({ has_reported: true }));
    });

    it('does not throw when report clicked without onReport or onUnreport', () => {
        render(<SocietyCard society={society} onClick={vi.fn()} />);
        expect(() => fireEvent.click(screen.getByRole('button', { name: 'Report society' }))).not.toThrow();
    });
});
