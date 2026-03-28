<<<<<<< HEAD
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomepageSkeleton } from '@/pages/homepage/components/HomepageSkeleton';

// Mocks
vi.mock('@/components/common/loading_state/SkeletonBlock', () => ({
  default: ({ className }) => <div data-testid="skeleton-block" className={className} />
}));

vi.mock('@/pages/homepage/Homepage.module.css', () => ({
  default: {}
}));

describe('HomepageSkeleton', () => {
  it('renders with busy state and multiple skeleton blocks', () => {
    const { container } = render(<HomepageSkeleton />);
    const root = container.querySelector('[aria-busy="true"]');
    expect(root).toBeTruthy();
    
    const blocks = screen.getAllByTestId('skeleton-block');
    expect(blocks.length).toBeGreaterThan(10);
=======
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../../components/common/loading_state/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton-block" className={className} />,
}));

import { HomepageSkeleton } from "../../../../pages/homepage/components/HomepageSkeleton";

describe("HomepageSkeleton", () => {
  it("renders the homepage loading layout with timeline rows", () => {
    render(<HomepageSkeleton />);

    expect(screen.getByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-block")).toHaveLength(16);
>>>>>>> main
  });
});
