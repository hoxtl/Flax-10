import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../components/common/standard_modal/StandardModal', () => ({
    default: ({ children, onClose }) => (
        <div data-testid="standard-modal">
            <button onClick={onClose}>close-modal</button>
            {children}
        </div>
    ),
}));

vi.mock('../../../../components/society/society_detail/image_handlers/ImageManagerComponents', () => ({
    ImageHeader: ({ title, onClose }) => (
        <div>
            <span>{title}</span>
            <button onClick={onClose}>close-header</button>
        </div>
    ),
    ImageGrid: ({ images = [], availablePhotos = [], onPin, onDelete, onAdd }) => (
        <div data-testid="mock-image-grid">
            <span data-testid="images">{images.join(',')}</span>
            <span data-testid="available-photos">{availablePhotos.join(',')}</span>
            <button onClick={() => onPin(0)}>pin-first</button>
            <button onClick={() => onPin(99)}>pin-missing</button>
            <button onClick={() => onDelete(1)}>delete-second</button>
            <button onClick={() => onAdd('upload.jpg')}>add-upload</button>
        </div>
    ),
}));

import CoverImageModal from '../../../../components/society/society_detail/image_handlers/CoverImageModal';

describe('CoverImageModal logic branches', () => {
    it('uses empty arrays when images and available photos are omitted', () => {
        render(<CoverImageModal onClose={vi.fn()} />);

        expect(screen.getByTestId('images')).toHaveTextContent('');
        expect(screen.getByTestId('available-photos')).toHaveTextContent('');
    });

    it('keeps the same images when pinning the first or an out-of-range image', () => {
        const onUpdate = vi.fn();
        render(<CoverImageModal images={['cover-1', 'cover-2']} availablePhotos={['library-1']} onClose={vi.fn()} onUpdate={onUpdate} />);

        fireEvent.click(screen.getByText('pin-first'));
        fireEvent.click(screen.getByText('pin-missing'));

        expect(onUpdate).toHaveBeenNthCalledWith(1, ['cover-1', 'cover-2']);
        expect(onUpdate).toHaveBeenNthCalledWith(2, ['cover-1', 'cover-2']);
        expect(screen.getByTestId('available-photos')).toHaveTextContent('library-1');
    });

    it('safely ignores grid actions when no onUpdate handler is provided', () => {
        render(<CoverImageModal images={['cover-1', 'cover-2']} onClose={vi.fn()} />);

        expect(() => {
            fireEvent.click(screen.getByText('pin-first'));
            fireEvent.click(screen.getByText('delete-second'));
            fireEvent.click(screen.getByText('add-upload'));
        }).not.toThrow();
    });
});
