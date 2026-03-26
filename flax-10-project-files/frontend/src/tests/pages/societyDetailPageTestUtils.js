/**
 * Shared state builders for SocietyDetailPage tests.
 */

import { vi } from "vitest";

import { createFnMap } from "../utils/testBuilderUtils";

const actionNames = [
  "updateSociety",
  "updateLocalSociety",
  "fetchMembers",
  "removeMember",
  "updateAnnouncement",
  "addAnnouncement",
  "deleteAnnouncement",
  "addCollaborator",
  "requestRatification",
  "updateMemberRole",
  "addEvent",
  "updateEvent",
  "deleteEvent",
  "addException",
  "onAddTag",
  "onDeleteTag",
  "onUpdateTag",
  "joinSociety",
  "leaveSociety",
  "handleUnreport",
];

const modalNames = [
  "setShowSettings",
  "setShowReportModal",
  "setGalleryOpen",
  "setShowCoverModal",
  "setShowMembersModal",
  "setEditingAnnouncement",
  "setEditMode",
];

const createSociety = (overrides = {}) => ({
  id: 1,
  name: "Robotics Society",
  role: "admin",
  is_admin: true,
  has_reported: false,
  images: [],
  announcements: [],
  tags: [],
  ratification_status: "approved",
  is_ratified: true,
  ...overrides,
});

const createPage = (overrides = {}) => ({
  activeTab: "calendar",
  handleTabChange: vi.fn(),
  focusAnnouncementId: null,
  ...overrides,
});

const createModals = (overrides = {}) => ({
  showSettings: false,
  showReportModal: false,
  galleryOpen: false,
  showCoverModal: false,
  showMembersModal: false,
  editingAnnouncement: null,
  editMode: false,
  ...createFnMap(modalNames),
  ...overrides,
});

const createSubscription = (overrides = {}) => ({
  isSubscribed: false,
  toggleSubscription: vi.fn(),
  ...overrides,
});

const createTracker = (overrides = {}) => ({
  hasChanges: vi.fn(() => false),
  getChangeSummary: vi.fn(() => []),
  resetChanges: vi.fn(),
  ...overrides,
});

const createActionMap = () => ({
  ...createFnMap(actionNames),
  deleteSociety: vi.fn().mockResolvedValue({}),
  publishChanges: vi.fn().mockResolvedValue({}),
});

export function buildPageData(overrides = {}) {
  const { society, page, modals, subscription, tracker, ...rest } = overrides;
  return {
    loading: false,
    society: createSociety(society),
    page: createPage(page),
    modals: createModals(modals),
    subscription: createSubscription(subscription),
    tracker: createTracker(tracker),
    members: [],
    ...createActionMap(),
    ...rest,
  };
}
