import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../../../components/modules/modules/TravelTimeIndicator.module.css', () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

const getHomeAddressMock = vi.fn();
const getTravelTimeModuleMock = vi.fn();

vi.mock('../../../api/userApi.js', () => ({
  getHomeAddress: (...args) => getHomeAddressMock(...args),
}));
vi.mock('../../../utils/tflTravelTime.js', () => ({
  getTravelTimeModule: (...args) => getTravelTimeModuleMock(...args),
}));

import TravelTimeIndicator from '../../../components/modules/modules/TravelTimeIndicator';
import { useModuleTravelTime } from '../../../components/modules/modules/useModuleTravelTime';

describe('TravelTimeIndicator', () => {
  it('renders travel time when duration is provided', () => {
    render(<TravelTimeIndicator duration={32} />);
    expect(screen.getByText('32 min via TfL')).toBeInTheDocument();
    expect(screen.getByText('Travel time from home')).toBeInTheDocument();
  });

  it('renders nothing when duration is 0 (falsy)', () => {
    const { container } = render(<TravelTimeIndicator duration={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when duration is null', () => {
    const { container } = render(<TravelTimeIndicator duration={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when duration is undefined', () => {
    const { container } = render(<TravelTimeIndicator />);
    expect(container.firstChild).toBeNull();
  });
});

describe('useModuleTravelTime', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches travel time and sets duration on success', async () => {
    getHomeAddressMock.mockResolvedValue('London Bridge');
    getTravelTimeModuleMock.mockResolvedValue({ duration: 18 });

    const { result } = renderHook(() => useModuleTravelTime('Strand Campus'));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(18));

    expect(getHomeAddressMock).toHaveBeenCalledTimes(1);
    expect(getTravelTimeModuleMock).toHaveBeenCalledWith('London Bridge', 'Strand Campus');
  });

  it('sets null when travelInfo has no duration', async () => {
    getHomeAddressMock.mockResolvedValue('Waterloo');
    getTravelTimeModuleMock.mockResolvedValue({});

    const { result } = renderHook(() => useModuleTravelTime('Bush House'));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('sets null when getHomeAddress rejects', async () => {
    getHomeAddressMock.mockRejectedValue(new Error('no home'));

    const { result } = renderHook(() => useModuleTravelTime("Guy's Campus"));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('does not call API when location is falsy', () => {
    renderHook(() => useModuleTravelTime(null));
    renderHook(() => useModuleTravelTime(''));
    renderHook(() => useModuleTravelTime(undefined));
    expect(getHomeAddressMock).not.toHaveBeenCalled();
  });

  it('sets null when getTravelTimeModule rejects', async () => {
    getHomeAddressMock.mockResolvedValue('Home');
    getTravelTimeModuleMock.mockRejectedValue(new Error('tfl down'));

    const { result } = renderHook(() => useModuleTravelTime('Campus'));
    await waitFor(() => expect(result.current).toBeNull());
  });
});
