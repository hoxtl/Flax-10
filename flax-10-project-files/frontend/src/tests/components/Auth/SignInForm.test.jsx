import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SignInForm } from '../../../components/Auth/components/SignInForm';

const defaultFormData = { username: '', password: '' };
const updateField = (field) => (e) => {};

function renderSignIn(props = {}) {
    const defaults = {
        signIn: true,
        formData: defaultFormData,
        updateField: vi.fn(() => vi.fn()),
        onSubmit: vi.fn(),
        loading: false,
        onToggle: vi.fn(),
    };
    return render(
        <MemoryRouter>
            <SignInForm {...defaults} {...props} />
        </MemoryRouter>
    );
}

describe('SignInForm', () => {
    it('renders Sign in title', () => {
        renderSignIn();
        expect(screen.getByText('Sign in')).toBeTruthy();
    });

    it('renders username input', () => {
        renderSignIn();
        expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    });

    it('renders password input', () => {
        renderSignIn();
        expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    });

    it('renders Sign In button', () => {
        renderSignIn();
        expect(screen.getByText('Sign In')).toBeTruthy();
    });

    it('shows "Signing in..." when loading', () => {
        renderSignIn({ loading: true });
        expect(screen.getByText('Signing in...')).toBeTruthy();
    });

    it('renders Forgot password? link', () => {
        renderSignIn();
        expect(screen.getByText('Forgot password?')).toBeTruthy();
    });

    it('renders Sign Up toggle option', () => {
        renderSignIn();
        expect(screen.getByText('Sign Up')).toBeTruthy();
    });

    it('calls onToggle(false) when Sign Up is clicked', () => {
        const onToggle = vi.fn();
        renderSignIn({ onToggle });
        fireEvent.click(screen.getByText('Sign Up'));
        expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('inputs are disabled when loading', () => {
        renderSignIn({ loading: true });
        const inputs = screen.getAllByRole('textbox');
        expect(inputs[0]).toBeDisabled();
    });
});
