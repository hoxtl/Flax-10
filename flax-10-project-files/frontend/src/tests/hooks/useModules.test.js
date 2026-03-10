import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useModules from '../../components/Modules/hooks/useModules';

vi.mock('../../context/NotificationContext', () => ({
    useNotifications: vi.fn(() => ({ addNotification: vi.fn() })),
}));

vi.mock('../../api/moduleApi', () => ({
    getModules: vi.fn(),
    getEnrollments: vi.fn(),
    enrollInModule: vi.fn(),
    disenrolFromModule: vi.fn(),
    deleteModule: vi.fn(),
}));

vi.mock('../../components/Modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn(),
    getEnrollmentId: vi.fn(),
}));

vi.mock('../../components/Modules/utils/notifyHelper', () => ({
    createNotify: vi.fn(() => vi.fn()),
}));

vi.mock('../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => vi.fn()),
}));

import { useNotifications } from '../../context/NotificationContext';
import { getModules, getEnrollments, enrollInModule, disenrolFromModule, deleteModule } from '../../api/moduleApi';
import { isEnrolledIn, getEnrollmentId } from '../../components/Modules/utils/moduleUtils';
import { createNotify } from '../../components/Modules/utils/notifyHelper';
import { useConfirm } from '../../context/ConfirmContext';

const mockModules = [
    { id: 1, module_name: 'Math', module_code: 'MATH101' },
    { id: 2, module_name: 'Physics', module_code: 'PHYS101' },
];
const mockEnrollments = [{ id: 10, module: 1 }];

describe('useModules', () => {
    let mockNotify;
    let mockConfirmFn;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNotify = vi.fn();
        mockConfirmFn = vi.fn().mockResolvedValue(true);
        createNotify.mockReturnValue(mockNotify);
        useConfirm.mockReturnValue(mockConfirmFn);
        useNotifications.mockReturnValue({ addNotification: vi.fn() });
        getModules.mockResolvedValue(mockModules);
        getEnrollments.mockResolvedValue(mockEnrollments);
        isEnrolledIn.mockReturnValue(false);
        getEnrollmentId.mockReturnValue(10);
        enrollInModule.mockResolvedValue({ id: 11, module: 2 });
        disenrolFromModule.mockResolvedValue({});
        deleteModule.mockResolvedValue({});
    });

    it('starts with loading=true', () => {
        const { result } = renderHook(() => useModules());
        expect(result.current.loading).toBe(true);
    });

    it('loads modules and enrollments on mount', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.modules).toEqual(mockModules);
        expect(result.current.enrollments).toEqual(mockEnrollments);
    });

    it('notifies on load error', async () => {
        getModules.mockRejectedValueOnce(new Error('API error'));
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockNotify).toHaveBeenCalledWith('API error', 'error');
    });

    it('handleEnrollment enrolls user in a module', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleEnrollment(mockModules[1]);
        });
        expect(enrollInModule).toHaveBeenCalledWith(2);
    });

    it('handleEnrollment notifies success', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleEnrollment(mockModules[1]);
        });
        expect(mockNotify).toHaveBeenCalledWith(expect.stringContaining('Physics'), 'success');
    });

    it('handleEnrollment notifies error on failure', async () => {
        enrollInModule.mockRejectedValueOnce(new Error('Enroll failed'));
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleEnrollment(mockModules[1]);
        });
        expect(mockNotify).toHaveBeenCalledWith('Enroll failed', 'error');
    });

    it('handleDisenrol disenrols user from a module', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDisenrol(mockModules[0]);
        });
        expect(disenrolFromModule).toHaveBeenCalledWith(10);
    });

    it('handleDisenrol notifies success', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDisenrol(mockModules[0]);
        });
        expect(mockNotify).toHaveBeenCalledWith(expect.stringContaining('Math'), 'success');
    });

    it('toggleEnrollment enrolls when not enrolled', async () => {
        isEnrolledIn.mockReturnValue(false);
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.toggleEnrollment(mockModules[1]);
        });
        expect(enrollInModule).toHaveBeenCalledWith(2);
    });

    it('toggleEnrollment disenrols when enrolled', async () => {
        isEnrolledIn.mockReturnValue(true);
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.toggleEnrollment(mockModules[0]);
        });
        expect(disenrolFromModule).toHaveBeenCalled();
    });

    it('handleModuleCreated adds module to list and notifies', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        const newModule = { id: 3, module_name: 'Chemistry', module_code: 'CHEM101' };
        act(() => {
            result.current.handleModuleCreated(newModule);
        });
        expect(result.current.modules).toContain(newModule);
        expect(mockNotify).toHaveBeenCalledWith('Module created successfully', 'success');
    });

    it('handleModuleUpdated updates module in list and notifies', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        const updated = { ...mockModules[0], module_name: 'Advanced Math' };
        act(() => {
            result.current.handleModuleUpdated(updated);
        });
        expect(result.current.modules.find(m => m.id === 1).module_name).toBe('Advanced Math');
        expect(mockNotify).toHaveBeenCalledWith('Module updated successfully', 'success');
    });

    it('handleDeleteModule calls confirm before deleting', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDeleteModule(mockModules[0]);
        });
        expect(mockConfirmFn).toHaveBeenCalled();
    });

    it('handleDeleteModule deletes when confirmed', async () => {
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDeleteModule(mockModules[0]);
        });
        expect(deleteModule).toHaveBeenCalledWith(1);
    });

    it('handleDeleteModule does not delete when cancelled', async () => {
        mockConfirmFn.mockResolvedValueOnce(false);
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDeleteModule(mockModules[0]);
        });
        expect(deleteModule).not.toHaveBeenCalled();
    });
});
