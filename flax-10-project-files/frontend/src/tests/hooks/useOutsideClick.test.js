import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOutsideClick } from '../../hooks/useOutsideClick';

function makeRef(el) { return { current: el }; }

let lastUnmount = null;

function setup(open = true) {
  const el = document.createElement('div');
  const menuEl = document.createElement('div');
  const taskMenuEl = document.createElement('div');
  const fabEl = document.createElement('div');
  document.body.appendChild(el);
  document.body.appendChild(menuEl);
  document.body.appendChild(taskMenuEl);
  document.body.appendChild(fabEl);

  const panelRef = makeRef(el);
  const menuRef = makeRef(menuEl);
  const taskMenuRef = makeRef(taskMenuEl);
  const fabRef = makeRef(fabEl);
  const onClose = vi.fn();
  const setMenuOpen = vi.fn();
  const setTaskMenuId = vi.fn();

  const { rerender, unmount } = renderHook(() =>
    useOutsideClick(open, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId)
  );

  lastUnmount = unmount;
  return { el, menuEl, taskMenuEl, fabEl, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId, rerender, unmount };
}

afterEach(() => {
  lastUnmount?.();
  lastUnmount = null;
  document.body.innerHTML = '';
});

describe('useOutsideClick', () => {
  it('does not add listeners when open is false', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    setup(false);
    expect(addSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });

  it('adds and removes listeners when open is true', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = setup(true);
    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('closes menu when clicking outside menuRef', () => {
    const { setMenuOpen } = setup(true);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(setMenuOpen).toHaveBeenCalledWith(false);
  });

  it('does not call setMenuOpen when clicking inside menuRef', () => {
    const { menuEl, setMenuOpen } = setup(true);
    menuEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(setMenuOpen).not.toHaveBeenCalled();
  });

  it('closes taskMenu when clicking outside taskMenuRef and not dots btn', () => {
    const { setTaskMenuId } = setup(true);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(setTaskMenuId).toHaveBeenCalledWith(null);
  });

  it('does NOT close taskMenu when clicking data-task-menu-btn', () => {
    const { setTaskMenuId } = setup(true);
    const btn = document.createElement('button');
    btn.setAttribute('data-task-menu-btn', 'true');
    document.body.appendChild(btn);
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(setTaskMenuId).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking outside all refs', () => {
    const { onClose } = setup(true);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when clicking inside panelRef', () => {
    const { el, onClose } = setup(true);
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles Escape key - closes everything', () => {
    const { onClose, setMenuOpen, setTaskMenuId } = setup(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(setMenuOpen).toHaveBeenCalledWith(false);
    expect(setTaskMenuId).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it('ignores non-Escape key presses', () => {
    const { onClose, setMenuOpen, setTaskMenuId } = setup(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(setMenuOpen).not.toHaveBeenCalled();
    expect(setTaskMenuId).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles null fabRef gracefully', () => {
    const panelRef = makeRef(document.createElement('div'));
    const menuRef = makeRef(document.createElement('div'));
    const taskMenuRef = makeRef(document.createElement('div'));
    const onClose = vi.fn();
    const setMenuOpen = vi.fn();
    const setTaskMenuId = vi.fn();
    const { unmount } = renderHook(() =>
      useOutsideClick(true, panelRef, menuRef, taskMenuRef, { current: null }, onClose, setMenuOpen, setTaskMenuId)
    );
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    expect(() => outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))).not.toThrow();
    unmount();
  });

  it('does not call setTaskMenuId when clicking inside taskMenuRef', () => {
    const { taskMenuEl, setTaskMenuId } = setup(true);
    taskMenuEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(setTaskMenuId).not.toHaveBeenCalled();
  });

  it('does not call onClose when clicking inside fabRef', () => {
    const { fabEl, onClose } = setup(true);
    fabEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });
});