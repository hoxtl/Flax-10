import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({
        tags: [
            { id: 1, name: 'lecture', icon: '📚', color: '#3b82f6', label: 'Lecture' },
            { id: 2, name: 'social', icon: '🎉', color: '#f59e0b', label: 'Social' },
        ],
    })),
}));

vi.mock('../../../api/moduleApi', () => ({
    getModules: vi.fn().mockResolvedValue([
        { id: 1, module_code: 'CS101', module_name: 'Intro to CS' },
    ]),
}));

vi.mock('../../../components/common/StandardModal/StandardModal', () => ({
    default: ({ title, subtitle, onClose, children }) => (
        <div data-testid="standard-modal">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

import QuickAddModal from '../../../components/Dashboard/QuickAddModal';

function renderModal(props = {}) {
    return render(
        <QuickAddModal
            onClose={vi.fn()}
            onSelectType={vi.fn()}
            isTeacher={false}
            {...props}
        />
    );
}

describe('QuickAddModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Quick Add title initially', () => {
        renderModal();
        expect(screen.getByText('Quick Add')).toBeTruthy();
    });

    it('renders core type tiles', () => {
        renderModal();
        expect(screen.getByText('Event')).toBeTruthy();
        expect(screen.getByText('Society')).toBeTruthy();
        expect(screen.getByText('Task')).toBeTruthy();
    });

    it('shows Coming Soon for locked Group tile', () => {
        renderModal();
        expect(screen.getByText('Coming Soon')).toBeTruthy();
    });

    it('calls onSelectType with "society" when Society tile is clicked', () => {
        const onSelectType = vi.fn();
        renderModal({ onSelectType });
        fireEvent.click(screen.getByText('Society'));
        expect(onSelectType).toHaveBeenCalledWith('society');
    });

    it('calls onSelectType with "task" when Task tile is clicked', () => {
        const onSelectType = vi.fn();
        renderModal({ onSelectType });
        fireEvent.click(screen.getByText('Task'));
        expect(onSelectType).toHaveBeenCalledWith('task');
    });

    it('navigates to tag view when Event tile is clicked', () => {
        renderModal();
        fireEvent.click(screen.getByText('Event'));
        expect(screen.getByText('Choose Event Tag')).toBeTruthy();
    });

    it('shows tag tiles in tag view', () => {
        renderModal();
        fireEvent.click(screen.getByText('Event'));
        expect(screen.getByText('Lecture')).toBeTruthy();
        expect(screen.getByText('Social')).toBeTruthy();
    });

    it('shows Module tile for teacher', () => {
        renderModal({ isTeacher: true });
        expect(screen.getByText('Module')).toBeTruthy();
    });

    it('navigates to module view when Module tile is clicked', () => {
        renderModal({ isTeacher: true });
        fireEvent.click(screen.getByText('Module'));
        expect(screen.getByText('Module Options')).toBeTruthy();
    });

    it('navigates to module picker when Add Deadline is clicked', () => {
        renderModal({ isTeacher: true });
        fireEvent.click(screen.getByText('Module'));
        fireEvent.click(screen.getByText('Add Deadline'));
        expect(screen.getByText('Select Module')).toBeTruthy();
    });

    it('calls onSelectType with tag id when tag is selected in tag view', () => {
        const onSelectType = vi.fn();
        renderModal({ onSelectType });
        fireEvent.click(screen.getByText('Event'));
        fireEvent.click(screen.getByText('Lecture'));
        expect(onSelectType).toHaveBeenCalledWith(1);
    });

    it('calls onSelectType with add_deadline and module when module selected in picker', async () => {
        const onSelectType = vi.fn();
        renderModal({ isTeacher: true, onSelectType });
        fireEvent.click(screen.getByText('Module'));
        fireEvent.click(screen.getByText('Add Deadline'));
        await vi.waitFor(() => expect(screen.getByText('CS101')).toBeTruthy());
        fireEvent.click(screen.getByText('CS101'));
        expect(onSelectType).toHaveBeenCalledWith('add_deadline', { id: 1, module_code: 'CS101', module_name: 'Intro to CS' });
    });

    it('shows Create New Module and Add Deadline in module options', () => {
        renderModal({ isTeacher: true });
        fireEvent.click(screen.getByText('Module'));
        expect(screen.getByText('Create New Module')).toBeTruthy();
        expect(screen.getByText('Add Deadline')).toBeTruthy();
    });

    it('calls onSelectType with create_module when Create New Module is clicked', () => {
        const onSelectType = vi.fn();
        renderModal({ isTeacher: true, onSelectType });
        fireEvent.click(screen.getByText('Module'));
        fireEvent.click(screen.getByText('Create New Module'));
        expect(onSelectType).toHaveBeenCalledWith('create_module');
    });

    it('shows loading or no modules when getModules returns empty', async () => {
        const { getModules } = await import('../../../api/moduleApi');
        getModules.mockResolvedValueOnce([]);
        renderModal({ isTeacher: true });
        fireEvent.click(screen.getByText('Module'));
        fireEvent.click(screen.getByText('Add Deadline'));
        await waitFor(() => expect(screen.getByText(/Loading or no modules/)).toBeTruthy());
    });

    it('calls onClose when Close button is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
