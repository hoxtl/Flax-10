import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from '../../pages/Auth/AuthPage';

vi.mock('../../components/Authentication/AuthComponents', () => ({
  Container: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../components/Authentication/SignUpForm', () => ({
  SignUpForm: ({ onSubmit }) => <button onClick={onSubmit}>signup</button>,
}));
vi.mock('../../components/Authentication/SignInForm', () => ({
  SignInForm: ({ onSubmit }) => <button onClick={onSubmit}>signin</button>,
}));
vi.mock('../../components/Authentication/Overlay', () => ({
  AuthOverlay: ({ onToggle }) => (
    <div>
      <button onClick={() => onToggle(true)}>to-signin</button>
      <button onClick={() => onToggle(false)}>to-signup</button>
    </div>
  ),
}));
vi.mock('../../components/Authentication/ErrorMessage', () => ({
  ErrorMessage: ({ error }) => error ? <div data-testid="error">{error}</div> : null,
}));
vi.mock('../../components/Authentication/AuthHeroGeometric', () => ({ default: () => <div /> }));
vi.mock('../../components/Authentication/TestimonialsMarquee', () => ({ TestimonialsMarquee: () => <div /> }));
vi.mock('../../components/Authentication/AuthBranding', () => ({
  AuthBrand: () => <div />, AuthFooter: () => <div />,
}));

const { mockAuthService } = vi.hoisted(() => ({
    mockAuthService: { register: vi.fn(), login: vi.fn() },
}));
vi.mock('../../api/authService', () => ({ authService: mockAuthService }));
vi.mock('../../components/Authentication/utils/authHelpers', () => ({
  validatePasswords: vi.fn(() => null),
  getErrorMessage: vi.fn(() => 'error'),
  saveUserData: vi.fn(),
  clearUserData: vi.fn(),
}));

import { validatePasswords, saveUserData } from '../../components/Authentication/utils/authHelpers';

describe('AuthPage', () => {
  it('renders without crashing', () => {
    render(<AuthPage />);
    expect(screen.getByText('signup')).toBeTruthy();
  });

  it('toggles between sign in and sign up', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText('to-signup'));
    fireEvent.click(screen.getByText('to-signin'));
  });

  it('shows password error on sign up with mismatched passwords', async () => {
    validatePasswords.mockReturnValueOnce('The two passwords do not match');
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signup'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeTruthy());
  });

  it('shows error when register returns null', async () => {
    validatePasswords.mockReturnValue(null);
    mockAuthService.register.mockResolvedValue(null);
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signup'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeTruthy());
  });

  it('calls saveUserData on successful register', async () => {
    validatePasswords.mockReturnValue(null);
    mockAuthService.register.mockResolvedValue({ response: { ok: true }, data: { token: 'tok', user: {} } });
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signup'));
    await waitFor(() => expect(saveUserData).toHaveBeenCalled());
  });

  it('shows register field error when response not ok', async () => {
    validatePasswords.mockReturnValue(null);
    mockAuthService.register.mockResolvedValue({ response: { ok: false }, data: { username: 'taken' } });
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signup'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeTruthy());
  });

  it('shows error when login returns null', async () => {
    mockAuthService.login.mockResolvedValue(null);
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signin'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeTruthy());
  });

  it('calls saveUserData on successful login', async () => {
    mockAuthService.login.mockResolvedValue({ response: { ok: true }, data: { token: 'tok', user: {} } });
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signin'));
    await waitFor(() => expect(saveUserData).toHaveBeenCalled());
  });

  it('shows login error when response not ok', async () => {
    mockAuthService.login.mockResolvedValue({ response: { ok: false }, data: { error: 'Bad credentials' } });
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signin'));
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Bad credentials'));
  });

  it('shows fallback login error when no data.error', async () => {
    mockAuthService.login.mockResolvedValue({ response: { ok: false }, data: {} });
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signin'));
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Invalid username or password'));
  });

  it('handles register exception (tryRegister returns null)', async () => {
    validatePasswords.mockReturnValue(null);
    mockAuthService.register.mockRejectedValue(new Error('network'));
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signup'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeTruthy());
  });

  it('handles login exception (tryLogin returns null)', async () => {
    mockAuthService.login.mockRejectedValue(new Error('network'));
    render(<AuthPage />);
    fireEvent.click(screen.getByText('signin'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeTruthy());
  });
});