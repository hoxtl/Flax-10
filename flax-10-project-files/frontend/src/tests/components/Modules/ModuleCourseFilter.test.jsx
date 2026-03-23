/*
 * Tests for ModuleCourseFilter component.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ModuleCourseFilter from '../../../components/Modules/Modules/ModuleCourseFilter';

describe('ModuleCourseFilter', () => {
  it('opens on hover and closes when the pointer leaves', async () => {
    render(<ModuleCourseFilter selectedCourses={[]} onToggleCourse={() => {}} />);

    const button = screen.getByRole('button', { name: /filter/i });
    const wrapper = button.parentElement;

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByPlaceholderText(/search courses or departments/i)).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search courses or departments/i)).not.toBeInTheDocument();
    });
  });
});
