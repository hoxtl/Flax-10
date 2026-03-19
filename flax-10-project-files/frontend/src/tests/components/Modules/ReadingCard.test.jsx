import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingCard from '../../../components/Modules/ReadingCard';

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
    formatDate: vi.fn(() => '13 Apr 2026'),
}));

vi.mock('../../../components/Modules/DeadlineCard.module.css', () => ({ default: { } }));

const reading = {
    id: 1, title: 'Module Handbook', chapter: 'Ch.1',
    start_page: 13, end_page: 63, page_count: 50,
    duration_minutes: 60, deadline: '2026-04-13T00:00:00',
};

describe('ReadingCard', () => {
    it('should render title', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} />);
        expect(screen.getByText('Module Handbook')).toBeInTheDocument();
    });

    it('should render chapter if available', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('Ch.1')).toBeInTheDocument();
    });

    it('should render page range', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText(/pp 13-63/)).toBeInTheDocument();
    });

    it('should render estimated minutes', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()}  />);
        expect(screen.getByText(/60 mins/)).toBeInTheDocument();
    });
});