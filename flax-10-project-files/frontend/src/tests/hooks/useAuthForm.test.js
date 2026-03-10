import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '../../components/Authentication/hooks/useAuthForm';

describe('useAuthForm', () => {
  it('updates fields and resets to initial state', () => {
    const initialState = { email: '', password: '' };
    const { result } = renderHook(() => useAuthForm(initialState));

    act(() => {
      result.current.updateField('email')({ target: { value: 'a@b.com' } });
    });
    act(() => {
      result.current.updateField('password')({ target: { value: 'secret' } });
    });

    expect(result.current.formData).toEqual({ email: 'a@b.com', password: 'secret' });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(initialState);
  });

  it('exposes setFormData for direct assignment', () => {
    const { result } = renderHook(() => useAuthForm({ email: '' }));
    act(() => {
      result.current.setFormData({ email: 'x@y.com' });
    });
    expect(result.current.formData).toEqual({ email: 'x@y.com' });
  });
});
