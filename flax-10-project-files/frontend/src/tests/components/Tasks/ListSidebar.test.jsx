/* Tests for ListSidebar component rendering, selection, and list management */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../utils/testUtils';
import ListSidebar from '../../../pages/tasks/components/ListSidebar';

vi.mock('../../../pages/tasks/constants/focusBlockColours', () => ({
    FOCUS_BLOCK_COLOURS_HEX: ['#ff0000', '#00ff00', '#0000ff'],
}));

<<<<<<< HEAD
vi.mock('../../../components/common/hold_confirm_modal/HoldConfirmModal', () => ({
=======
vi.mock('../../../components/common/HoldConfirmModal/HoldConfirmModal', () => ({
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    default: ({ holdLabel = 'Hold to Delete', onConfirm, onCancel }) => (
        <div>
            <button type="button" onMouseDown={onConfirm}>
                {holdLabel}
            </button>
            <button type="button" onClick={onCancel}>
                Cancel
            </button>
        </div>
    ),
}));

const defaultProps = {
    lists: [],
    tasks: [],
    activeListId: null,
    activeFilter: 'all',
    onSelectList: vi.fn(),
    onSelectFilter: vi.fn(),
    onNewList: vi.fn(),
    onDeleteList: vi.fn(),
    onRenameList: vi.fn(),
    onUnarchiveList: vi.fn(),
    onPermanentlyDeleteList: vi.fn(),
    archivedLists: [],
};

describe('ListSidebar', () => {
    it('renders VIEWS and list sections', () => {
        render(<ListSidebar {...defaultProps} />);
        expect(screen.getByText('VIEWS')).toBeTruthy();
        expect(screen.getByText('LIFE')).toBeTruthy();
    });

    it('renders smart filters', () => {
        render(<ListSidebar {...defaultProps} />);
        expect(screen.getByText('All tasks')).toBeTruthy();
        expect(screen.getByText('Today')).toBeTruthy();
        expect(screen.getByText('This Week')).toBeTruthy();
        expect(screen.getByText('Later')).toBeTruthy();
    });

    it('does not show overdue filter when no overdue tasks', () => {
        render(<ListSidebar {...defaultProps} />);
        expect(screen.queryByText('Overdue')).toBeNull();
    });

    it('shows overdue filter when there are overdue tasks', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const tasks = [{ id: 1, title: 'Late task', completed: false, due_date: pastDate.toISOString() }];
        render(<ListSidebar {...defaultProps} tasks={tasks} />);
        expect(screen.getByText('Overdue')).toBeTruthy();
    });

    it('shows "No lists yet" when lists is empty', () => {
        render(<ListSidebar {...defaultProps} />);
        expect(screen.getByText('No lists yet')).toBeTruthy();
    });

    it('renders list names', () => {
        const lists = [
            { id: 1, name: 'Work' },
            { id: 2, name: 'Personal' },
        ];
        render(<ListSidebar {...defaultProps} lists={lists} />);
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Personal')).toBeTruthy();
    });

    it('renders reading lists as module name followed by code in brackets', () => {
        const lists = [
            { id: 7, name: 'LW4202 - Constitutional Law' },
        ];
        render(<ListSidebar {...defaultProps} lists={lists} />);
        expect(screen.getByText('Constitutional Law (LW4202)')).toBeTruthy();
    });

<<<<<<< HEAD
    it('renders society lists in a dedicated societies section', () => {
        const lists = [
            { id: 12, name: 'Chess Society Admin', category: 'society', society_name: 'Chess Society' },
        ];
        render(<ListSidebar {...defaultProps} lists={lists} />);
        expect(screen.getByText('SOCIETIES')).toBeTruthy();
        expect(screen.getByText('Chess Society')).toBeTruthy();
    });

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    it('calls onNewList when "+ Add list" is clicked', () => {
        const onNewList = vi.fn();
        render(<ListSidebar {...defaultProps} onNewList={onNewList} />);
        fireEvent.click(screen.getByText('+ Add list'));
        expect(onNewList).toHaveBeenCalledTimes(1);
    });

    it('calls onSelectFilter and onSelectList when filter clicked', () => {
        const onSelectFilter = vi.fn();
        const onSelectList = vi.fn();
        render(<ListSidebar {...defaultProps} onSelectFilter={onSelectFilter} onSelectList={onSelectList} />);
        fireEvent.click(screen.getByText('Today'));
        expect(onSelectFilter).toHaveBeenCalledWith('today');
        expect(onSelectList).toHaveBeenCalledWith(null);
    });

    it('calls onSelectList when a list is clicked', () => {
        const onSelectList = vi.fn();
        const onSelectFilter = vi.fn();
        const lists = [{ id: 1, name: 'Work' }];
        render(<ListSidebar {...defaultProps} lists={lists} onSelectList={onSelectList} onSelectFilter={onSelectFilter} />);
        fireEvent.click(screen.getByText('Work'));
        expect(onSelectList).toHaveBeenCalledWith(1);
        expect(onSelectFilter).toHaveBeenCalledWith('all');
    });

    it('shows task count for filter when tasks exist', () => {
        const tasks = [
            { id: 1, title: 'Task', completed: false, due_date: null },
        ];
        render(<ListSidebar {...defaultProps} tasks={tasks} />);
        // allCount should be 1
        expect(screen.getByText('1')).toBeTruthy();
    });

    it('shows archived section toggle when archivedLists not empty', () => {
        const archivedLists = [{ id: 99, name: 'Archived List' }];
        render(<ListSidebar {...defaultProps} archivedLists={archivedLists} />);
        expect(screen.getByText(/Archived/)).toBeTruthy();
    });

    it('toggles archived list visibility on click', () => {
        const archivedLists = [{ id: 99, name: 'Old List' }];
        render(<ListSidebar {...defaultProps} archivedLists={archivedLists} />);
        const toggleBtn = screen.getByText(/Archived/);
        fireEvent.click(toggleBtn);
        expect(screen.getByText('Old List')).toBeTruthy();
    });

    it('calls onUnarchiveList when Restore is clicked', () => {
        const onUnarchiveList = vi.fn();
        const archivedLists = [{ id: 99, name: 'Old List' }];
        render(<ListSidebar {...defaultProps} archivedLists={archivedLists} onUnarchiveList={onUnarchiveList} />);
        fireEvent.click(screen.getByText(/Archived/));
        fireEvent.click(screen.getByText('Restore'));
        expect(onUnarchiveList).toHaveBeenCalledWith(99);
    });

    it('shows list count when tasks assigned to list', () => {
        const lists = [{ id: 1, name: 'Work' }];
        const tasks = [
            { id: 1, title: 'Task 1', completed: false, task_list: 1, due_date: null },
            { id: 2, title: 'Task 2', completed: false, task_list: 1, due_date: null },
        ];
        render(<ListSidebar {...defaultProps} lists={lists} tasks={tasks} />);
        // The count "2" should appear next to the Work list
        const counts = screen.getAllByText('2');
        expect(counts.length).toBeGreaterThan(0);
    });

    it('shows context menu on list right-click', () => {
        const lists = [{ id: 1, name: 'Work' }];
        render(<ListSidebar {...defaultProps} lists={lists} />);
        fireEvent.contextMenu(screen.getByText('Work'));
        expect(screen.getByText('Rename')).toBeTruthy();
        expect(screen.getByText('Delete list')).toBeTruthy();
    });

    it('calls onRenameList when Rename clicked and name saved', () => {
        const onRenameList = vi.fn();
        const lists = [{ id: 1, name: 'Work' }];
        render(<ListSidebar {...defaultProps} lists={lists} onRenameList={onRenameList} />);
        fireEvent.contextMenu(screen.getByText('Work'));
        fireEvent.click(screen.getByText('Rename'));
        const input = screen.getByDisplayValue('Work');
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.blur(input);
        expect(onRenameList).toHaveBeenCalledWith(1, 'New Name');
    });

    it('calls onDeleteList when Delete list clicked', () => {
        const onDeleteList = vi.fn();
        const lists = [{ id: 1, name: 'Work' }];
        render(<ListSidebar {...defaultProps} lists={lists} onDeleteList={onDeleteList} />);
        fireEvent.contextMenu(screen.getByText('Work'));
        fireEvent.click(screen.getByText('Delete list'));
        const holdBtn = screen.getByRole('button', { name: /Hold to Delete/i });
        fireEvent.mouseDown(holdBtn);
        expect(onDeleteList).toHaveBeenCalledWith(1);
    });

    it('calls onPermanentlyDeleteList when Delete clicked on archived list', () => {
        const onPermanentlyDeleteList = vi.fn();
        const archivedLists = [{ id: 99, name: 'Old List' }];
        render(<ListSidebar {...defaultProps} archivedLists={archivedLists} onPermanentlyDeleteList={onPermanentlyDeleteList} />);
        fireEvent.click(screen.getByText(/Archived/));
        const deleteBtns = screen.getAllByText('Delete');
        fireEvent.click(deleteBtns[deleteBtns.length - 1]);
        const holdBtn = screen.getByRole('button', { name: /Hold to Delete/i });
        fireEvent.mouseDown(holdBtn);
        expect(onPermanentlyDeleteList).toHaveBeenCalledWith(99);
    });
});
