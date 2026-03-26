import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CoverImageModal from '../../../components/Society/society_detail/image_handlers/CoverImageModal';

vi.mock('../../../components/Society/society_detail/image_handlers/ImageManagerComponents.module.css', () => ({
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
    renderModal({ onClose });
    const backdrop = document.body.querySelector('div[class*="_backdrop"]');
    expect(backdrop).toBeTruthy();
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('pins image via ImageGrid handler', () => {
    const onUpdate = vi.fn();
    renderModal({ onUpdate });
    const pinButtons = document.body.querySelectorAll('button[title="Set as main"]');
    expect(pinButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(pinButtons[0]);
    expect(onUpdate).toHaveBeenCalledWith(['b.jpg', 'a.jpg']);
  });

  it('deletes image via ImageGrid handler', () => {
    const onUpdate = vi.fn();
    renderModal({ onUpdate });
    const deleteBtn = findDeleteButton(document.body);
    if (deleteBtn) fireEvent.click(deleteBtn);
    expect(onUpdate).toHaveBeenCalledWith(['b.jpg']);
  });

  it('disables add button when grid is full', () => {
    const manyImages = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'];
    renderModal({ images: manyImages, availablePhotos: ['x.jpg'] });
    const fullAddBtn = document.body.querySelector('button[title="Maximum 5 images reached"]');
    expect(fullAddBtn).toBeDisabled();
  });

  it('adds image via file upload', async () => {
    class MockFileReader {
      readAsDataURL(file) {
        this.onload({ target: { result: `data:${file.name}` } });
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    const onUpdate = vi.fn();
    renderModal({ images: ['1.jpg', '2.jpg'], onUpdate });
    const addBtn = document.body.querySelector('button[title="Add image"]');
    expect(addBtn).toBeTruthy();
    const fileInput = document.body.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'x.png', { type: 'image/png' })] } });
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(['1.jpg', '2.jpg', 'data:x.png']));
  });
});

function findDeleteButton(root) {
  const buttons = root.querySelectorAll('button');
  return Array.from(buttons).find(btn => btn.textContent === '×' && btn !== buttons[0]);
}
