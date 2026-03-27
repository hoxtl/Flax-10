import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthOverlay } from '../../../components/Auth/components/Overlay';

describe('AuthOverlay', () => {
    it('renders "Already have an account?" when signIn is false', () => {
        render(<AuthOverlay signIn={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Already have an account?')).toBeTruthy();
    });

    it('renders "Join StudyFlax" text', () => {
        render(<AuthOverlay signIn={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Join StudyFlax')).toBeTruthy();
    });

    it('renders Sign In button', () => {
        render(<AuthOverlay signIn={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Sign In')).toBeTruthy();
    });

    it('renders Sign Up button', () => {
        render(<AuthOverlay signIn={false} onToggle={vi.fn()} />);
        expect(screen.getByText('Sign Up')).toBeTruthy();
    });

    it('calls onToggle(true) when Sign In is clicked', () => {
        const onToggle = vi.fn();
        render(<AuthOverlay signIn={false} onToggle={onToggle} />);
        fireEvent.click(screen.getByText('Sign In'));
        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('calls onToggle(false) when Sign Up is clicked', () => {
        const onToggle = vi.fn();
        render(<AuthOverlay signIn={true} onToggle={onToggle} />);
        fireEvent.click(screen.getByText('Sign Up'));
        expect(onToggle).toHaveBeenCalledWith(false);
    });
});
