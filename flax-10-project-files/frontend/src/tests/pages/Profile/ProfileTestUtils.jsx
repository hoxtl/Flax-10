import React from 'react';
import { vi } from 'vitest';

export const mockFramerMotion = () => {
  vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_, tag) =>
          ({ children, ...props }) => {
            const rest = { ...props };
            ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'whileInView', 'variants', 'custom', 'layout'].forEach(
              (k) => delete rest[k],
            );
            return React.createElement(typeof tag === 'string' ? tag : 'div', rest, children);
          },
      },
    ),
  }));
};

export const mockProfileHelpers = () => {
  vi.mock('../../../pages/profile/utils/profileHelpers', () => ({
    buildInitials: vi.fn((user) => {
      if (user?.first_name && user?.last_name) return `${user.first_name[0]}${user.last_name[0]}`;
      return '??';
    }),
    buildFullName: vi.fn((user) => {
      if (!user) return 'Guest';
      return user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest';
    }),
  }));
};

export const mockSocialComponents = () => {
  vi.mock('../../../components/social/ShareButton', () => ({
    default: ({ userId, onToggle, initialIsSharing }) => (
      <button data-testid="share-btn" onClick={() => onToggle?.(!initialIsSharing)}>
        Share {userId}
      </button>
    ),
  }));

  vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
    default: ({ children, onClick, ...rest }) => (
      <button onClick={onClick} {...rest}>
        {children}
      </button>
    ),
  }));
};

export const mockTutorPhotoFallback = () => {
  vi.mock('../../../utils/tutorPhotoFallback', () => ({
    getResolvedUserPhoto: (user) => {
      if (user?.profile_photo_url) return user.profile_photo_url;
      return '';
    },
  }));
};

export const baseHandlers = {
  onEditProfile: vi.fn(),
  onModulesClick: vi.fn(),
  onSharedWithClick: vi.fn(),
  onSharedByClick: vi.fn(),
  reload: vi.fn(),
  setOptimisticShare: vi.fn(),
};

export const editableVisibility = {
  canViewModules: true,
  canViewSharedWith: true,
  canEditProfile: true,
};

export const viewerVisibility = {
  canViewModules: false,
  canViewSharedWith: false,
  canEditProfile: false,
};
