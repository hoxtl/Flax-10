import { describe, it, expect } from 'vitest';
import { SETTINGS_SAVED_ROUTES_KEY } from '../../api/user/settingsTypes';

describe('settingsTypes', () => {
  it('exports SETTINGS_SAVED_ROUTES_KEY', () => {
    expect(SETTINGS_SAVED_ROUTES_KEY).toBe('savedRoutes');
  });
});
