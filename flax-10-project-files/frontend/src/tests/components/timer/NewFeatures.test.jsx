import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
<<<<<<< HEAD
import { TaskInput } from '../../../components/timer/TimerComponents';
=======
import { SoundSelector, TaskInput } from '../../../components/Timer/TimerComponents';
import { noiseGenerator } from '../../../components/Timer/utils/noiseUtils';

// Mock AnimatedDropdown to use native select for testability
vi.mock('../../../components/common/AnimatedDropdown', () => ({
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

describe('TaskInput', () => {
    it('shows the current focus task instead of a text input', () => {
        render(<TaskInput value="My Task" onChange={vi.fn()} />);
        expect(screen.getByText('Currently focusing on')).toBeInTheDocument();
        expect(screen.getByText('My Task')).toBeInTheDocument();
    });

    it('renders matching action buttons for choosing a task and opening full focus', () => {
        render(<TaskInput value="" onChange={vi.fn()} onOpenFocus={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Choose a task to focus' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Full Focus Mode ⚡' })).toBeInTheDocument();
    });

    it('clears the selected task through the clear action', () => {
        const onChange = vi.fn();
        const onClearTask = vi.fn();
        render(<TaskInput value="Task" onChange={onChange} onClearTask={onClearTask} />);

        fireEvent.click(screen.getByRole('button', { name: 'Clear task' }));

        expect(onChange).toHaveBeenCalledWith('');
        expect(onClearTask).toHaveBeenCalledTimes(1);
    });
});
