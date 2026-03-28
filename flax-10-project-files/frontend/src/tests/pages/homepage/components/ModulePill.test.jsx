import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
}));

import { ModulePill, TypePill, getModulePillColors } from '../../../../pages/homepage/components/ModulePill';

describe('getModulePillColors', () => {
    it('returns known colors for PS4202', () => {
        const colors = getModulePillColors('PS4202');
        expect(colors.bg).toBe('#F3F0FF');
    });

    it('returns hash-based colors for unknown code', () => {
        const colors = getModulePillColors('ZZ9999');
        expect(colors.bg).toBeTruthy();
    });

    it('handles empty string', () => {
        const colors = getModulePillColors('');
        expect(colors).toBeTruthy();
    });

    it('handles null', () => {
        const colors = getModulePillColors(null);
        expect(colors).toBeTruthy();
    });

    it('handles non-string via toString', () => {
        const colors = getModulePillColors(12345);
        expect(colors).toBeTruthy();
    });
});

describe('ModulePill', () => {
    it('renders module code', () => {
        render(<ModulePill moduleCode="CS3001" />);
        expect(screen.getByText('CS3001')).toBeTruthy();
    });

    it('renders as span by default', () => {
        const { container } = render(<ModulePill moduleCode="CS3001" />);
        expect(container.querySelector('span')).toBeTruthy();
    });

    it('renders as button when asButton and onClick provided', () => {
        const onClick = vi.fn();
        render(<ModulePill moduleCode="CS3001" asButton={true} onClick={onClick} />);
        const btn = screen.getByRole('button');
        expect(btn).toBeTruthy();
        fireEvent.click(btn);
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('truncates code longer than 8 chars', () => {
        render(<ModulePill moduleCode="VERYLONGCODE" />);
        expect(screen.getByText('VERYLONG')).toBeTruthy();
    });

    it('applies custom className', () => {
        const { container } = render(<ModulePill moduleCode="CS3001" className="custom-pill" />);
        expect(container.querySelector('.custom-pill')).toBeTruthy();
    });

    it('returns null when moduleCode is null', () => {
        const { container } = render(<ModulePill moduleCode={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when moduleCode is empty string', () => {
        const { container } = render(<ModulePill moduleCode="" />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when moduleCode is whitespace only', () => {
        const { container } = render(<ModulePill moduleCode="   " />);
        expect(container.firstChild).toBeNull();
    });
});

describe('TypePill', () => {
    it('returns null when no typeLabel', () => {
        const { container } = render(<TypePill typeLabel={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders COURSEWORK label', () => {
        render(<TypePill typeLabel="COURSEWORK" />);
        expect(screen.getByText('COURSEWORK')).toBeTruthy();
    });

    it('renders EXAM label', () => {
        render(<TypePill typeLabel="EXAM" />);
        expect(screen.getByText('EXAM')).toBeTruthy();
    });

    it('uses default colors for unknown type', () => {
        const { container } = render(<TypePill typeLabel="OTHER" />);
        expect(container.firstChild).toBeTruthy();
    });

    it('returns null when typeLabel is empty string', () => {
        const { container } = render(<TypePill typeLabel="" />);
        expect(container.firstChild).toBeNull();
    });
});
