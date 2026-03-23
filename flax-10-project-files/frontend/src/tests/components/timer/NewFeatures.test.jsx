import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskInput } from '../../../components/Timer/TimerComponents';

describe('TaskInput', () => {
    it('renders with correct value', () => {
        const onChange = vi.fn();
        render(<TaskInput value="My Task" onChange={onChange} />);
        const input = screen.getByPlaceholderText(/What are you working on/i);
        expect(input.value).toBe('My Task');
    });

    it('calls onChange when typing', () => {
        const onChange = vi.fn();
        render(<TaskInput value="" onChange={onChange} />);
        const input = screen.getByPlaceholderText(/What are you working on/i);

        fireEvent.change(input, { target: { value: 'T' } });
        expect(onChange).toHaveBeenCalledWith('T');
    });

    it('blurs on Enter key', () => {
        const onChange = vi.fn();
        render(<TaskInput value="Task" onChange={onChange} />);
        const input = screen.getByPlaceholderText(/What are you working on/i);

        const blurSpy = vi.spyOn(input, 'blur');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(blurSpy).toHaveBeenCalled();
    });
});
