import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelector, { CategoryDisplay } from '../../../components/society/CategorySelector';

vi.mock('../../../components/common/animated_dropdown', () => ({
    default: ({ value, onChange, options, placeholder }) => (
        <select aria-label={placeholder} value={value} onChange={e => onChange(e.target.value)}>
            {(options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

describe('CategorySelector (single)', () => {
    it('renders label', () => {
        render(<CategorySelector value="" onChange={vi.fn()} label="Category" />);
        expect(screen.getByText('Category')).toBeTruthy();
    });

    it('renders a select dropdown', () => {
        render(<CategorySelector value="" onChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toBeTruthy();
    });

    it('shows placeholder option', () => {
        render(<CategorySelector value="" onChange={vi.fn()} />);
        expect(screen.getByText('Select a category')).toBeTruthy();
    });

    it('calls onChange when selection changes', () => {
        const onChange = vi.fn();
        render(<CategorySelector value="" onChange={onChange} />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'sports' } });
        expect(onChange).toHaveBeenCalledWith('sports');
    });

    it('shows current value selected', () => {
        render(<CategorySelector value="academic" onChange={vi.fn()} />);
        const select = screen.getByRole('combobox');
        expect(select.value).toBe('academic');
    });
});

describe('CategorySelector (multiple)', () => {
    it('renders pill buttons for each category', () => {
        render(<CategorySelector value={[]} onChange={vi.fn()} multiple />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('calls onChange with added category when pill is clicked', () => {
        const onChange = vi.fn();
        render(<CategorySelector value={[]} onChange={onChange} multiple />);
        const firstPill = screen.getAllByRole('button')[0];
        fireEvent.click(firstPill);
        expect(onChange).toHaveBeenCalledWith(expect.any(Array));
        expect(onChange.mock.calls[0][0].length).toBe(1);
    });

    it('calls onChange with removed category when already selected pill is clicked', () => {
        const onChange = vi.fn();
        render(<CategorySelector value={['sports']} onChange={onChange} multiple />);
        fireEvent.click(screen.getByText('Sports'));
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('handles non-array value gracefully', () => {
        const onChange = vi.fn();
        render(<CategorySelector value={null} onChange={onChange} multiple />);
        const firstPill = screen.getAllByRole('button')[0];
        fireEvent.click(firstPill);
        expect(onChange).toHaveBeenCalled();
    });
});

describe('CategoryDisplay', () => {
    it('returns null when no categories and not in edit mode', () => {
        const { container } = render(<CategoryDisplay category={[]} editMode={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders category badges', () => {
        render(<CategoryDisplay category={['sports']} editMode={false} />);
        expect(screen.getByText('Sports')).toBeTruthy();
    });

    it('renders multiple categories', () => {
        render(<CategoryDisplay category={['sports', 'cultural']} editMode={false} />);
        expect(screen.getByText('Sports')).toBeTruthy();
        expect(screen.getByText('Cultural')).toBeTruthy();
    });

    it('renders "No category" when empty and in edit mode', () => {
        render(<CategoryDisplay category={[]} editMode={true} />);
        expect(screen.getByText('No category')).toBeTruthy();
    });

    it('renders edit button in edit mode', () => {
        render(<CategoryDisplay category={['sports']} editMode={true} onEdit={vi.fn()} />);
        expect(screen.getByText('✎')).toBeTruthy();
    });

    it('calls onEdit when edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<CategoryDisplay category={['sports']} editMode={true} onEdit={onEdit} />);
        fireEvent.click(screen.getByText('✎'));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('handles string category (not array)', () => {
        render(<CategoryDisplay category="sports" editMode={false} />);
        expect(screen.getByText('Sports')).toBeTruthy();
    });

    it('falls back to raw id for unknown category', () => {
        render(<CategoryDisplay category={['unknown_cat']} editMode={false} />);
        expect(screen.getByText('unknown_cat')).toBeTruthy();
    });
});
