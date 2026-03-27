import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusOverlayContent } from '../../../components/timer/components/WrapperComponents';

const timerCircleSpy = vi.fn();

vi.mock('../../../components/timer/components/TimerCircle', () => ({
  default: (props) => {
    timerCircleSpy(props);
    return <div data-testid="timer-circle" />;
  },
}));

vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
  default: (props) => {
    const safeProps = { ...props };
    delete safeProps.pill;
    delete safeProps.variant;
    delete safeProps.size;
    return <button {...safeProps}>{props.children}</button>;
  },
}));

vi.mock('../../../pages/timer/TimerPage.module.css', () => ({
  default: {
    focusOverlayFrame: 'focusOverlayFrame',
    focusOverlayExitBtn: 'focusOverlayExitBtn',
    focusOverlayMainCard: 'focusOverlayMainCard',
  },
}));

describe('FocusOverlayContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timerCircleSpy.mockReset();
  });

  it('keeps only the shared exit button and hides timer controls', () => {
    const onExitFocus = vi.fn();
    const t = { timeLeft: 1500 };

    render(<FocusOverlayContent t={t} onExitFocus={onExitFocus} />);

    expect(screen.getByRole('button', { name: 'Exit Focus' })).toBeInTheDocument();
    expect(screen.getByTestId('timer-circle')).toBeInTheDocument();
    expect(timerCircleSpy.mock.calls.at(-1)[0]).toMatchObject({
      t,
      showAnimationPicker: false,
      showControls: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Exit Focus' }));
    expect(onExitFocus).toHaveBeenCalledTimes(1);
  });
});
