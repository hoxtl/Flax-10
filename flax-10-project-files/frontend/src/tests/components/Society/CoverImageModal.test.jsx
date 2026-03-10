import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../components/Society/SocietyDetail/imageHandlers/ImageManagerComponents', () => ({
    ImageHeader: ({ title, onClose }) => (
        <div>
            <span>{title}</span>
            <button onClick={onClose}>close-header</button>
        </div>
    ),
    ImageGrid: ({ images, onDelete, onPin, onAddClick }) => (
        <div>
            <span data-testid="grid-count">{images.length}</span>
            <button onClick={() => onDelete(0)}>delete-btn</button>
            <button onClick={() => onPin(1)}>pin-btn</button>
            <button onClick={onAddClick}>add-click-btn</button>
        </div>
    ),
    AddImageView: ({ onClose, onAdd, availablePhotos }) => (
        <div>
            <span data-testid="add-view">add-view</span>
            <span data-testid="available-count">{availablePhotos.length}</span>
            <button onClick={onClose}>back-btn</button>
            <button onClick={() => onAdd('new.jpg')}>add-image-btn</button>
        </div>
    ),
}));

import CoverImageModal from '../../../components/Society/SocietyDetail/imageHandlers/CoverImageModal';

describe('CoverImageModal', () => {
    const baseProps = {
        images: ['a.jpg', 'b.jpg'],
        availablePhotos: ['x.jpg'],
        onClose: vi.fn(),
        onUpdate: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders list view by default with title and grid', () => {
        render(<CoverImageModal {...baseProps} />);
        expect(screen.getByText('Manage Cover Images')).toBeTruthy();
        expect(screen.getByTestId('grid-count').textContent).toBe('2');
        expect(screen.getByText('First image is shown on society card. Click ★ to pin.')).toBeTruthy();
    });

    it('calls onClose when backdrop is clicked', () => {
        const { container } = render(<CoverImageModal {...baseProps} />);
        fireEvent.mouseDown(container.firstChild);
        expect(baseProps.onClose).toHaveBeenCalled();
    });

    it('stops propagation on modal mouseDown', () => {
        const { container } = render(<CoverImageModal {...baseProps} />);
        const modal = container.firstChild.firstChild;
        const stopPropagation = vi.fn();
        fireEvent.mouseDown(modal, { stopPropagation });
        // onClose should NOT be called because inner modal stops propagation
        // We verify by checking that if we click inside the modal only, onClose is not triggered via modal itself
        expect(baseProps.onClose).not.toHaveBeenCalled();
    });

    it('switches to add view when onAddClick is triggered', () => {
        render(<CoverImageModal {...baseProps} />);
        fireEvent.click(screen.getByText('add-click-btn'));
        expect(screen.getByTestId('add-view')).toBeTruthy();
        expect(screen.getByTestId('available-count').textContent).toBe('1');
    });

    it('goes back to list view from add view via onClose', () => {
        render(<CoverImageModal {...baseProps} />);
        fireEvent.click(screen.getByText('add-click-btn'));
        expect(screen.getByTestId('add-view')).toBeTruthy();
        fireEvent.click(screen.getByText('back-btn'));
        expect(screen.queryByTestId('add-view')).toBeNull();
        expect(screen.getByTestId('grid-count')).toBeTruthy();
    });

    it('calls onUpdate with new image when adding (under limit)', () => {
        render(<CoverImageModal {...baseProps} />);
        fireEvent.click(screen.getByText('add-click-btn'));
        fireEvent.click(screen.getByText('add-image-btn'));
        expect(baseProps.onUpdate).toHaveBeenCalledWith(['a.jpg', 'b.jpg', 'new.jpg']);
    });

    it('shows alert and does not call onUpdate when at max 5 images', () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
        const props = {
            ...baseProps,
            images: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'],
        };
        render(<CoverImageModal {...props} />);
        fireEvent.click(screen.getByText('add-click-btn'));
        fireEvent.click(screen.getByText('add-image-btn'));
        expect(alertMock).toHaveBeenCalledWith('Maximum 5 images reach.');
        expect(baseProps.onUpdate).not.toHaveBeenCalled();
        alertMock.mockRestore();
    });

    it('calls onUpdate with image removed when delete is triggered', () => {
        render(<CoverImageModal {...baseProps} />);
        fireEvent.click(screen.getByText('delete-btn'));
        expect(baseProps.onUpdate).toHaveBeenCalledWith(['b.jpg']);
    });

    it('calls onUpdate with pinned image first when pin is triggered', () => {
        render(<CoverImageModal {...baseProps} />);
        fireEvent.click(screen.getByText('pin-btn'));
        expect(baseProps.onUpdate).toHaveBeenCalledWith(['b.jpg', 'a.jpg']);
    });

    it('calls onClose via ImageHeader close button', () => {
        render(<CoverImageModal {...baseProps} />);
        fireEvent.click(screen.getByText('close-header'));
        expect(baseProps.onClose).toHaveBeenCalled();
    });
});
