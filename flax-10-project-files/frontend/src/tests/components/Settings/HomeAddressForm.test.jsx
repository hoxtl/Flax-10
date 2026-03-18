import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomeAddressForm from '../../../components/Settings/HomeAddressForm';

vi.mock('../../../api/userService', () => ({
    getHomeAddress: vi.fn(),
}));

import { getHomeAddress } from '../../../api/userService';

describe('HomeAddressForm', () => {
    beforeEach(() => {
        getHomeAddress.mockResolvedValue({ home_address: '123 Main St, London' });
    });

    it('shows loading initially', () => {
        getHomeAddress.mockReturnValueOnce(new Promise(() => {}));
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByLabelText('Loading home address')).toBeTruthy();
    });

    it('renders address form after loading', async () => {
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByDisplayValue('123 Main St, London')).toBeTruthy();
        });
    });

    it('renders Home Address title', async () => {
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Home Address')).toBeTruthy();
        });
    });

    it('renders Save Home Address button', async () => {
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Save Home Address')).toBeTruthy();
        });
    });

    it('shows Saving address... when isSaving', async () => {
        render(<HomeAddressForm onSave={vi.fn()} isSaving={true} />);
        await waitFor(() => {
            expect(screen.getByText('Saving...')).toBeTruthy();
        });
    });

    it('calls onSave with address on submit', async () => {
        const onSave = vi.fn();
        const { container } = render(<HomeAddressForm onSave={onSave} isSaving={false} />);
        await waitFor(() => screen.getByDisplayValue('123 Main St, London'));
        fireEvent.submit(container.querySelector('form'));
        expect(onSave).toHaveBeenCalledWith('123 Main St, London');
    });

    it('renders error message when error prop is provided', async () => {
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} error="Address not found" />);
        await waitFor(() => {
            expect(screen.getByText('Address not found')).toBeTruthy();
        });
    });

    it('handles getHomeAddress error gracefully', async () => {
        getHomeAddress.mockRejectedValueOnce(new Error('Network error'));
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Save Home Address')).toBeTruthy();
        });
    });

    it('empty address when home_address is null', async () => {
        getHomeAddress.mockResolvedValueOnce({ home_address: null });
        render(<HomeAddressForm onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            const input = screen.getByPlaceholderText('e.g., 123 Example Street, London, E1 B23');
            expect(input.value).toBe('');
        });
    });
});
