import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnreportSociety } from '../../../../components/Society/hooks/useUnreportSociety';
import * as api from '../../../../api/societyApi';
import { useConfirm } from '../../../../context/ConfirmContext';

vi.mock('../../../../api/societyApi', () => ({ unreportSociety: vi.fn() }));
vi.mock('../../../../context/ConfirmContext', () => ({ useConfirm: vi.fn() }));

describe('useUnreportSociety', () => {
    const mockConfirm = vi.fn();
    const onUpdateLocal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useConfirm.mockReturnValue(mockConfirm);
        mockConfirm.mockResolvedValue(true);
        api.unreportSociety.mockResolvedValue({});
    });

    it('calls unreportSociety and updates local state on confirm', async () => {
        const { result } = renderHook(() => useUnreportSociety(onUpdateLocal));
        await act(async () => { await result.current({ id: 1, name: 'TestSoc' }); });
        expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unreport Society' }));
        expect(api.unreportSociety).toHaveBeenCalledWith(1);
        expect(onUpdateLocal).toHaveBeenCalledWith(1, { has_reported: false });
    });

    it('does not call API when confirm is declined', async () => {
        mockConfirm.mockResolvedValue(false);
        const { result } = renderHook(() => useUnreportSociety(onUpdateLocal));
        await act(async () => { await result.current({ id: 2, name: 'Other' }); });
        expect(api.unreportSociety).not.toHaveBeenCalled();
    });

    it('logs error when unreportSociety fails', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.unreportSociety.mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useUnreportSociety(onUpdateLocal));
        await act(async () => { await result.current({ id: 3, name: 'FailSoc' }); });
        expect(spy).toHaveBeenCalledWith('Failed to unreport society:', expect.any(Error));
        spy.mockRestore();
    });
});
