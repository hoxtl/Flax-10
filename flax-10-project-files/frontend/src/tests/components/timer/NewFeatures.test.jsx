import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoundSelector, TaskInput } from '../../../components/Timer/TimerComponents';
import { noiseGenerator } from '../../../components/Timer/utils/noiseUtils';

// Mock AnimatedDropdown to use native select for testability
vi.mock('../../../components/ui/AnimatedDropdown', () => ({
    default: ({ value, onChange, options }) => (
        <select value={value} onChange={e => onChange(e.target.value)}>
            {(options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

// Mock noiseGenerator
vi.mock('../../../components/Timer/utils/noiseUtils', () => ({
    noiseGenerator: {
        play: vi.fn(),
        stop: vi.fn(),
        setVolume: vi.fn(),
    },
}));

describe('SoundSelector', () => {
    it('renders with default "None" selected', () => {
        render(<SoundSelector />);
        const select = screen.getByRole('combobox');
        expect(select.value).toBe('none');
    });

    it('plays noise when selected', () => {
        render(<SoundSelector />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'pink' } });

        expect(noiseGenerator.play).toHaveBeenCalledWith('pink');
        expect(noiseGenerator.setVolume).toHaveBeenCalledWith(0.5);
    });

    it('stops noise when "None" is selected', () => {
        render(<SoundSelector />);
        const select = screen.getByRole('combobox');

        // Select pink first
        fireEvent.change(select, { target: { value: 'pink' } });

        // Select none
        fireEvent.change(select, { target: { value: 'none' } });

        expect(noiseGenerator.stop).toHaveBeenCalled();
    });

    it('stops noise on unmount', () => {
        const { unmount } = render(<SoundSelector />);
        unmount();
        expect(noiseGenerator.stop).toHaveBeenCalled();
    });
});

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
