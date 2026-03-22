/*
 * Tests for ModuleForm component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../api/modules/moduleApi', () => ({
    createModule: vi.fn().mockResolvedValue({ id: 99 }),
    updateModule: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock('../../../components/Modules/utils/moduleUtils', () => ({
    serialiseModule: vi.fn(data => data),
}));

vi.mock('../../../components/Modules/utils/moduleHelpers', () => ({
    validateForm: vi.fn(() => ({})),
    getFormData: vi.fn(module => module || {}),
    updateForm: vi.fn((field, value, form) => ({ ...form, [field]: value })),
}));

import ModuleForm from '../../../components/Modules/Modules/ModuleForm';
import { createModule, updateModule } from '../../../api/modules/moduleApi';
import { validateForm } from '../../../components/Modules/utils/moduleHelpers';

const defaultModule = {
    id: 1,
    module_code: 'CS101',
    name: 'Intro to CS',
    lecturer_name: 'Dr Smith',
    description: 'A great module',
    location: 'Room 1',
    day: 'Monday',
    start_time: '09:00',
    end_time: '11:00',
    is_recurring: true,
};

describe('ModuleForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form fields', () => {
        render(<ModuleForm module={null} isEditing={false} onSuccess={vi.fn()} onCancel={vi.fn()} />);
        // Should render a form
        expect(screen.getByRole('button', { name: /add module|create|submit/i }) ||
               screen.getAllByRole('button')[0]).toBeTruthy();
    });

    it('renders cancel button', () => {
        render(<ModuleForm module={null} isEditing={false} onSuccess={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText(/cancel/i)).toBeTruthy();
    });

    it('calls onCancel when cancel button clicked', () => {
        const onCancel = vi.fn();
        render(<ModuleForm module={null} isEditing={false} onSuccess={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText(/cancel/i));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('shows validation errors on submit with invalid form', async () => {
        validateForm.mockReturnValueOnce({ module_code: 'Module code required' });
        render(<ModuleForm module={null} isEditing={false} onSuccess={vi.fn()} onCancel={vi.fn()} />);
        const form = document.querySelector('form');
        fireEvent.submit(form);
        await waitFor(() => expect(screen.getByText('Module code required')).toBeTruthy());
    });

    it('calls createModule on valid new module submit', async () => {
        render(<ModuleForm module={null} isEditing={false} onSuccess={vi.fn()} onCancel={vi.fn()} />);
        const form = document.querySelector('form');
        fireEvent.submit(form);
        await waitFor(() => expect(createModule).toHaveBeenCalledOnce());
    });

    it('calls onSuccess after successful create', async () => {
        const onSuccess = vi.fn();
        render(<ModuleForm module={null} isEditing={false} onSuccess={onSuccess} onCancel={vi.fn()} />);
        const form = document.querySelector('form');
        fireEvent.submit(form);
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 99 }, true));
    });

    it('calls updateModule when editing', async () => {
        render(<ModuleForm module={defaultModule} isEditing={true} onSuccess={vi.fn()} onCancel={vi.fn()} />);
        const form = document.querySelector('form');
        fireEvent.submit(form);
        await waitFor(() => expect(updateModule).toHaveBeenCalledWith(1, expect.anything()));
    });

    it('shows submit error when API fails', async () => {
        createModule.mockRejectedValueOnce(new Error('Server error'));
        render(<ModuleForm module={null} isEditing={false} onSuccess={vi.fn()} onCancel={vi.fn()} />);
        const form = document.querySelector('form');
        fireEvent.submit(form);
        await waitFor(() => expect(screen.getByText('Server error')).toBeTruthy());
    });
});
