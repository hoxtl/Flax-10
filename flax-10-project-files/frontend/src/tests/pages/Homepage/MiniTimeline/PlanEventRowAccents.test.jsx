import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../../../pages/Homepage/utils/dateFormatUtils', () => ({
    formatTime: vi.fn(),
    formatTime12h: vi.fn(),
    fmtDurationShort: vi.fn(),
}));
vi.mock('../../../../pages/Homepage/utils/eventUtils', () => ({
    stripEmojiFromTitle: vi.fn(t => t),
}));
vi.mock('../../../../components/Settings/hooks/useSleepWarning', () => ({
    doesEventOverlapSleepWindow: vi.fn(() => false),
}));

import { PlanEventRow } from '../../../../pages/Homepage/components/MiniTimeline/PlanEventRow';

const baseRow = {
    id: 'row-1',
    item: {
        id: 1, title: 'Meeting', start_time: '2024-03-04T09:00:00Z', end_time: '2024-03-04T10:00:00Z', tag: null,
    },
    isPast: false, active: false, matchTask: null, isOverlap: false, isRoutine: false, moduleCode: null,
    durationMins: 60, spacingBeforePx: 0, endMins: 600,
};

function renderRow(props = {}) {
    return render(
        <PlanEventRow
            row={baseRow} rows={[baseRow]} taskLists={[]} conflictPopoverRowId={null} conflictPopoverRef={{ current: null }}
            setConflictPopoverRowId={vi.fn()} onConflictAutoMove={vi.fn()} onPushTomorrow={vi.fn()} onEdit={vi.fn()}
            onCardClick={vi.fn()} onEventContextMenu={vi.fn()} onTaskToggle={vi.fn()} onToggleComplete={vi.fn()} onReschedule={vi.fn()}
            completedEventIds={[]} selectedDate={new Date('2024-03-04')} isToday={true} getTag={vi.fn(() => null)}
            styles={{ planTimelineCardAccent: 'accent' }} sleepWindow={null} {...props}
        />
    );
}

describe('PlanEventRowAccents', () => {
    it('renders lecture accent for lecture tag', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: 'lecture', title: 'CS Lecture' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-lecture)');
    });

    it('renders routine accent for lunch title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'Lunch' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-routine)');
    });

    it('renders wellness accent for gym title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'Gym session' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-wellness)');
    });

    it('renders society accent for KCLSU in title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'KCLSU event' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-society)');
    });

    it('renders social accent for coffee in title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'Coffee with friends' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-social)');
    });

    it('renders study accent for library in title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'Library study' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-study)');
    });

    it('renders meeting accent for seminar in title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'Seminar' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-meeting)');
    });

    it('renders admin accent for laundry in title', () => {
        renderRow({ row: { ...baseRow, item: { ...baseRow.item, tag_name: null, title: 'Laundry' } } });
        expect(document.querySelector('[style*="--card-accent"]')?.style.getPropertyValue('--card-accent')).toBe('var(--event-accent-admin)');
    });
});
