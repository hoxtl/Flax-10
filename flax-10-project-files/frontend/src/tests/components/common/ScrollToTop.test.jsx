import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ScrollToTop from '../../../components/common/scroll_to_top';

function TestWrapper({ pathname = '/' }) {
    return (
        <MemoryRouter initialEntries={[pathname]}>
            <ScrollToTop />
        </MemoryRouter>
    );
}

describe('ScrollToTop', () => {
    const scrollToMock = vi.fn();
    let mainContent;

    beforeEach(() => {
        window.scrollTo = scrollToMock;
        mainContent = document.createElement('div');
        mainContent.className = 'mainContent';
        mainContent.scrollTop = 100;
        document.body.appendChild(mainContent);
    });

    afterEach(() => {
        if (mainContent && mainContent.parentNode) document.body.removeChild(mainContent);
        vi.clearAllMocks();
    });

    it('scrolls window and mainContent when pathname is not calendar', () => {
        render(<TestWrapper pathname="/" />);
        expect(scrollToMock).toHaveBeenCalledWith(0, 0);
        expect(mainContent.scrollTop).toBe(0);
    });

    it('does not scroll when pathname starts with /calendar', () => {
        render(<TestWrapper pathname="/calendar" />);
        expect(scrollToMock).not.toHaveBeenCalled();
    });

    it('uses .main when .mainContent not found', () => {
        if (mainContent.parentNode) document.body.removeChild(mainContent);
        const main = document.createElement('div');
        main.className = 'main';
        main.scrollTop = 50;
        document.body.appendChild(main);
        render(<TestWrapper pathname="/home" />);
        expect(main.scrollTop).toBe(0);
        document.body.removeChild(main);
        document.body.appendChild(mainContent);
    });

    it('resets scrollable parent when findScrollableParent finds one', () => {
        const scrollable = document.createElement('div');
        scrollable.scrollTop = 200;
        Object.defineProperty(scrollable, 'scrollHeight', { value: 500, configurable: true });
        Object.defineProperty(scrollable, 'clientHeight', { value: 300, configurable: true });
        document.body.appendChild(scrollable);
        const getComputedStyleOriginal = window.getComputedStyle;
        window.getComputedStyle = vi.fn((el) => {
            const base = getComputedStyleOriginal.call(window, document.body);
            if (el === scrollable) {
                return { ...base, overflow: 'scroll', overflowY: 'scroll' };
            }
            return getComputedStyleOriginal.call(window, el);
        });
        render(<TestWrapper pathname="/other" />);
        expect(scrollable.scrollTop).toBe(0);
        window.getComputedStyle = getComputedStyleOriginal;
        document.body.removeChild(scrollable);
    });
});
