import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('module_api', () => {
    let fetchApi;
    let api;

    beforeEach(async () => {
        vi.clearAllMocks();
        fetchApi = (await import('../../api/client')).fetchApi;
        api = await import('../../api/module_api');
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

    it('gshould get enrollments', async () => {
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
});