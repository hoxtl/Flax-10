import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SocietyCard from '../../../components/society/SocietyCard';

const society = {
    id: 1,
    name: 'Chess Club',
    member_count: 42,
    is_ratified: false,
    cover_image: null,
    image: null,
};

describe('SocietyCard', () => {
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
        expect(container.firstChild.style.backgroundImage).toContain('/img.jpg');
    });

    it('uses image when cover_image is not available', () => {
        const { container } = render(<SocietyCard society={{ ...society, image: '/alt.jpg' }} onClick={vi.fn()} />);
        expect(container.firstChild.style.backgroundImage).toContain('/alt.jpg');
    });

    it('calls onReport when report button clicked and not reported', () => {
        const onReport = vi.fn();
        render(<SocietyCard society={society} onClick={vi.fn()} onReport={onReport} />);
        fireEvent.click(screen.getByTitle('Report society'));
        expect(onReport).toHaveBeenCalledWith(society);
    });

    it('calls onUnreport when report button clicked and already reported', () => {
        const onUnreport = vi.fn();
        render(<SocietyCard society={{ ...society, has_reported: true }} onClick={vi.fn()} onUnreport={onUnreport} />);
        fireEvent.click(screen.getByTitle(/unreport/i));
        expect(onUnreport).toHaveBeenCalledWith(expect.objectContaining({ has_reported: true }));
    });

    it('does not throw when report clicked without onReport or onUnreport', () => {
        render(<SocietyCard society={society} onClick={vi.fn()} />);
        expect(() => fireEvent.click(screen.getByTitle('Report society'))).not.toThrow();
    });
});
