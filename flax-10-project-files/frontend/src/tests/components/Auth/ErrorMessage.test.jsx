import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';

describe('ErrorMessage', () => {
    it('renders nothing when error is null', () => {
        const { container } = render(<ErrorMessage error={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when error is undefined', () => {
        const { container } = render(<ErrorMessage />);
        expect(container.firstChild).toBeNull();
    });

    it('renders error message when provided', () => {
        render(<ErrorMessage error="Something went wrong" />);
        expect(screen.getByText('Something went wrong')).toBeTruthy();
    });

    it('renders in a div element', () => {
        const { container } = render(<ErrorMessage error="Error" />);
        expect(container.querySelector('div')).toBeTruthy();
    });

    it('renders empty string error', () => {
        const { container } = render(<ErrorMessage error="" />);
        expect(container.firstChild).toBeNull();
    });
});
