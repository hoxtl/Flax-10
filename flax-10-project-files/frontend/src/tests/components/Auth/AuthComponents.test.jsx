import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as C from '../../../components/Auth/AuthComponents';

describe('AuthComponents styled components', () => {
  it('renders Container', () => {
    const { container } = render(<C.Container />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SignUpContainer signIn=true', () => {
    const { container } = render(<C.SignUpContainer $signIn={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SignUpContainer signIn=false', () => {
    const { container } = render(<C.SignUpContainer $signIn={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SignInContainer signIn=true', () => {
    const { container } = render(<C.SignInContainer $signIn={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SignInContainer signIn=false', () => {
    const { container } = render(<C.SignInContainer $signIn={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders Form', () => {
    const { container } = render(<C.Form />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders Title', () => {
    render(<C.Title>Hello</C.Title>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders Input', () => {
    const { container } = render(<C.Input />);
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('renders Button', () => {
    render(<C.Button>Click</C.Button>);
    expect(screen.getByText('Click')).toBeTruthy();
  });

  it('renders GhostButton', () => {
    render(<C.GhostButton>Ghost</C.GhostButton>);
    expect(screen.getByText('Ghost')).toBeTruthy();
  });

  it('renders Anchor', () => {
    render(<C.Anchor href="#">Link</C.Anchor>);
    expect(screen.getByText('Link')).toBeTruthy();
  });

  it('renders OverlayContainer signIn=true', () => {
    const { container } = render(<C.OverlayContainer $signIn={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders OverlayContainer signIn=false', () => {
    const { container } = render(<C.OverlayContainer $signIn={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders Overlay signIn=true', () => {
    const { container } = render(<C.Overlay $signIn={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders Overlay signIn=false', () => {
    const { container } = render(<C.Overlay $signIn={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders OverlayPanel', () => {
    const { container } = render(<C.OverlayPanel />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders LeftOverlayPanel', () => {
    const { container } = render(<C.LeftOverlayPanel />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders RightOverlayPanel signIn=true', () => {
    const { container } = render(<C.RightOverlayPanel $signIn={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders RightOverlayPanel signIn=false', () => {
    const { container } = render(<C.RightOverlayPanel $signIn={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders Paragraph', () => {
    render(<C.Paragraph>Text</C.Paragraph>);
    expect(screen.getByText('Text')).toBeTruthy();
  });

  it('renders PasswordResetLink', () => {
    render(
      <MemoryRouter>
        <C.PasswordResetLink to="/reset">Reset</C.PasswordResetLink>
      </MemoryRouter>
    );
    expect(screen.getByText('Reset')).toBeTruthy();
  });
});
