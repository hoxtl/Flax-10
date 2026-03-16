import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useModuleSorting from '../../../../components/Modules/hooks/useModuleSorting';
import * as moduleUtils from '../../../../components/Modules/utils/moduleUtils';

vi.mock('../../../../components/Modules/utils/moduleUtils', () => ({
    applyFiltersAndSort: vi.fn((modules) => [...(modules || [])]),
}));

describe('useModuleSorting', () => {
    const mockModules = [
        { id: 1, module_code: 'CS101', module_name: 'Alpha' },
        { id: 2, module_code: 'MA102', module_name: 'Beta' },
        { id: 3, module_code: 'PH103', module_name: 'Gamma' },
    ];

    beforeEach(() => {
        vi.mocked(moduleUtils.applyFiltersAndSort).mockReturnValue([...mockModules]);
    });

    it('returns pageModules, results, department, sortBy, currentPage, totalPages and handlers', () => {
        const { result } = renderHook(() => useModuleSorting(mockModules));
        expect(result.current.pageModules).toBeDefined();
        expect(result.current.results).toBeDefined();
        expect(result.current.department).toBe('all');
        expect(result.current.sortBy).toBe('name');
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBeDefined();
        expect(typeof result.current.handleNewDepartment).toBe('function');
        expect(typeof result.current.handleNewSort).toBe('function');
        expect(typeof result.current.setCurrentPage).toBe('function');
    });

    it('calls applyFiltersAndSort with modules, department and sortBy', () => {
        renderHook(() => useModuleSorting(mockModules));
        expect(moduleUtils.applyFiltersAndSort).toHaveBeenCalledWith(mockModules, 'all', 'name');
    });

    it('paginates results with PAGE_SIZE 9', () => {
        const ten = Array.from({ length: 10 }, (_, i) => ({ id: i, module_code: 'CS', module_name: `M${i}` }));
        moduleUtils.applyFiltersAndSort.mockReturnValue(ten);
        const { result } = renderHook(() => useModuleSorting(ten));
        expect(result.current.pageModules).toHaveLength(9);
        expect(result.current.totalPages).toBe(2);
    });

    it('handleNewDepartment updates department and resets currentPage to 1', () => {
        const { result } = renderHook(() => useModuleSorting(mockModules));
        act(() => result.current.setCurrentPage(3));
        expect(result.current.currentPage).toBe(3);
        act(() => result.current.handleNewDepartment('Natural, Mathematical & Engineering Sciences'));
        expect(result.current.department).toBe('Natural, Mathematical & Engineering Sciences');
        expect(result.current.currentPage).toBe(1);
        expect(moduleUtils.applyFiltersAndSort).toHaveBeenLastCalledWith(
            mockModules,
            'Natural, Mathematical & Engineering Sciences',
            'name'
        );
    });

    it('handleNewSort updates sortBy and resets currentPage to 1', () => {
        const { result } = renderHook(() => useModuleSorting(mockModules));
        act(() => result.current.setCurrentPage(2));
        act(() => result.current.handleNewSort('deadlines'));
        expect(result.current.sortBy).toBe('deadlines');
        expect(result.current.currentPage).toBe(1);
        expect(moduleUtils.applyFiltersAndSort).toHaveBeenLastCalledWith(mockModules, 'all', 'deadlines');
    });
});
