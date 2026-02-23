import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('moduleApi', () => {
    let fetchApi;
    let api;

    beforeEach(async () => {
        vi.clearAllMocks();
        fetchApi = (await import('../../api/client')).fetchApi;
        api = await import('../../api/moduleApi');
    });

    it('should fetch modules', async () => {
        await api.getModules();
        expect(fetchApi).toHaveBeenCalledWith('/modules/');
    });

    it('should get module details', async () => {
        await api.getModuleDetails(1);
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/');
    });

    it('should create module', async () => {
        await api.createModule({ module_code: 'CS101' });
        expect(fetchApi).toHaveBeenCalledWith('/modules/', expect.objectContaining({ method: 'POST' }));
    });

    it('should update module', async () => {
        await api.updateModule(1, { module_name: 'Updated' });
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/', expect.objectContaining({ method: 'PUT' }));
    });

    it('should delete module', async () => {
        await api.deleteModule(1);
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should get enrollments', async () => {
        await api.getEnrollments();
        expect(fetchApi).toHaveBeenCalledWith('/enrollments/');
    });

    it('should enroll student into a module', async () => {
        await api.enrollInModule(5);
        expect(fetchApi).toHaveBeenCalledWith('/enrollments/', expect.objectContaining({ method: 'POST' }));
    });

    it('should disenrol a student from a module', async () => {
        await api.disenrolFromModule(3);
        expect(fetchApi).toHaveBeenCalledWith('/enrollments/3/', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should disenrol by module id when enrollment exists', async () => {
        fetchApi.mockResolvedValueOnce([{ id: 10, module: 7 }]); 
        fetchApi.mockResolvedValueOnce(undefined);              
        await api.disenrolByModuleId(7);
        expect(fetchApi).toHaveBeenCalledWith('/enrollments/');
        expect(fetchApi).toHaveBeenCalledWith('/enrollments/10/', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should throw when not enrolled in module', async () => {
        fetchApi.mockResolvedValueOnce([{ id: 10, module: 99 }]); 
        await expect(api.disenrolByModuleId(7)).rejects.toThrow('Not enrolled in this module');
    });
});