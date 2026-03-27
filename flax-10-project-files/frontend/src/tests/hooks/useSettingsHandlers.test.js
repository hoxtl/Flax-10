import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSettingsHandlers from '../../components/settings/hooks/useSettingsHandlers';

vi.mock('../../api/userApi', () => ({
    updateUserSettings: vi.fn(),
    saveHomeAddress: vi.fn(),
}));

vi.mock('../../api/settingsApi', () => ({
    patchSettings: vi.fn(),
    saveUserToStorage: vi.fn(),
    clearAuthAndRedirect: vi.fn(),
    hasToken: vi.fn(),
}));

vi.mock('../../api/geocodeApi', () => ({
    geocodeAddress: vi.fn(),
}));

import { updateUserSettings, saveHomeAddress } from '../../api/userApi';
import { patchSettings, saveUserToStorage, clearAuthAndRedirect, hasToken } from '../../api/settingsApi';
import { geocodeAddress } from '../../api/geocodeApi';

describe('useSettingsHandlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        hasToken.mockReturnValue(true);
        patchSettings.mockResolvedValue({ ok: true, data: { user: { id: 1, first_name: 'Alice' } } });
        updateUserSettings.mockResolvedValue({ user: { id: 1 } });
        geocodeAddress.mockResolvedValue({ latitude: 51.5, longitude: -0.1 });
        saveHomeAddress.mockResolvedValue({ success: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useSettingsHandlers());
        expect(result.current.isSaving).toBe(false);
        expect(result.current.bannerMessage).toBe('');
        expect(result.current.passwordError).toBe('');
        expect(result.current.homeAddressError).toBe('');
    });

    describe('handleAccountSave', () => {
        it('saves account successfully without showing a page banner', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleAccountSave({ firstName: 'Alice', lastName: 'Smith', year: 2, major: 'CS' });
            });
            expect(patchSettings).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Alice', last_name: 'Smith' }));
            expect(result.current.bannerMessage).toBe('');
            expect(result.current.isSaving).toBe(false);
        });

        it('shows error when not logged in', async () => {
            hasToken.mockReturnValueOnce(false);
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleAccountSave({ firstName: 'X', lastName: 'Y' });
            });
            expect(result.current.passwordError).toContain('not logged in');
        });

        it('shows error when API returns error', async () => {
            patchSettings.mockResolvedValueOnce({ ok: false, data: { error: 'Update failed' } });
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleAccountSave({ firstName: 'X', lastName: 'Y' });
            });
            expect(result.current.passwordError).toContain('Update failed');
        });

        it('saves user to storage on success', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleAccountSave({ firstName: 'Alice', lastName: 'Smith' });
            });
            expect(saveUserToStorage).toHaveBeenCalledWith({ id: 1, first_name: 'Alice' });
        });
    });

    describe('handlePasswordSave', () => {
        it('shows error when password is too short', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePasswordSave({ newPassword: 'short', confirmPassword: 'short' });
            });
            expect(result.current.passwordError).toContain('8 characters');
        });

        it('shows error when passwords do not match', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePasswordSave({ newPassword: 'longpass1', confirmPassword: 'longpass2' });
            });
            expect(result.current.passwordError).toContain('do not match');
        });

        it('shows error when not logged in', async () => {
            hasToken.mockReturnValueOnce(false);
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePasswordSave({ newPassword: 'password123', confirmPassword: 'password123' });
            });
            expect(result.current.passwordError).toContain('not logged in');
        });

        it('redirects after password change without showing a page banner', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePasswordSave({ newPassword: 'newpassword1', confirmPassword: 'newpassword1' });
            });
            expect(result.current.bannerMessage).toBe('');
            // clearAuthAndRedirect is called after 2 second timeout
            await act(async () => {
                vi.advanceTimersByTime(2100);
            });
            expect(clearAuthAndRedirect).toHaveBeenCalled();
        });

        it('shows error when API fails', async () => {
            patchSettings.mockResolvedValueOnce({ ok: false, data: { error: 'Server error' } });
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePasswordSave({ newPassword: 'longpassword', confirmPassword: 'longpassword' });
            });
            expect(result.current.passwordError).toContain('Server error');
        });
    });

    describe('handlePreferencesSave', () => {
        it('saves preferences without showing a page banner', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePreferencesSave({ theme: 'dark' });
            });
            expect(updateUserSettings).toHaveBeenCalledWith({ theme: 'dark' });
            expect(result.current.bannerMessage).toBe('');
        });

        it('shows failure message when updateUserSettings throws', async () => {
            updateUserSettings.mockRejectedValueOnce(new Error('Network'));
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handlePreferencesSave({ theme: 'light' });
            });
            expect(result.current.bannerMessage).toContain('Failed');
        });
    });

    describe('handleHomeAddressSave', () => {
        it('shows error for empty address', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleHomeAddressSave('   ');
            });
            expect(result.current.homeAddressError).toContain('valid home address');
        });

        it('saves address successfully', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleHomeAddressSave('10 Downing Street, London');
            });
            expect(geocodeAddress).toHaveBeenCalledWith('10 Downing Street, London');
            expect(saveHomeAddress).toHaveBeenCalledWith('10 Downing Street, London', 51.5, -0.1);
            expect(result.current.homeAddressError).toBe('');
        });

        it('saves address manually when geocode returns null', async () => {
            geocodeAddress.mockResolvedValueOnce(null);
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleHomeAddressSave('Invalid Place');
            });
            expect(saveHomeAddress).toHaveBeenCalledWith('Invalid Place', null, null);
            expect(result.current.homeAddressError).toBe('');
        });

        it('shows error when save throws', async () => {
            saveHomeAddress.mockRejectedValueOnce(new Error('DB error'));
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleHomeAddressSave('123 Main St');
            });
            expect(result.current.homeAddressError).toContain('could not be saved');
        });
    });

    describe('handleSleepSave', () => {
        it('saves sleep schedule when logged in', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleSleepSave({ sleep_time: '22:00', wake_time: '07:00' });
            });
            expect(updateUserSettings).toHaveBeenCalledWith({ sleep_time: '22:00', wake_time: '07:00' });
        });

        it('returns early when not logged in', async () => {
            hasToken.mockReturnValueOnce(false);
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleSleepSave({ sleep_time: '22:00', wake_time: '07:00' });
            });
            expect(updateUserSettings).not.toHaveBeenCalled();
        });

        it('shows error when sleep save fails', async () => {
            updateUserSettings.mockResolvedValueOnce(null);
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleSleepSave({ sleep_time: '22:00', wake_time: '07:00' });
            });
            expect(result.current.bannerMessage).toContain('Failed');
        });
    });

    describe('handleStudyTimeSave', () => {
        it('saves study time when logged in', async () => {
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleStudyTimeSave({ preferred_study_minutes_per_day: 150 });
            });
            expect(updateUserSettings).toHaveBeenCalledWith({ preferred_study_minutes_per_day: 150 });
        });

        it('returns early when not logged in', async () => {
            hasToken.mockReturnValueOnce(false);
            const { result } = renderHook(() => useSettingsHandlers());
            await act(async () => {
                await result.current.handleStudyTimeSave({ preferred_study_minutes_per_day: 150 });
            });
            expect(patchSettings).not.toHaveBeenCalled();
        });
    });
});
