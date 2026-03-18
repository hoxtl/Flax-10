import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddImageView, ImageCard, ImageGrid, ImageHeader } from '../../../components/Society/SocietyDetail/imageHandlers/ImageManagerComponents';

describe('ImageManagerComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and image card actions', () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const onPin = vi.fn();

    render(
      <>
        <ImageHeader title="Manage Images" onClose={onClose} />
        <ImageCard src="/img.jpg" index={1} onDelete={onDelete} onPin={onPin} />
      </>,
    );

    expect(screen.getByText('Manage Images')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: '×' })[0]);
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '★' }));
    fireEvent.click(screen.getAllByRole('button', { name: '×' })[1]);

    expect(onPin).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it('renders grid and handles add button in normal/full states', () => {
    const onDelete = vi.fn();
    const onPin = vi.fn();
    const onAddClick = vi.fn();
    const { rerender } = render(
      <ImageGrid images={['a.jpg']} onDelete={onDelete} onPin={onPin} onAddClick={onAddClick} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onAddClick).toHaveBeenCalled();

    rerender(
      <ImageGrid
        images={['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg']}
        onDelete={onDelete}
        onPin={onPin}
        onAddClick={onAddClick}
      />,
    );

    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
  });

  it('supports upload flow in AddImageView', async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();

    class MockFileReader {
      readAsDataURL(file) {
        this.onload({ target: { result: `data:${file.name}` } });
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    const { container } = render(<AddImageView onClose={onClose} onAdd={onAdd} availablePhotos={[]} />);

    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'upload.png', { type: 'image/png' })] } });

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('data:upload.png'));

    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it('supports selecting from photos and footer actions', async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();

    const { container } = render(<AddImageView onClose={onClose} onAdd={onAdd} availablePhotos={['a.jpg', 'b.jpg']} />);

    fireEvent.click(screen.getByText('From Photos'));
    const photoCards = Array.from(container.querySelectorAll('div')).filter((node) => node.style.backgroundImage.includes('b.jpg'));
    fireEvent.click(photoCards[0]);
    fireEvent.click(screen.getByText('Add Selected'));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('b.jpg'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('ImageCard index 0 shows Main badge and no pin button', () => {
    render(<ImageCard src="/img.jpg" index={0} onDelete={vi.fn()} onPin={vi.fn()} />);
    expect(screen.getByText('★ Main')).toBeTruthy();
    expect(screen.queryByTitle('Set as main')).toBeNull();
  });

  it('AddImageView without photos does not show tab selector', () => {
    render(<AddImageView onClose={vi.fn()} onAdd={vi.fn()} availablePhotos={[]} />);
    expect(screen.queryByText('From Photos')).toBeNull();
    expect(screen.queryByText('Upload')).toBeNull();
  });

  it('performUpload handles empty file gracefully', async () => {
    const onAdd = vi.fn();
    const { container } = render(<AddImageView onClose={vi.fn()} onAdd={onAdd} availablePhotos={[]} />);
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('TabSelector shows both tabs with correct active states', () => {
    const { container } = render(<AddImageView onClose={vi.fn()} onAdd={vi.fn()} availablePhotos={['a.jpg']} />);
    const uploadBtn = screen.getByText('Upload');
    expect(uploadBtn).toBeTruthy();
    fireEvent.click(screen.getByText('From Photos'));
    fireEvent.click(screen.getByText('Upload'));
    expect(screen.getByText('Click to upload image')).toBeTruthy();
  });
});
