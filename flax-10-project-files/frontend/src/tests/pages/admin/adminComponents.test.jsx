/*
 * Tests for shared admin UI components: AdminFilters, AdminList, AdminSurface, and HoldConfirmModal.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FilterToggleGroup } from '../../../pages/admin/components/AdminFilters';
import { AnimatedList, ListRow, ListInfo, ListActions } from '../../../pages/admin/components/AdminList';
import { SectionCard, CardHeader, LoadingSpinner, EmptyMessage, ErrorMessage } from '../../../pages/admin/components/AdminSurface';
import HoldConfirmModal from '../../../components/common/hold_confirm_modal/HoldConfirmModal';

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/admin/adminComponents.test.jsx
vi.mock('../../../pages/admin/styles/styles', () => ({
=======
vi.mock('../../../pages/admin/styles', () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Admin/adminComponents.test.jsx
  default: {
    filterGroup: 'filterGroup', filterButtons: 'filterButtons', filterPillButton: 'filterPillButton',
    filterPillBadge: 'filterPillBadge', filterPillBadgeActive: 'filterPillBadgeActive',
    list: 'list', listRow: 'listRow', listInfo: 'listInfo', listName: 'listName',
    listMeta: 'listMeta', listActions: 'listActions',
    card: 'card', cardHeader: 'cardHeader', cardTitle: 'cardTitle', count: 'count',
    spinnerWrap: 'spinnerWrap', spinner: 'spinner', empty: 'empty', errorMsg: 'errorMsg',
  },
}));

vi.mock('../../../pages/admin/utils/adminMotion', () => ({
  stagger: { animate: { transition: { staggerChildren: 0.055 } } },
  rowAnim: { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 } },
  fadeUp: { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }) => <div {...rest}>{children}</div>,
    p: ({ children, ...rest }) => <p {...rest}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/common/badge/Badge', () => ({
  default: ({ children, tone, className }) => <span className={className} data-tone={tone}>{children}</span>,
}));

vi.mock('../../../components/common/standard_modal/StandardModal', () => ({
  default: ({ children, title, onClose }) => (
    <div role="dialog" aria-label={title}>
      <button onClick={onClose}>close</button>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('../../../components/common/hold_confirm_modal/HoldConfirmModal.module.css', () => ({
  default: {
    modal: 'modal', body: 'body', buttons: 'buttons',
    holdBtn: 'holdBtn', holdBtnBar: 'holdBtnBar', holdBtnLabel: 'holdBtnLabel',
    warningBanner: 'warningBanner', warningBannerIcon: 'warningBannerIcon',
    warningBannerText: 'warningBannerText', warning: 'warning',
  },
}));

describe('FilterToggleGroup', () => {
  it('renders a button for each option', () => {
    const options = [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }];
    render(<FilterToggleGroup options={options} selected={[]} onToggle={vi.fn()} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('calls onToggle with the selected value when a button is clicked', () => {
    const onToggle = vi.fn();
    const options = [{ value: 'x', label: 'X' }];
    render(<FilterToggleGroup options={options} selected={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('X'));
    expect(onToggle).toHaveBeenCalledWith('x');
  });
});

describe('AdminList – AnimatedList', () => {
  it('renders each item returned by renderItem', () => {
    const items = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    render(<AnimatedList items={items} renderItem={(item) => <div key={item.id}>{item.name}</div>} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('AdminList – ListRow', () => {
  it('renders children inside the row', () => {
    render(<ListRow><span>Row content</span></ListRow>);
    expect(screen.getByText('Row content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ListRow onClick={onClick}><span>Click me</span></ListRow>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('AdminList – ListInfo', () => {
  it('renders name and meta', () => {
    render(<ListInfo name="Alice" meta="Student" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('renders extraMeta when provided', () => {
    render(<ListInfo name="Bob" meta="Teacher" extraMeta="Staff" />);
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('does not render extraMeta when absent', () => {
    const { container } = render(<ListInfo name="Bob" meta="Teacher" />);
    expect(container.querySelectorAll('.listMeta')).toHaveLength(1);
  });
});

describe('AdminList – ListActions', () => {
  it('renders its children', () => {
    render(<ListActions><button>Delete</button></ListActions>);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});

describe('AdminSurface – SectionCard', () => {
  it('renders children', () => {
    render(<SectionCard><p>Card content</p></SectionCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});

describe('AdminSurface – CardHeader', () => {
  it('renders the title', () => {
    render(<CardHeader title="Users" />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders count in parentheses when provided', () => {
    render(<CardHeader title="Users" count={5} />);
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('does not render count when undefined', () => {
    render(<CardHeader title="Users" />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('renders children inside the header', () => {
    render(<CardHeader title="Users"><button>Search</button></CardHeader>);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});

describe('AdminSurface – LoadingSpinner', () => {
  it('renders the spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.spinnerWrap')).toBeInTheDocument();
  });
});

describe('AdminSurface – EmptyMessage', () => {
  it('renders the message text', () => {
    render(<EmptyMessage>No users found</EmptyMessage>);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });
});

describe('AdminSurface – ErrorMessage', () => {
  it('renders the error message when message is provided', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders nothing when message is falsy', () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('HoldConfirmModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the modal title', () => {
    render(<HoldConfirmModal title="Delete Item" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Delete Item' })).toBeInTheDocument();
  });

  it('shows the warningBanner when provided', () => {
    render(<HoldConfirmModal title="Delete" warningBanner="This is irreversible!" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('This is irreversible!')).toBeInTheDocument();
  });

  it('shows the warningText when provided', () => {
    render(<HoldConfirmModal title="Delete" warningText="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<HoldConfirmModal title="Delete" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Keep It'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows the default hold label on the hold button', () => {
    render(<HoldConfirmModal title="Delete" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Hold to Delete')).toBeInTheDocument();
  });

  it('shows custom holdLabel when provided', () => {
    render(<HoldConfirmModal title="Delete" holdLabel="Hold to Confirm" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Hold to Confirm')).toBeInTheDocument();
  });

  it('calls onConfirm after holding for the hold duration', () => {
    const onConfirm = vi.fn();
    render(<HoldConfirmModal title="Delete" holdDuration={500} onConfirm={onConfirm} onCancel={vi.fn()} />);
    const holdButton = screen.getByText('Hold to Delete').closest('button');
    act(() => { fireEvent.mouseDown(holdButton); });
    act(() => { vi.advanceTimersByTime(600); });
    expect(onConfirm).toHaveBeenCalled();
  });

  it('stops the hold timer when mouse leaves the hold button', () => {
    const onConfirm = vi.fn();
    render(<HoldConfirmModal title="Delete" holdDuration={2000} onConfirm={onConfirm} onCancel={vi.fn()} />);
    const holdButton = screen.getByText('Hold to Delete').closest('button');
    act(() => { fireEvent.mouseDown(holdButton); });
    act(() => { vi.advanceTimersByTime(500); });
    act(() => { fireEvent.mouseLeave(holdButton); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
