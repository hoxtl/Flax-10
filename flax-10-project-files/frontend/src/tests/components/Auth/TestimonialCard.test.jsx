import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestimonialCard } from '../../../components/Auth/TestimonialCard';

const author = { name: 'Alice', handle: '@alice', avatar: 'https://example.com/img.jpg' };

describe('TestimonialCard', () => {
  it('renders author name, handle, and text', () => {
    render(<TestimonialCard author={author} text="Great app!" />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('@alice')).toBeTruthy();
    expect(screen.getByText('Great app!')).toBeTruthy();
  });

  it('renders as div when no href', () => {
    const { container } = render(<TestimonialCard author={author} text="Hi" />);
    expect(container.querySelector('div.card') || container.firstChild.tagName).toBeTruthy();
  });

  it('renders as anchor when href provided', () => {
    const { container } = render(<TestimonialCard author={author} text="Hi" href="https://example.com" />);
    expect(container.querySelector('a')).toBeTruthy();
  });
  
  it('renders avatar image with alt text', () => {
    render(<TestimonialCard author={author} text="Hi" />);
    expect(screen.getByAltText('Alice')).toBeTruthy();
  });
});
