import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanReadDetailModal } from '../../../../pages/Homepage/components/PlanReadDetailModal';

const mockStyles = {
    actionHubReadOverlay: 'overlay',
    actionHubReadModal: 'modal',
    actionHubReadTitle: 'title',
    actionHubReadTime: 'time',
    actionHubReadDescription: 'desc',
    actionHubReadFooter: 'footer',
    actionHubReadBtn: 'editBtn',
    actionHubReadBtnDanger: 'deleteBtn',
    actionHubReadClose: 'closeBtn',
};

describe('PlanReadDetailModal', () => {
    it('returns null when item is null', () => {
        const { container } = render(
            <PlanReadDetailModal item={null} styles={mockStyles} onClose={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('returns null when item has no task or event', () => {
        const { container } = render(
            <PlanReadDetailModal item={{}} styles={mockStyles} onClose={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders event title and description', () => {
        const item = {
            event: {
                title: 'Team Meeting',
                start_time: '2024-03-08T10:00:00Z',
                end_time: '2024-03-08T11:00:00Z',
                description: 'Weekly standup',
            },
        };
        render(<PlanReadDetailModal item={item} styles={mockStyles} onClose={vi.fn()} />);
        expect(screen.getByText('Team Meeting')).toBeTruthy();
        expect(screen.getByText('Weekly standup')).toBeTruthy();
    });

    it('renders task title', () => {
        const item = {
            task: { title: 'Write report', estimated_blocks: 2 },
        };
        render(<PlanReadDetailModal item={item} styles={mockStyles} onClose={vi.fn()} />);
        expect(screen.getByText('Write report')).toBeTruthy();
    });

    it('does not render description when absent', () => {
        const item = { event: { title: 'Event', start_time: null, end_time: null } };
        render(<PlanReadDetailModal item={item} styles={mockStyles} onClose={vi.fn()} />);
        expect(screen.queryByText('desc')).toBeNull();
    });

    it('calls onEditEvent and onClose when Edit is clicked for event', () => {
        const onEditEvent = vi.fn();
        const onClose = vi.fn();
        const eventData = { title: 'My Event', start_time: null, end_time: null };
        render(
            <PlanReadDetailModal
                item={{ event: eventData }}
                styles={mockStyles}
                onClose={onClose}
                onEditEvent={onEditEvent}
            />
        );
        fireEvent.click(screen.getByText('Edit'));
        expect(onEditEvent).toHaveBeenCalledWith(eventData);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onEditTask and onClose when Edit is clicked for task', () => {
        const onEditTask = vi.fn();
        const onClose = vi.fn();
        const taskData = { title: 'My Task' };
        render(
            <PlanReadDetailModal
                item={{ task: taskData }}
                styles={mockStyles}
                onClose={onClose}
                onEditTask={onEditTask}
            />
        );
        fireEvent.click(screen.getByText('Edit'));
        expect(onEditTask).toHaveBeenCalledWith(taskData);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onDeleteEvent and onClose when Delete is clicked', async () => {
        const onDeleteEvent = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();
        render(
            <PlanReadDetailModal
                item={{ event: { title: 'E' } }}
                styles={mockStyles}
                onClose={onClose}
                onDeleteEvent={onDeleteEvent}
            />
        );
        fireEvent.click(screen.getByText('Delete'));
        await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(onDeleteEvent).toHaveBeenCalled();
    });

    it('calls onClose when close button (×) is clicked', () => {
        const onClose = vi.fn();
        render(
            <PlanReadDetailModal
                item={{ event: { title: 'E' } }}
                styles={mockStyles}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay backdrop is clicked', () => {
        const onClose = vi.fn();
        render(
            <PlanReadDetailModal
                item={{ event: { title: 'E' } }}
                styles={mockStyles}
                onClose={onClose}
            />
        );
        // Since it's a Portal, it's in document.body, not container
        // And StandardModal uses onMouseDown
        const backdrop = document.body.querySelector('[class*="backdrop"]');
        if (backdrop) fireEvent.mouseDown(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when Delete throws', async () => {
        const onDeleteTask = vi.fn().mockRejectedValue(new Error('API error'));
        const onClose = vi.fn();
        render(
            <PlanReadDetailModal
                item={{ task: { title: 'T' } }}
                styles={mockStyles}
                onClose={onClose}
                onDeleteTask={onDeleteTask}
            />
        );
        fireEvent.click(screen.getByText('Delete'));
        await vi.waitFor(() => expect(onDeleteTask).toHaveBeenCalled());
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders task with due_date and estimated_blocks', () => {
        const item = {
            task: { title: 'Report', due_date: '2024-03-08T14:00:00Z', estimated_blocks: 2 },
        };
        render(<PlanReadDetailModal item={item} styles={mockStyles} onClose={vi.fn()} />);
        expect(screen.getByText('Report')).toBeTruthy();
        expect(document.body.textContent).toMatch(/50m/);
    });
});
