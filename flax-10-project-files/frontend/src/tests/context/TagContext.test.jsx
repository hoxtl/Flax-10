
import { render, screen, act, waitFor, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagProvider, useTags } from '../../context/TagContext';
import * as TagApi from '../../api/tagApi';

vi.mock('../../api/tagApi', () => ({
    getTags: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
}));

const TestComponent = () => {
    const { tags, addTag, updateTag, deleteTag, getTag } = useTags();
    return (
        <div>
            <ul>
                {tags.map(t => <li key={t.id} data-testid={`tag-${t.id}`}>{t.label}</li>)}
            </ul>
            <button onClick={() => addTag({ label: 'New Tag', color: '#000' })}>Add</button>
            <button onClick={() => updateTag(1, { label: 'Updated Class', color: '#000' })}>Update</button>
            <button onClick={() => deleteTag(1)}>Delete</button>
            <span data-testid="get-tag">{getTag(1)?.label}</span>
        </div>
    );
};

describe('TagContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        TagApi.getTags.mockResolvedValue([
            { id: 1, name: 'Class', color: '#000' },
            { id: 2, name: 'Other', color: '#fff' }
        ]);
    });

    it('should load tags from API', async () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId('tag-1')).toHaveTextContent('Class');
            expect(screen.getByTestId('tag-2')).toHaveTextContent('Other');
        });
    });

    it('should add a tag', async () => {
        TagApi.createTag.mockResolvedValue({ id: 3, name: 'New Tag', color: '#000' });
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        await waitFor(() => expect(screen.getByTestId('tag-1')).toBeInTheDocument());

        await act(async () => {
            screen.getByText('Add').click();
        });

        await waitFor(() => expect(screen.getByTestId('tag-3')).toHaveTextContent('New Tag'));
    });

    it('should update a tag', async () => {
        TagApi.updateTag.mockResolvedValue({ id: 1, name: 'Updated Class', color: '#000' });
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        await waitFor(() => expect(screen.getByTestId('tag-1')).toBeInTheDocument());

        await act(async () => {
            screen.getByText('Update').click();
        });

        await waitFor(() => expect(screen.getByTestId('tag-1')).toHaveTextContent('Updated Class'));
    });

    it('should delete a tag', async () => {
        TagApi.deleteTag.mockResolvedValue({});
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        await waitFor(() => expect(screen.getByTestId('tag-1')).toBeInTheDocument());

        await act(async () => {
            screen.getByText('Delete').click();
        });

        await waitFor(() => expect(screen.queryByTestId('tag-1')).not.toBeInTheDocument());
    });

    it('should get tag by id', async () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        await waitFor(() => expect(screen.getByTestId('get-tag')).toHaveTextContent('Class'));
    });

    it('should handle API errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        TagApi.getTags.mockRejectedValueOnce(new Error('Fetch failed'));
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        await waitFor(() => consoleSpy.mock.calls.length > 0, { timeout: 2000 }).catch(() => {}); // fetch error fires async on mount
        // Create error
        TagApi.createTag.mockRejectedValueOnce(new Error('Create failed'));
        await act(async () => { screen.getByText('Add').click(); });
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag:', expect.any(Error));
        // Update error
        TagApi.updateTag.mockRejectedValueOnce(new Error('Update failed'));
        await act(async () => { screen.getByText('Update').click(); });
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update tag:', expect.any(Error));
        // Delete error
        TagApi.deleteTag.mockRejectedValueOnce(new Error('Delete failed'));
        await act(async () => { screen.getByText('Delete').click(); });
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete tag:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should get tag by string id', async () => {
        // We need a wrapper to provide context
        const wrapper = ({ children }) => <TagProvider>{children}</TagProvider>;

        const { result } = renderHook(() => useTags(), { wrapper });

        // Wait for loading to finish
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Test numerical ID retrieval
        expect(result.current.getTag(1)).toEqual(expect.objectContaining({ label: 'Class' }));
        // Test string ID retrieval
        expect(result.current.getTag('1')).toEqual(expect.objectContaining({ label: 'Class' }));
    });

    it('returns safe fallbacks when used outside provider', () => {
        const { result } = renderHook(() => useTags());
        expect(result.current.tags).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.getTag()).toBeNull();
        expect(() => result.current.addTag({ label: 'x', color: '#000' })).not.toThrow();
        expect(() => result.current.updateTag(1, { label: 'x', color: '#000' })).not.toThrow();
        expect(() => result.current.deleteTag(1)).not.toThrow();
        expect(() => result.current.refreshTags()).not.toThrow();
    });

    it('supports getTagByName with case-insensitive lookup and fallback', async () => {
        const wrapper = ({ children }) => <TagProvider>{children}</TagProvider>;
        const { result } = renderHook(() => useTags(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.getTag(undefined)).toEqual(expect.objectContaining({ label: 'None' }));
        expect(result.current.getTag(null)).toEqual(expect.objectContaining({ label: 'None' }));
        expect(result.current.getTagByName('class')).toEqual(expect.objectContaining({ label: 'Class' }));
        expect(result.current.getTagByName('missing')).toEqual(expect.objectContaining({ label: 'Other' }));
        expect(result.current.getTagByName('')).toEqual(expect.objectContaining({ label: 'None' }));
    });

    it('refreshTags handles API errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const wrapper = ({ children }) => <TagProvider>{children}</TagProvider>;
        const { result } = renderHook(() => useTags(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));
        TagApi.getTags.mockRejectedValueOnce(new Error('refresh failed'));

        await act(async () => {
            await result.current.refreshTags();
        });

        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch tags:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('refreshTags updates tags when API succeeds', async () => {
        const wrapper = ({ children }) => <TagProvider>{children}</TagProvider>;
        const { result } = renderHook(() => useTags(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));
        TagApi.getTags.mockResolvedValueOnce([{ id: 7, name: 'Refreshed', color: '#123456', icon: '✅' }]);

        await act(async () => {
            await result.current.refreshTags();
        });

        expect(result.current.tags).toEqual([
            { id: 7, label: 'Refreshed', color: '#123456', icon: '✅' },
        ]);
    });
});
