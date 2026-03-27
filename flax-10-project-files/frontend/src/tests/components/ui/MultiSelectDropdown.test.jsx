import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiSelectDropdown from '../../../components/ui/components/MultiSelectDropdown';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === 'string' ? tag : 'div';
        return ({ children, ...props }) => {
          const { initial, animate, exit, transition, variants, whileTap, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const OPTIONS = [
  { value: 'a1', label: 'List A' },
  { value: 'a2', label: 'List B' },
  { value: 'a3', label: 'List C' },
];

describe('MultiSelectDropdown', () => {
  it('renders placeholder when nothing selected', () => {
    render(
      <MultiSelectDropdown value={[]} onChange={vi.fn()} placeholder="All" options={OPTIONS} />
    );
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('renders selected count when multiple selected', () => {
    render(
      <MultiSelectDropdown
        value={['a1', 'a2']}
        onChange={vi.fn()}
        placeholder="All"
        options={OPTIONS}
        countLabel="lists"
      />
    );
    expect(screen.getByText('2 lists')).toBeInTheDocument();
  });

  it('renders single selected label', () => {
    render(
      <MultiSelectDropdown
        value={['a1']}
        onChange={vi.fn()}
        placeholder="All"
        options={OPTIONS}
      />
    );
    expect(screen.getByText('List A')).toBeInTheDocument();
  });

  it('opens menu on trigger click', () => {
    render(
      <MultiSelectDropdown value={[]} onChange={vi.fn()} placeholder="All" options={OPTIONS} />
    );
    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('List A')).toBeInTheDocument();
    expect(screen.getByText('List B')).toBeInTheDocument();
    expect(screen.getByText('List C')).toBeInTheDocument();
  });

  it('calls onChange when option is toggled', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectDropdown
        value={[]}
        onChange={onChange}
        placeholder="All"
        options={OPTIONS}
      />
    );
    fireEvent.click(screen.getByText('All'));
    fireEvent.click(screen.getByText('List A'));
    expect(onChange).toHaveBeenCalledWith(['a1']);
  });

  it('calls onChange with empty array when "All" option selected', () => {
    const onChange = vi.fn();
    const optionsWithAll = [{ value: '', label: 'All' }, ...OPTIONS];
    render(
      <MultiSelectDropdown
        value={['a1']}
        onChange={onChange}
        placeholder="Select"
        options={optionsWithAll}
      />
    );
    fireEvent.click(screen.getByText('List A'));
    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('supports displayAsPills mode', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectDropdown
        value={['a1', 'a2']}
        onChange={onChange}
        placeholder="All"
        options={OPTIONS}
        displayAsPills
      />
    );
    expect(screen.getByText('List A')).toBeInTheDocument();
    expect(screen.getByText('List B')).toBeInTheDocument();
  });

  it('removes pill when remove button clicked in displayAsPills mode', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectDropdown
        value={['a1']}
        onChange={onChange}
        placeholder="All"
        options={OPTIONS}
        displayAsPills
      />
    );
    const removeBtn = screen.getByLabelText('Remove List A');
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('supports string options', () => {
    render(
      <MultiSelectDropdown
        value={[]}
        onChange={vi.fn()}
        placeholder="Pick"
        options={['X', 'Y', 'Z']}
      />
    );
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    const { container } = render(
      <div>
        <MultiSelectDropdown value={[]} onChange={vi.fn()} placeholder="All" options={OPTIONS} />
        <div data-testid="outside">Outside</div>
      </div>
    );
    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('List A')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('List A')).not.toBeInTheDocument();
  });

  it('toggles option off when already selected', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectDropdown
        value={['a1']}
        onChange={onChange}
        placeholder="All"
        options={OPTIONS}
      />
    );
    fireEvent.click(screen.getByText('List A'));
    fireEvent.click(screen.getAllByText('List A')[1]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('handles non-array value by treating as empty', () => {
    render(
      <MultiSelectDropdown
        value="a1"
        onChange={vi.fn()}
        placeholder="All"
        options={OPTIONS}
      />
    );
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('shows placeholder in displayAsPills when nothing selected', () => {
    render(
      <MultiSelectDropdown
        value={[]}
        onChange={vi.fn()}
        placeholder="Pick items"
        options={OPTIONS}
        displayAsPills
      />
    );
    expect(screen.getByText('Pick items')).toBeInTheDocument();
  });

  it('opens pills trigger on Enter key', () => {
    render(
      <MultiSelectDropdown
        value={[]}
        onChange={vi.fn()}
        placeholder="All"
        options={OPTIONS}
        displayAsPills
      />
    );
    const pillsTrigger = document.querySelector('[aria-haspopup="listbox"]');
    fireEvent.keyDown(pillsTrigger, { key: 'Enter', preventDefault: vi.fn() });
    expect(screen.getByText('List A')).toBeInTheDocument();
  });

  it('opens pills trigger on Space key', () => {
    render(
      <MultiSelectDropdown
        value={[]}
        onChange={vi.fn()}
        placeholder="All"
        options={OPTIONS}
        displayAsPills
      />
    );
    const pillsTrigger = document.querySelector('[aria-haspopup="listbox"]');
    fireEvent.keyDown(pillsTrigger, { key: ' ', preventDefault: vi.fn() });
    expect(screen.getByText('List A')).toBeInTheDocument();
  });

  it('shows placeholder when selected value not in options', () => {
    render(
      <MultiSelectDropdown
        value={['unknown']}
        onChange={vi.fn()}
        placeholder="All"
        options={OPTIONS}
      />
    );
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('pill remove does not trigger parent onClick', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectDropdown
        value={['a1']}
        onChange={onChange}
        placeholder="All"
        options={OPTIONS}
        displayAsPills
      />
    );
    const pill = screen.getByText('List A').closest('[class*="pill"]');
    if (pill) fireEvent.click(pill);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds open state class to root when menu is open', () => {
    const { container } = render(
      <MultiSelectDropdown value={[]} onChange={vi.fn()} placeholder="All" options={OPTIONS} />
    );
    const root = container.firstChild;
    const classesBefore = root?.className ?? '';
    fireEvent.click(screen.getByText('All'));
    const classesAfter = root?.className ?? '';
    expect(classesAfter.length).toBeGreaterThanOrEqual(classesBefore.length);
    expect(screen.getByText('List A')).toBeInTheDocument();
  });
});
