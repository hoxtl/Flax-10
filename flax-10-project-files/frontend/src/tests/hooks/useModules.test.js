/*
 * Tests for useModules hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useModules from '../../components/modules/hooks/useModules';

vi.mock('../../context/NotificationContext.jsx', () => ({
    useNotifications: vi.fn(() => ({ addNotification: vi.fn() })),
}));

vi.mock('../../context/TagContext.jsx', () => ({
    useTags: vi.fn(() => ({ refreshTags: vi.fn(async () => {}) })),
}));

vi.mock('../../api/moduleApi.js', () => ({
    getModules: vi.fn(),
    getEnrollments: vi.fn(),
    enrollInModule: vi.fn(),
    disenrolFromModule: vi.fn(),
    deleteModule: vi.fn(),
}));

vi.mock('../../api/taskApi.js', () => ({
    fetchTasks: vi.fn(),
}));

vi.mock('../../components/modules/utils/moduleUtils.js', () => ({
    isEnrolledIn: vi.fn(),
    getEnrollmentId: vi.fn(),
    normaliseModuleCode: vi.fn((value) => String(value || "").trim().toUpperCase()),
}));

vi.mock('../../components/modules/utils/notifyHelper.js', () => ({
    createNotify: vi.fn(() => vi.fn()),
}));

vi.mock('../../context/ConfirmContext.jsx', () => ({
    useConfirm: vi.fn(() => vi.fn()),
}));

import { useNotifications } from '../../context/NotificationContext.jsx';
import { useTags } from '../../context/TagContext.jsx';
import { getModules, getEnrollments, enrollInModule, disenrolFromModule, deleteModule } from '../../api/moduleApi.js';
import { fetchTasks } from '../../api/taskApi.js';
import { isEnrolledIn, getEnrollmentId } from '../../components/modules/utils/moduleUtils.js';
import { createNotify } from '../../components/modules/utils/notifyHelper.js';
import { useConfirm } from '../../context/ConfirmContext.jsx';

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
        useTags.mockReturnValue({ refreshTags: vi.fn(async () => {}) });
        getModules.mockResolvedValue(mockModules);
        getEnrollments.mockResolvedValue(mockEnrollments);
        isEnrolledIn.mockReturnValue(false);
        getEnrollmentId.mockReturnValue(10);
        enrollInModule.mockResolvedValue({ id: 11, module: 2 });
        disenrolFromModule.mockResolvedValue({});
        deleteModule.mockResolvedValue({});
        fetchTasks.mockResolvedValue([
            { id: 1, module_code: 'math101', completed: false },
            { id: 2, module_code: 'MATH101', completed: true },
            { id: 3, module_code: 'PHYS101', completed: false },
            { id: 4, module_code: '', completed: false },
        ]);
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
        expect(result.current.taskCountsByModule).toEqual({ MATH101: 1, PHYS101: 1 });
    });

    it('notifies on load error', async () => {
        getModules.mockRejectedValueOnce(new Error('API error'));
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockNotify).toHaveBeenCalledWith('API error', 'error');
    });

    it('notifies when enrollments fail to load', async () => {
        getEnrollments.mockRejectedValueOnce(new Error('enrollments failed'));
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockNotify).toHaveBeenCalledWith('enrollments failed', 'error');
    });

    it('normalizes nullish module, enrollment, and task payloads to empty collections', async () => {
        getModules.mockResolvedValueOnce(null);
        getEnrollments.mockResolvedValueOnce(null);
        fetchTasks.mockResolvedValueOnce(undefined);
        const { result } = renderHook(() => useModules());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.modules).toEqual([]);
        expect(result.current.enrollments).toEqual([]);
        expect(result.current.taskCountsByModule).toEqual({});
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

    it('handles enrollment when tag refresh is unavailable', async () => {
        useTags.mockReturnValue({});
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.handleEnrollment(mockModules[1]);
        });

        expect(enrollInModule).toHaveBeenCalledWith(2);
        expect(mockNotify).toHaveBeenCalledWith(expect.stringContaining('Physics'), 'success');
    });

    it('swallows tag refresh failures after successful enrollment', async () => {
        const refreshTags = vi.fn().mockRejectedValueOnce(new Error('refresh failed'));
        useTags.mockReturnValue({ refreshTags });
        const { result } = renderHook(() => useModules());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.handleEnrollment(mockModules[1]);
        });

        expect(refreshTags).toHaveBeenCalledTimes(1);
        expect(mockNotify).toHaveBeenCalledWith(expect.stringContaining('Physics'), 'success');
        expect(mockNotify).not.toHaveBeenCalledWith('refresh failed', 'error');
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

    it('keeps loading successful modules even when task loading fails', async () => {
        fetchTasks.mockRejectedValueOnce(new Error('tasks failed'));
        const { result } = renderHook(() => useModules());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.modules).toEqual(mockModules);
        expect(result.current.enrollments).toEqual(mockEnrollments);
        expect(result.current.taskCountsByModule).toEqual({});
    });

    it('marks matching enrollments as core when disenrolment is blocked by a core-module error', async () => {
        disenrolFromModule.mockRejectedValueOnce(new Error('This is a core module'));
        getEnrollments.mockResolvedValueOnce([{ id: 10, module: 1 }, { id: 11, module: 2 }]);
        const { result } = renderHook(() => useModules());

        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDisenrol(mockModules[0]);
        });

        expect(result.current.enrollments).toEqual([{ id: 10, module: 1, is_core: true }, { id: 11, module: 2 }]);
        expect(mockNotify).not.toHaveBeenCalledWith('This is a core module', 'error');
    });

    it('reports generic disenrolment failures', async () => {
        disenrolFromModule.mockRejectedValueOnce(new Error('Nope'));
        const { result } = renderHook(() => useModules());

        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDisenrol(mockModules[0]);
        });

        expect(mockNotify).toHaveBeenCalledWith('Nope', 'error');
    });

    it('directly deletes modules and runs the success callback', async () => {
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useModules());

        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDirectDeleteModule(mockModules[0], onSuccess);
        });

        expect(deleteModule).toHaveBeenCalledWith(1);
        expect(result.current.modules).toEqual([{ id: 2, module_name: 'Physics', module_code: 'PHYS101' }]);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(mockNotify).toHaveBeenCalledWith('Module deleted successfully', 'success');
    });

    it('reports direct delete failures', async () => {
        deleteModule.mockRejectedValueOnce(new Error('delete failed'));
        const { result } = renderHook(() => useModules());

        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => {
            await result.current.handleDirectDeleteModule(mockModules[0]);
        });

        expect(mockNotify).toHaveBeenCalledWith('delete failed', 'error');
    });
});
