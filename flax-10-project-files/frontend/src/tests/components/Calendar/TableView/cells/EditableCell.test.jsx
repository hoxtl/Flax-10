/**
 * Tests for EditableCell - Inline editable cell for table view.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditableCell } from '../../../../../components/Calendar/TableView/cells/EditableCell';

describe('EditableCell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders text display when not editing', () => {
        render(<EditableCell value="Test Value" isEditing={false} onChange={vi.fn()} onKeyDown={vi.fn()} />);
        expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('renders dash for empty value when not editing', () => {
        render(<EditableCell value="" isEditing={false} onChange={vi.fn()} onKeyDown={vi.fn()} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders dash for null value when not editing', () => {
        render(<EditableCell value={null} isEditing={false} onChange={vi.fn()} onKeyDown={vi.fn()} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders text input when editing', () => {
        render(<EditableCell value="Edit me" isEditing={true} onChange={vi.fn()} onKeyDown={vi.fn()} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('Edit me');
    });

    it('renders textarea when editing and isTextarea is true', () => {
        render(<EditableCell value="Long text" isEditing={true} onChange={vi.fn()} onKeyDown={vi.fn()} isTextarea />);
        const textarea = screen.getByRole('textbox');
        expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('calls onChange when input value changes', () => {
        const onChange = vi.fn();
        render(<EditableCell value="Test" isEditing={true} onChange={onChange} onKeyDown={vi.fn()} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated' } });
        expect(onChange).toHaveBeenCalledWith('Updated');
    });

    it('calls onKeyDown when key pressed in input', () => {
        const onKeyDown = vi.fn();
        render(<EditableCell value="Test" isEditing={true} onChange={vi.fn()} onKeyDown={onKeyDown} />);
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalled();
    });

    it('calls onChange when textarea value changes', () => {
        const onChange = vi.fn();
        render(<EditableCell value="Text" isEditing={true} onChange={onChange} onKeyDown={vi.fn()} isTextarea />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } });
        expect(onChange).toHaveBeenCalledWith('New text');
    });

    it('calls onKeyDown when key pressed in textarea', () => {
        const onKeyDown = vi.fn();
        render(<EditableCell value="Text" isEditing={true} onChange={vi.fn()} onKeyDown={onKeyDown} isTextarea />);
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
        expect(onKeyDown).toHaveBeenCalled();
    });

    it('auto-focuses input when editing starts', () => {
        render(<EditableCell value="Focus me" isEditing={true} onChange={vi.fn()} onKeyDown={vi.fn()} />);
        expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('selects all text when input focused', () => {
        render(<EditableCell value="Select all" isEditing={true} onChange={vi.fn()} onKeyDown={vi.fn()} />);
        const input = screen.getByRole('textbox');
        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(10);
    });
});
