import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CoverImageModal from '../../../components/Society/SocietyDetail/imageHandlers/CoverImageModal';

vi.mock('../../../components/Society/SocietyDetail/imageHandlers/ImageManagerComponents.module.css', () => ({
  default: {
    backdrop: 'backdrop', modal: 'modal', header: 'header', title: 'title', close: 'close', hint: 'hint',
    grid: 'grid', addCard: 'addCard', addIcon: 'addIcon', imageCard: 'imageCard', pinned: 'pinned',
    pinnedBadge: 'pinnedBadge', pinBtn: 'pinBtn', deleteBtn: 'deleteBtn', tabs: 'tabs', tab: 'tab',
    activeTab: 'activeTab', dropZone: 'dropZone', photoSelectGrid: 'photoSelectGrid',
    photoSelectCard: 'photoSelectCard', selected: 'selected', actions: 'actions', cancelBtn: 'cancelBtn', confirmBtn: 'confirmBtn',
  },
}));

const baseImages = ['a.jpg', 'b.jpg'];
const renderModal = (props = {}) => render(
  <CoverImageModal images={baseImages} availablePhotos={[]} onClose={vi.fn()} onUpdate={vi.fn()} {...props} />
);

describe('CoverImageModal', () => {
  const originalAlert = window.alert;
  beforeEach(() => { vi.restoreAllMocks(); window.alert = vi.fn(); });
  afterEach(() => { window.alert = originalAlert; });

  it('renders header and hint', () => {
    renderModal();
    expect(screen.getByText('Manage Cover Images')).toBeInTheDocument();
    expect(screen.getByText(/First image is shown on society card/i)).toBeInTheDocument();
  });

  it('does not close when clicking inside modal', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.mouseDown(screen.getByText('Manage Cover Images'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on backdrop mousedown', () => {
    const onClose = vi.fn();
    const { container } = renderModal({ onClose });
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it('pins image via ImageGrid handler', () => {
    const onUpdate = vi.fn();
    const { container } = renderModal({ onUpdate });
    const pinButtons = container.querySelectorAll('button[title="Set as main"]');
    expect(pinButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(pinButtons[0]);
    expect(onUpdate).toHaveBeenCalledWith(['b.jpg', 'a.jpg']);
  });

  it('deletes image via ImageGrid handler', () => {
    const onUpdate = vi.fn();
    const { container } = renderModal({ onUpdate });
    const deleteBtn = findDeleteButton(container);
    if (deleteBtn) fireEvent.click(deleteBtn);
    expect(onUpdate).toHaveBeenCalledWith(['b.jpg']);
  });

  it('disables add button when grid is full', () => {
    const manyImages = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'];
    const { container } = renderModal({ images: manyImages, availablePhotos: ['x.jpg'] });
    const fullAddBtn = container.querySelector('button[title="Maximum 5 images reached"]');
    expect(fullAddBtn).toBeDisabled();
  });

  it('adds image from photos tab', () => {
    const onUpdate = vi.fn();
    const { container } = renderModal({ images: ['1.jpg', '2.jpg'], availablePhotos: ['x.jpg'], onUpdate });
    fireEvent.click(container.querySelector('button[title="Add image"]'));
    fireEvent.click(screen.getByText('From Photos'));
    fireEvent.click(container.querySelector('.photoSelectCard'));
    fireEvent.click(screen.getByText('Add Selected'));
    expect(onUpdate).toHaveBeenCalledWith(['1.jpg', '2.jpg', 'x.jpg']);
  });
});

function findDeleteButton(container) {
  const buttons = container.querySelectorAll('button');
  return Array.from(buttons).find(btn => btn.textContent === '×' && btn !== buttons[0]);
}
