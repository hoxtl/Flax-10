
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagProvider, useTags } from '../../context/TagContext';

const TestComponent = () => {
    const { tags, addTag, updateTag, deleteTag, getTag } = useTags();
    return (
        <div>
            <ul>
                {tags.map(t => <li key={t.id} data-testid={`tag-${t.id}`}>{t.label}</li>)}
            </ul>
            <button onClick={() => addTag({ id: 'new', label: 'New Tag', color: '#000' })}>Add</button>
            <button onClick={() => updateTag('class', { label: 'Updated Class' })}>Update</button>
            <button onClick={() => deleteTag('task')}>Delete</button>
            <span data-testid="get-tag">{getTag('study')?.label}</span>
        </div>
    );
};

describe('TagContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should provide default tags', () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        expect(screen.getByTestId('tag-class')).toHaveTextContent('Class');
        expect(screen.getByTestId('tag-other')).toHaveTextContent('Other');
    });

    it('should load tags from localStorage', () => {
        const savedTags = [{ id: 'saved', label: 'Saved Tag', color: '#fff' }];
        localStorage.setItem('calendar_tags', JSON.stringify(savedTags));

        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        expect(screen.getByTestId('tag-saved')).toHaveTextContent('Saved Tag');
        // 'other' tag is automatically added if missing
        expect(screen.getByTestId('tag-other')).toHaveTextContent('Other');
    });

    it('should add a tag', async () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );

        await act(async () => {
            screen.getByText('Add').click();
        });

        expect(screen.getByTestId('tag-new')).toHaveTextContent('New Tag');
    });

    it('should update a tag', async () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );

        expect(screen.getByTestId('tag-class')).toHaveTextContent('Class');

        await act(async () => {
            screen.getByText('Update').click();
        });

        expect(screen.getByTestId('tag-class')).toHaveTextContent('Updated Class');
    });

    it('should delete a tag', async () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );

        expect(screen.getByTestId('tag-task')).toBeInTheDocument();

        await act(async () => {
            screen.getByText('Delete').click();
        });

        expect(screen.queryByTestId('tag-task')).not.toBeInTheDocument();
    });

    it('should not delete "other" tag', async () => {
        const CannotDeleteOther = () => {
            const { deleteTag, tags } = useTags();
            return (
                <div>
                    {tags.map(t => <span key={t.id}>{t.label}</span>)}
                    <button onClick={() => deleteTag('other')}>Delete Other</button>
                </div>
            );
        };
        render(
            <TagProvider>
                <CannotDeleteOther />
            </TagProvider>
        );
        await act(async () => {
            screen.getByText('Delete Other').click();
        });
        expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should get tag by id or fallback to other', () => {
        render(
            <TagProvider>
                <TestComponent />
            </TagProvider>
        );
        expect(screen.getByTestId('get-tag')).toHaveTextContent('Study');
    });
});
