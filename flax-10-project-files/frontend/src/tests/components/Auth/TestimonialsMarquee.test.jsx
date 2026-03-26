import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestimonialsMarquee } from '../../../components/auth/TestimonialsMarquee';

vi.mock('../../../components/auth/TestimonialCard', () => ({
  TestimonialCard: ({ author, text }) => <div data-testid="card">{author.name}: {text}</div>,
}));

describe('TestimonialsMarquee', () => {
  it('renders a section', () => {
    const { container } = render(<TestimonialsMarquee />);
    expect(container.querySelector('section')).toBeTruthy();
  });
  
  it('renders multiple testimonial cards (3x repeated)', () => {
    render(<TestimonialsMarquee />);
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBe(8 * 3); // 8 testimonials × 3
  });
});