import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StandardModal, { ModalHeader } from '../../components/Common/StandardModal/StandardModal';

describe('StandardModal', () => {
    it('renders title', () => {
        render(<StandardModal title="My Modal" onClose={vi.fn()} />);
        expect(screen.getByText('My Modal')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
        render(<StandardModal title="Modal" subtitle="A subtitle" onClose={vi.fn()} />);
        expect(screen.getByText('A subtitle')).toBeTruthy();
    });

    it('does not render subtitle when not provided', () => {
        render(<StandardModal title="Modal" onClose={vi.fn()} />);
        expect(screen.queryByRole('paragraph')).toBeNull();
    });

    it('renders children', () => {
        render(<StandardModal title="Modal" onClose={vi.fn()}><div>Content</div></StandardModal>);
        expect(screen.getByText('Content')).toBeTruthy();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<StandardModal title="Modal" onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(<StandardModal title="Modal" onClose={onClose} />);
        const backdrop = document.body.querySelector('div[class*="_backdrop"]');
        expect(backdrop).toBeTruthy();
        fireEvent.mouseDown(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not propagate mouseDown from modal inner content', () => {
        const onClose = vi.fn();
        render(<StandardModal title="Modal" onClose={onClose}><p>Inner</p></StandardModal>);
        fireEvent.mouseDown(screen.getByText('Inner'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('does not render ModalHeader when title is not provided', () => {
        render(<StandardModal onClose={vi.fn()}><p>Content only</p></StandardModal>);
        expect(screen.queryByRole('button')).toBeNull();
    });
});

describe('ModalHeader', () => {
    it('renders title', () => {
        render(<ModalHeader title="Header Title" onClose={vi.fn()} />);
        expect(screen.getByText('Header Title')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
        render(<ModalHeader title="Title" subtitle="Subtitle text" onClose={vi.fn()} />);
        expect(screen.getByText('Subtitle text')).toBeTruthy();
    });

    it('does not render subtitle when not provided', () => {
        render(<ModalHeader title="Title" onClose={vi.fn()} />);
        expect(screen.queryByText(/subtitle/i)).toBeNull();
    });

    it('calls onClose when × button is clicked', () => {
        const onClose = vi.fn();
        render(<ModalHeader title="Title" onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
