import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanFreeRow } from '../../../../pages/Homepage/components/MiniTimeline/PlanFreeRow';

const mockStyles = new Proxy({}, { get: (_, key) => key });

const baseRow = {
    minutes: 60,
    gapStartMins: 120,
    spacingBeforePx: 0,
    gapContext: { type: 'study' },
};

const baseDate = new Date('2024-03-08');

function renderRow(props = {}) {
    return render(
        <PlanFreeRow
            row={baseRow}
            suggestableTasks={[]}
            deadlineSuggestions={[]}
            onQuickStart={vi.fn()}
            selectedDate={baseDate}
            taskLists={[]}
            styles={mockStyles}
            slotPopoverRef={{ current: null }}
            slotPopoverRowId={null}
            setSlotPopoverRowId={vi.fn()}
            {...props}
        />
    );
}

function hasExactText(text) {
    return (_, element) => element?.textContent === text;
}

describe('PlanFreeRow', () => {
    it('renders transit gap type', () => {
        renderRow({
            row: {
                ...baseRow,
                gapContext: {
                    type: 'transit',
                    prevCampus: 'strand',
                    nextCampus: 'waterloo',
                    transitMins: 15,
                },
            },
        });
        expect(screen.getByText(/strand/i)).toBeTruthy();
    });

    it('renders transit-partial gap type', () => {
        renderRow({
            row: {
                ...baseRow,
                gapContext: {
                    type: 'transit-partial',
                    prevCampus: 'strand',
                    nextCampus: 'waterloo',
                    transitMins: 20,
                    freeAfterTransit: 40,
                },
            },
        });
        expect(screen.getByText(/strand/i)).toBeTruthy();
    });

    it('renders transit-partial with assigned task and calls onQuickStart', () => {
        const onQuickStart = vi.fn();
        const task = { title: 'Read chapter', estimated_blocks: 1 };
        renderRow({
            row: {
                ...baseRow,
                gapContext: {
                    type: 'transit-partial',
                    prevCampus: 'strand',
                    nextCampus: 'waterloo',
                    transitMins: 20,
                    freeAfterTransit: 40,
                },
            },
            assignedTask: task,
            onQuickStart,
        });
        fireEvent.click(screen.getByLabelText(`Start ${task.title}`));
        expect(onQuickStart).toHaveBeenCalledTimes(1);
    });

    it('renders personal gap type', () => {
        renderRow({ row: { ...baseRow, gapContext: { type: 'personal' } } });
        expect(screen.getByText('Short breather')).toBeTruthy();
    });

    it('renders evening gap type', () => {
        renderRow({ row: { ...baseRow, gapContext: { type: 'evening' } } });
        expect(screen.getByText('Reset')).toBeTruthy();
    });

    it('renders study gap (default) with duration label', () => {
        renderRow({ row: { ...baseRow, gapContext: { type: 'study' } } });
        expect(screen.getByText(hasExactText('1h free'))).toBeTruthy();
    });

    it('renders short study window (< 60 min) with duration label', () => {
        renderRow({ row: { ...baseRow, minutes: 30, gapContext: { type: 'study' } } });
        expect(screen.getByText(hasExactText('30m free'))).toBeTruthy();
    });

    it('renders study gap with isBestGap styling', () => {
        const { container } = renderRow({
            row: { ...baseRow, gapContext: { type: 'study' } },
            isBestGap: true,
        });
        expect(container.querySelector('.planTimelineGapShortWindowBest')).toBeTruthy();
    });

    it('renders duration 90 minutes as 1h 30m', () => {
        renderRow({
            row: { ...baseRow, minutes: 90, gapContext: { type: 'study' } },
        });
        expect(screen.getByText(hasExactText('1h 30m free'))).toBeTruthy();
    });

    it('uses deadlineSuggestions when no assignedTask', () => {
        renderRow({
            deadlineSuggestions: [{ title: 'Essay', start_due_date: '2024-03-15', assessment_title: 'CW1' }],
        });
        expect(screen.getByText(/Revision: CW1/)).toBeTruthy();
    });

    it('shows urgency emoji for overdue task', () => {
        const pastDue = new Date();
        pastDue.setDate(pastDue.getDate() - 1);
        renderRow({
            row: { ...baseRow, gapContext: { type: 'study' } },
            assignedTask: { title: 'Late task', due_date: pastDue.toISOString(), estimated_blocks: 1 },
        });
        expect(screen.getByText(/❗.*Late task/)).toBeTruthy();
    });

    it('shows urgency emoji for urgent priority task', () => {
        renderRow({
            row: { ...baseRow, gapContext: { type: 'study' } },
            assignedTask: { title: 'Urgent task', priority: 'urgent', estimated_blocks: 1 },
        });
        expect(screen.getByText(/❗.*Urgent task/)).toBeTruthy();
    });

    it('Slot in button does not throw when onQuickStart is undefined', () => {
        renderRow({
            row: { ...baseRow, gapContext: { type: 'study' } },
            assignedTask: { title: 'Task', estimated_blocks: 1 },
            onQuickStart: undefined,
        });
        fireEvent.click(screen.getByLabelText('Start Task'));
    });

    it('uses default campus labels when prevCampus/nextCampus unknown', () => {
        renderRow({
            row: {
                ...baseRow,
                gapContext: { type: 'transit', prevCampus: 'unknown', nextCampus: 'other', transitMins: 10 },
            },
        });
        expect(screen.getByText(/travel/)).toBeTruthy();
    });
});
