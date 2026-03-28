import { describe, it, expect, vi } from 'vitest';
import {
    formatTimeRange,
    formatDate,
    formatDuration,
    groupHistoryByBlock,
} from '../../../components/timer/utils/historyFormatter';

describe('historyFormatter', () => {
    describe('formatTimeRange', () => {
        it('returns empty string when start or end is missing', () => {
            expect(formatTimeRange(null, null)).toBe('');
            expect(formatTimeRange('2026-01-01T10:00:00', null)).toBe('');
            expect(formatTimeRange(null, '2026-01-01T11:00:00')).toBe('');
        });

        it('returns formatted time range', () => {
            const result = formatTimeRange('2026-01-01T10:00:00', '2026-01-01T11:00:00');
            expect(result).toContain(' - ');
        });
    });

    describe('formatDate', () => {
        it('returns formatted date string', () => {
            const result = formatDate('2026-01-01T12:00:00Z');
            expect(result).toMatch(/Thu|Jan|1/);
        });
    });

    describe('formatDuration', () => {
        it('formats seconds into mm:ss', () => {
            expect(formatDuration(65)).toBe('01:05s');
        });

        it('formats hours when >= 3600 seconds', () => {
            expect(formatDuration(3661)).toBe('01:01:01s');
        });

        it('formats zero seconds', () => {
            expect(formatDuration(0)).toBe('00:00s');
        });

        it('formats exactly 1 minute', () => {
            expect(formatDuration(60)).toBe('01:00s');
        });
    });

    describe('groupHistoryByBlock', () => {
        it('returns empty array for empty input', () => {
            expect(groupHistoryByBlock([])).toEqual([]);
        });

        it('groups sessions by studyBlockId', () => {
            const history = [
                { id: 1, startTime: '2026-01-01T10:00:00', endTime: '2026-01-01T10:25:00', duration: 25, breakDuration: 5, studyBlockId: 'block1', status: 'Completed' },
                { id: 2, startTime: '2026-01-01T10:30:00', endTime: '2026-01-01T10:55:00', duration: 25, breakDuration: 0, studyBlockId: 'block1', status: 'Completed' },
                { id: 3, startTime: '2026-01-02T10:00:00', endTime: '2026-01-02T10:30:00', duration: 30, breakDuration: 0, studyBlockId: 'block2', status: 'Completed' },
            ];
            const blocks = groupHistoryByBlock(history);
            expect(blocks).toHaveLength(2);
            // Sorted newest first
            const block1 = blocks.find(b => b.id === 'block1');
            expect(block1.sessions).toHaveLength(2);
            expect(block1.totalDuration).toBe(50);
            expect(block1.totalBreak).toBe(5);
        });

        it('handles legacy sessions without studyBlockId', () => {
            const history = [
                { id: 99, date: '2026-01-01T10:00:00Z', duration: 60, status: 'Completed' }
            ];
            const blocks = groupHistoryByBlock(history);
            expect(blocks).toHaveLength(1);
            expect(blocks[0].id).toBe(99);
        });

        it('handles sessions with start_time and end_time snake_case', () => {
            const history = [
                {
                    id: 5, start_time: '2026-01-01T10:00:00', end_time: '2026-01-01T10:25:00',
                    duration: 25, break_duration: 5, study_block_id: 'blk', status: 'Completed'
                }
            ];
            const blocks = groupHistoryByBlock(history);
            expect(blocks).toHaveLength(1);
            expect(blocks[0].totalBreak).toBe(5);
        });

        it('sorts blocks by date (newest first)', () => {
            const history = [
                { id: 1, startTime: '2026-01-01T10:00:00', endTime: '2026-01-01T10:25:00', duration: 25, studyBlockId: 'old', date: '2026-01-01T10:00:00Z', status: 'Completed' },
                { id: 2, startTime: '2026-01-05T10:00:00', endTime: '2026-01-05T10:25:00', duration: 25, studyBlockId: 'new', date: '2026-01-05T10:00:00Z', status: 'Completed' },
            ];
            const blocks = groupHistoryByBlock(history);
            expect(blocks[0].id).toBe('new');
        });

        it('accumulates totalPause from sessions', () => {
            const history = [
                { id: 1, startTime: '2026-01-01T10:00:00', endTime: '2026-01-01T10:25:00', duration: 25, pauseDuration: 3, studyBlockId: 'blk1', status: 'Completed' },
                { id: 2, startTime: '2026-01-01T10:30:00', endTime: '2026-01-01T10:55:00', duration: 25, pauseDuration: 2, studyBlockId: 'blk1', status: 'Completed' },
            ];
            const blocks = groupHistoryByBlock(history);
            expect(blocks[0].totalPause).toBe(5);
        });

        it('falls back from invalid end times and preserves the earliest valid session start', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));

            const history = [
                { id: 1, studyBlockId: 'blk', endTime: 'not-a-date', duration: 0, status: 'Completed' },
                { id: 2, studyBlockId: 'blk', startTime: '2026-01-01T09:00:00Z', endTime: '2026-01-01T10:00:00Z', duration: 3600, status: 'Completed' },
            ];

            const [block] = groupHistoryByBlock(history);
            expect(block.sessions[0].startTime).toBe('2026-01-01T12:00:00.000Z');
            expect(block.startTime).toBe('2026-01-01T09:00:00Z');

            vi.useRealTimers();
        });

        it('defaults missing durations to zero when grouping sessions', () => {
            const [block] = groupHistoryByBlock([
                { id: 7, endTime: '2026-01-03T10:00:00Z', studyBlockId: 'zero-duration', status: 'Completed' }
            ]);

            expect(block.totalDuration).toBe(0);
            expect(block.sessions[0].duration).toBe(0);
        });
    });
});
