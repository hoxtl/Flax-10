import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventContextMenu } from '../../../../pages/Homepage/components/MiniTimeline/EventContextMenu';

const mockStyles = {
    contextMenu: 'contextMenu',
    contextItem: 'contextItem',
    contextIcon: 'contextIcon',
    contextDivider: 'contextDivider',
    contextDelete: 'contextDelete',
};

function renderMenu(props = {}) {
    return render(
        <EventContextMenu
            eventItem={{ id: 1, title: 'Test Event' }}
            pos={{ x: 100, y: 200 }}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onClose={vi.fn()}
            styles={mockStyles}
            {...props}
        />
    );
}

describe('EventContextMenu', () => {
    it('renders Edit and Delete buttons', () => {
        renderMenu();
        expect(screen.getByText('Edit')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('calls onEdit and onClose when Edit is clicked', () => {
        const onEdit = vi.fn();
        const onClose = vi.fn();
        renderMenu({ onEdit, onClose });
        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalledWith({ id: 1, title: 'Test Event' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete and onClose when Delete is clicked', async () => {
        const onDelete = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();
        renderMenu({ onDelete, onClose });
        fireEvent.click(screen.getByText('Delete'));
        // wait for async delete
        await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(onDelete).toHaveBeenCalledWith({ id: 1, title: 'Test Event' });
    });

    it('calls onClose when clicking outside the menu', () => {
        const onClose = vi.fn();
        renderMenu({ onClose });
        fireEvent.mouseDown(document.body);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside the menu', () => {
        const onClose = vi.fn();
        renderMenu({ onClose });
        fireEvent.mouseDown(screen.getByText('Edit'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders at the given position', () => {
        renderMenu({ pos: { x: 50, y: 75 } });
        // EventContextMenu uses createPortal — menu is appended to document.body
        const menu = document.body.querySelector('.contextMenu');
        expect(menu.style.top).toBe('75px');
        expect(menu.style.left).toBe('50px');
    });

    it('does not throw when onEdit is undefined', () => {
        renderMenu({ onEdit: undefined });
        expect(screen.getByText('Edit')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Edit'));
    });

    it('does not throw when onClose is undefined', () => {
        renderMenu({ onClose: undefined });
        fireEvent.mouseDown(document.body);
    });

    it('does not throw when onDelete is undefined', () => {
        renderMenu({ onDelete: undefined });
        fireEvent.click(screen.getByText('Delete'));
    });
});
