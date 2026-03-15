import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from './SearchBar';
import styles from './SearchBar.module.css';

describe('SearchBar Component', () => {
    it('renders with default placeholder', () => {
        render(<SearchBar />);
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('renders with custom placeholder and value', () => {
        render(<SearchBar placeholder="Custom Search" value="initial query" />);
        const input = screen.getByPlaceholderText('Custom Search');
        expect(input).toBeInTheDocument();
        expect(input.value).toBe('initial query');
    });

    it('calls onChange with input value', () => {
        const mockOnChange = vi.fn();
        render(<SearchBar onChange={mockOnChange} />);

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'new query' } });

        expect(mockOnChange).toHaveBeenCalledWith('new query');
    });

    it('applies custom className correctly', () => {
        const customClass = 'my-custom-class';
        const { container } = render(<SearchBar className={customClass} />);

        // Find the div by checking its classes since we know it uses the styles.container
        const rootDiv = container.firstChild;
        expect(rootDiv.className).toContain(styles.container);
        expect(rootDiv.className).toContain(customClass);
    });
});
