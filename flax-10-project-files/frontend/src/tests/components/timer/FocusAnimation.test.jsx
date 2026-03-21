import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
<<<<<<< HEAD
import FocusAnimation from '../../../components/timer/FocusAnimation';

vi.mock('../../../pages/timer/TimerPage.module.css', () => ({
    default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock('../../../components/timer/TreeAnimation.module.css', () => ({
=======
import FocusAnimation from '../../../components/Timer/FocusAnimation';

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({
    default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock('../../../components/Timer/TreeAnimation.module.css', () => ({
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    default: new Proxy({}, { get: (_, key) => key }),
}));

// Canvas mock for GalaxyAnim
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
}));

// Stub requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
});

describe('FocusAnimation', () => {
    it('defaults to tree animation when localStorage is empty', () => {
        render(<FocusAnimation progress={0.5} mode="work" isActive={false} />);
        const activeBtn = screen.getByTitle('Tree');
        expect(activeBtn.className).toContain('animPickerBtnActive');
    });

    it('renders 5 picker buttons', () => {
        render(<FocusAnimation progress={0.5} mode="work" isActive={false} />);
        const buttons = screen.getAllByRole('button');
        // 5 picker buttons
        const pickerBtns = buttons.filter(b => b.title && ['Tree', 'Orb', 'Fire', 'Ripple', 'Galaxy'].includes(b.title));
        expect(pickerBtns).toHaveLength(5);
    });

    it('clicking a picker button stores the type in localStorage', () => {
        render(<FocusAnimation progress={0.5} mode="work" isActive={true} />);
        const orbBtn = screen.getByTitle('Orb');
        fireEvent.click(orbBtn);
        expect(localStorage.getItem('focusAnimationType')).toBe('orb');
    });

    it('reads stored animation type from localStorage on mount', () => {
        localStorage.setItem('focusAnimationType', 'fire');
        render(<FocusAnimation progress={0.5} mode="work" isActive={true} />);
        const fireBtn = screen.getByTitle('Fire');
        expect(fireBtn.className).toContain('animPickerBtnActive');
    });

    it.each(['tree', 'orb', 'fire', 'ripple', 'galaxy'])(
        'renders without crashing for animation type: %s',
        (type) => {
            localStorage.setItem('focusAnimationType', type);
            expect(() =>
                render(<FocusAnimation progress={0.5} mode="work" isActive={true} />)
            ).not.toThrow();
        }
    );
});
