/**
 * Covers ConfirmContext promise resolution branches.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmProvider, useConfirm } from '../../context/ConfirmContext';

const setBodyResult = (key, value) => document.body.setAttribute(key, String(value));

const openConfirm = (confirm, key, options) => async () => setBodyResult(key, await confirm(options));

function buildConsumerActions(confirm) {
  return [
    { label: 'open-default', onClick: openConfirm(confirm, 'data-result-default', { title: 'Confirm?', message: 'Default path' }) },
    { label: 'open-custom', onClick: openConfirm(confirm, 'data-result-custom', { title: 'Custom?', message: 'Custom path', confirmValue: 'YES', alternateValue: 'MAYBE', cancelValue: 'NO', alternateText: 'Alternate' }) },
    { label: 'open-alt-default', onClick: openConfirm(confirm, 'data-result-alt-default', { title: 'Alternate default?', message: 'Alternate path', alternateText: 'Alternate' }) },
  ];
}

function Consumer() {
  const confirm = useConfirm();
  return buildConsumerActions(confirm).map(({ label, onClick }) => <button key={label} onClick={onClick}>{label}</button>);
}

describe('ConfirmContext', () => {
  it('resolves default confirm/cancel/alternate values', async () => {
    render(
      <ConfirmProvider>
        <Consumer />
      </ConfirmProvider>
    );

    fireEvent.click(screen.getByText('open-default'));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(document.body.getAttribute('data-result-default')).toBe('true'));
    expect(document.body.getAttribute('data-result-default')).toBe('true');

    fireEvent.click(screen.getByText('open-default'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(document.body.getAttribute('data-result-default')).toBe('false'));
    expect(document.body.getAttribute('data-result-default')).toBe('false');
  });

  it('resolves custom confirm/alternate/cancel values', async () => {
    render(
      <ConfirmProvider>
        <Consumer />
      </ConfirmProvider>
    );

    fireEvent.click(screen.getByText('open-custom'));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(document.body.getAttribute('data-result-custom')).toBe('YES'));
    expect(document.body.getAttribute('data-result-custom')).toBe('YES');

    fireEvent.click(screen.getByText('open-custom'));
    fireEvent.click(screen.getByRole('button', { name: /alternate/i }));
    await waitFor(() => expect(document.body.getAttribute('data-result-custom')).toBe('MAYBE'));
    expect(document.body.getAttribute('data-result-custom')).toBe('MAYBE');

    fireEvent.click(screen.getByText('open-custom'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(document.body.getAttribute('data-result-custom')).toBe('NO'));
    expect(document.body.getAttribute('data-result-custom')).toBe('NO');
  });

  it('uses the default alternate value when none is provided', async () => {
    render(
      <ConfirmProvider>
        <Consumer />
      </ConfirmProvider>
    );

    fireEvent.click(screen.getByText('open-alt-default'));
    fireEvent.click(screen.getByRole('button', { name: /alternate/i }));
    await waitFor(() => expect(document.body.getAttribute('data-result-alt-default')).toBe('ALTERNATE'));
  });
});
