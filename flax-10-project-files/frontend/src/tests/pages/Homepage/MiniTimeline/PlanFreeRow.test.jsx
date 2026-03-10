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
        expect(screen.getByText('1h free')).toBeTruthy();
    });

    it('renders short study window (< 60 min) with duration label', () => {
        renderRow({ row: { ...baseRow, minutes: 30, gapContext: { type: 'study' } } });
        expect(screen.getByText('30m free')).toBeTruthy();
    });
});
