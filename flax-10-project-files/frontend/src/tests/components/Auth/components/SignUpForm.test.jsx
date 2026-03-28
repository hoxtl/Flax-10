import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SignUpForm } from '../../../../components/Auth/components/SignUpForm';

const defaultFormData = {
    first_name: '', last_name: '', username: '',
    email: '', password: '', password2: '',
};

function renderSignUp(props = {}) {
    const defaults = {
        signIn: false,
        formData: defaultFormData,
        updateField: vi.fn(() => vi.fn()),
        onSubmit: vi.fn(),
        loading: false,
        onToggle: vi.fn(),
    };
    return render(
        <MemoryRouter>
            <SignUpForm {...defaults} {...props} />
        </MemoryRouter>
    );
}

describe('SignUpForm', () => {
    it('renders Create Account title', () => {
        renderSignUp();
        expect(screen.getByText('Create Account')).toBeTruthy();
    });

    it('renders First Name input', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText('First Name')).toBeTruthy();
    });

    it('renders Last Name input', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText('Last Name')).toBeTruthy();
    });

    it('renders Username input', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    });

    it('renders Email input', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    });

    it('renders Password input', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    });

    it('renders Confirm Password input', () => {
        renderSignUp();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeTruthy();
    });

    it('renders Sign Up button', () => {
        renderSignUp();
        expect(screen.getByText('Sign Up')).toBeTruthy();
    });

    it('shows "Creating account..." when loading', () => {
        renderSignUp({ loading: true });
        expect(screen.getByText('Creating account...')).toBeTruthy();
    });

    it('calls onToggle(true) when Sign In link is clicked', () => {
        const onToggle = vi.fn();
        renderSignUp({ onToggle });
        fireEvent.click(screen.getByText('Sign In'));
        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('button is disabled when loading', () => {
        renderSignUp({ loading: true });
        const btn = screen.getByRole('button', { name: 'Creating account...' });
        expect(btn).toBeDisabled();
    });
});
