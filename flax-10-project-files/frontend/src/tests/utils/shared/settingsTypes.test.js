import { describe, it, expect } from 'vitest';
import { SETTINGS_SAVED_ROUTES_KEY } from '../../../api/settingsTypes';

describe('settingsTypes', () => {
    it('exports SETTINGS_SAVED_ROUTES_KEY as savedRoutes', () => {
        expect(SETTINGS_SAVED_ROUTES_KEY).toBe('savedRoutes');
    });
});
