import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmProvider, useConfirm } from '../../context/ConfirmContext';

function Consumer() {
  const confirm = useConfirm();

  const openDefault = async () => {
    const value = await confirm({ title: 'Confirm?', message: 'Default path' });
    document.body.setAttribute('data-result-default', String(value));
  };

  const openCustom = async () => {
    const value = await confirm({
      title: 'Custom?',
      message: 'Custom path',
      confirmValue: 'YES',
      alternateValue: 'MAYBE',
      cancelValue: 'NO',
      alternateText: 'Alternate',
    });
    document.body.setAttribute('data-result-custom', String(value));
  };

  const openAlternateDefault = async () => {
    const value = await confirm({
      title: 'Alternate default?',
      message: 'Alternate path',
      alternateText: 'Alternate',
    });
    document.body.setAttribute('data-result-alt-default', String(value));
  };

  return (
    <>
      <button onClick={openDefault}>open-default</button>
      <button onClick={openCustom}>open-custom</button>
      <button onClick={openAlternateDefault}>open-alt-default</button>
    </>
  );
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
