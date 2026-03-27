import { vi } from 'vitest';
import * as societyApiMocks from '../api/mocks/societyApi';

// Convert module object to plain object
const mocks = { ...societyApiMocks };

export { mocks as mockSocietyApi };

export const setupSocietyMocks = () => {
    vi.mock('../../api/societyApi', () => mocks);
    vi.mock('../../context/TagContext', () => ({
        useTags: vi.fn(() => ({ refreshTags: vi.fn() }))
    }));
    vi.mock('../../context/ConfirmContext', () => ({
        useConfirm: vi.fn(() => vi.fn(() => Promise.resolve(true)))
    }));
};
