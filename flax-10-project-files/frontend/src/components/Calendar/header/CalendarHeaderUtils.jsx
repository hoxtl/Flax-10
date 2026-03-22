import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  Plus,
  LayoutList,
  Search,
  X,
  FolderKanban,
  Tag,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DatePickerButton } from "./DatePickerButton";
import PrimaryButton from "../../Common/PrimaryButton/PrimaryButton";
import { SegmentedControl } from "../../Common/SegmentedControl/SegmentedControl";
import MultiSelectDropdown from "../../UI/MultiSelectDropdown";
import AnimatedDropdown from "../../Common/AnimatedDropdown";
import SearchBar from "../../Common/SearchBar/SearchBar";
import { TagsSelector } from "../../Common/TagsSelector/TagsSelector";
import styles from "./CalendarHeaderUtils.module.css";

import {
  deleteSchedule,
  getSchedules,
  renameSchedule,
} from "../../../api/calendar/scheduleApi";
import { useToast } from "../../../context/ToastContext";
import StandardModal from "../../Common/StandardModal/StandardModal";
import HoldConfirmModal from "../../Common/HoldConfirmModal/HoldConfirmModal";
import TextInput from "../../Common/TextInput/TextInput";
import { useTags } from "../../../context/TagContext";
import TagManagerModal from "../../Tags/TagManagerModal";

export function CalendarNav({
  onPrev,
  onNext,
  onToday,
  showToday,
  selectedDate,
  onDatePick,
  title,
}) {
  return (
    <div className={styles.nav}>
      <NavArrow direction="left" onClick={onPrev} />
      {showToday && (
        <PrimaryButton
          className={styles.todayBtn}
          variant="ghost"
          onClick={onToday}
          pill
        >
          Today
        </PrimaryButton>
      )}
      <NavArrow direction="right" onClick={onNext} />
      <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
      {title && <h2 className={styles.title}>{title}</h2>}
    </div>
  );
}

function NavArrow({ direction, onClick }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      className={styles.arrowBtn}
      onClick={onClick}
      aria-label={direction === "left" ? "Previous" : "Next"}
    >
      <Icon size={18} />
    </button>
  );
}

export function ViewSwitcher({ modes, activeMode, onChange }) {
  return (
    <SegmentedControl
      options={modes}
      value={activeMode}
      onChange={onChange}
      variant="solid"
    />
  );
}

export function ActionMenu({ onAddEvent, onImport, isMobile = false }) {
  const options = [
    { label: "Add Event", value: "add" },
    { label: "Import Timetable", value: "import" },
  ];
  return (
    <AnimatedDropdown
      className={styles.actionMenu}
      customTrigger={
        <button type="button" className={styles.actionBtn} aria-label="Actions">
          <Plus size={18} />
        </button>
      }
      options={options}
      hideCheckmark={true}
      onChange={(val) => (val === "add" ? onAddEvent() : onImport())}
      align="right"
      openOnHover={!isMobile}
    />
  );
}

const DISPLAY_MODE_OPTIONS = [
  { label: "Grid View", value: "grid" },
  { label: "List View", value: "list" },
  { label: "Table View", value: "table" },
];

export function ViewModeButton({
  modes,
  activeMode,
  onChange,
  isMobile = false,
}) {
  const trigger = (
    <button
      type="button"
      className={styles.settingsBtn}
      title="View Mode"
      aria-label="View mode"
    >
      <LayoutList size={18} />
    </button>
  );
  return (
    <AnimatedDropdown
      className={styles.actionMenu}
      customTrigger={trigger}
      options={modes}
      value={activeMode}
      onChange={onChange}
      align="right"
      openOnHover={!isMobile}
    />
  );
}

const MOBILE_DISPLAY_OPTIONS = DISPLAY_MODE_OPTIONS.filter(
  (o) => o.value !== "table",
);

export function ViewSettingsMenu({ activeMode, onViewChange, isMobile }) {
  const trigger = (
    <button
      type="button"
      className={styles.settingsBtn}
      title="Display Mode"
      aria-label="Display mode"
    >
      <Settings2 size={18} />
    </button>
  );
  const options = isMobile ? MOBILE_DISPLAY_OPTIONS : DISPLAY_MODE_OPTIONS;
  return (
    <AnimatedDropdown
      className={styles.actionMenu}
      customTrigger={trigger}
      options={options}
      value={activeMode}
      onChange={onViewChange}
      align="right"
      openOnHover={!isMobile}
    />
  );
}

function SearchIconButton({ onClick }) {
  return (
    <button
      type="button"
      className={styles.settingsBtn}
      onClick={onClick}
      title="Search events"
      aria-label="Search events"
    >
      <Search size={18} />
    </button>
  );
}

export function SearchButton({
  value,
  onChange,
  isMobile = false,
  mobileToggleOnly = false,
  mobileActive = true,
  onMobileActiveChange,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);

  const toggle = () => {
    if (isExpanded && value) onChange("");
    setIsExpanded((p) => !p);
  };
  const blur = () => {
    if (!value) setIsExpanded(false);
  };

  useEffect(() => {
    const shouldFocus = isMobile ? mobileActive : isExpanded;
    if (shouldFocus) {
      const t = setTimeout(
        () => inputRef.current?.querySelector?.("input")?.focus(),
        120,
      );
      return () => clearTimeout(t);
    }
  }, [isExpanded, isMobile, mobileActive]);

  if (isMobile && mobileToggleOnly) {
    if (mobileActive) return null;
    return (
      <div className={styles.searchContainer}>
        <SearchIconButton onClick={() => onMobileActiveChange?.(true)} />
      </div>
    );
  }

  if (isMobile) {
    if (!mobileActive) return null;
    const closeMobileSearch = () => {
      if (value) onChange("");
      onMobileActiveChange?.(false);
    };

    const blurMobileSearch = () => {
      if (!value) onMobileActiveChange?.(false);
    };

    return (
      <div
        className={`${styles.searchContainer} ${styles.searchContainerMobile}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="search-mobile-expanded"
            className={`${styles.searchWrapper} ${styles.searchWrapperMobile}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div ref={inputRef} className={styles.searchInner}>
              <SearchBar
                value={value}
                onChange={onChange}
                placeholder="Search events..."
                className={styles.searchBar}
                onBlur={blurMobileSearch}
              />
              <button
                type="button"
                className={styles.searchClose}
                onClick={closeMobileSearch}
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={styles.searchContainer}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="search-expanded"
            className={styles.searchWrapper}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div ref={inputRef} className={styles.searchInner}>
              <SearchBar
                value={value}
                onChange={onChange}
                placeholder="Search events..."
                className={styles.searchBar}
                onBlur={blur}
              />
              <button
                className={styles.searchClose}
                onClick={toggle}
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search-icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <SearchIconButton onClick={toggle} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScheduleCard({
  schedule,
  editingId,
  renameDraft,
  isSaving,
  isRemoving,
  onRenameStart,
  onRenameCancel,
  onRenameDraftChange,
  onRenameSave,
  onRemoveRequest,
}) {
  const isEditing = editingId === schedule.id;

  return (
    <article className={styles.scheduleCard}>
      <div className={styles.scheduleInfo}>
        {isEditing ? (
          <TextInput
            value={renameDraft}
            onChange={(event) => onRenameDraftChange(event.target.value)}
            placeholder="Schedule name"
            aria-label={`Rename ${schedule.title}`}
          />
        ) : (
          <h3 className={styles.scheduleCardTitle}>{schedule.title}</h3>
        )}
        <p className={styles.scheduleMeta}>
          {schedule.event_allocations?.length || 0} allocated events
        </p>
      </div>

      <div className={styles.scheduleActions}>
        {isEditing ? (
          <>
            <PrimaryButton
              type="button"
              variant="primary"
              pill
              disabled={isSaving}
              onClick={() => onRenameSave(schedule.id)}
            >
              Save
            </PrimaryButton>
            <PrimaryButton
              type="button"
              variant="ghost"
              pill
              onClick={onRenameCancel}
            >
              Cancel
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton
            type="button"
            variant="ghost"
            pill
            onClick={() => onRenameStart(schedule)}
          >
            Rename
          </PrimaryButton>
        )}

        <PrimaryButton
          type="button"
          variant="danger"
          pill
          disabled={isRemoving}
          onClick={() => onRemoveRequest(schedule.id)}
        >
          Remove
        </PrimaryButton>
      </div>
    </article>
  );
}

function ScheduleManagerDialog({ open, onClose }) {
  const showToast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [removeTargetId, setRemoveTargetId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let ignore = false;

    const loadSchedules = async () => {
      setLoading(true);
      try {
        const data = await getSchedules();
        if (!ignore) setSchedules(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!ignore) {
          showToast(error.message, { variant: "error" });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSchedules();
    return () => {
      ignore = true;
    };
  }, [open, showToast]);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setRenameDraft("");
      setRemoveTargetId(null);
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [open]);

  const startRename = (schedule) => {
    setRemoveTargetId(null);
    setEditingId(schedule.id);
    setRenameDraft(schedule.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setRenameDraft("");
  };

  const saveRename = async (scheduleId) => {
    const nextTitle = renameDraft.trim();
    if (!nextTitle) {
      showToast("Please enter a schedule name.", { variant: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const data = await renameSchedule(scheduleId, nextTitle);
      if (data.overwritten) {
        showToast("Existing schedule with that name was replaced.", {
          variant: "info",
        });
      }
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === scheduleId
            ? {
                ...schedule,
                title: nextTitle,
                event_allocations:
                  data.event_allocations ?? schedule.event_allocations,
              }
            : schedule,
        ),
      );
      cancelRename();
    } catch (error) {
      showToast(error.message, { variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (scheduleId) => {
    if (!scheduleId) return;
    setIsDeleting(true);
    try {
      const removedTitle =
        schedules.find((schedule) => schedule.id === scheduleId)?.title ||
        "Schedule";
      await deleteSchedule(scheduleId);
      setSchedules((prev) =>
        prev.filter((schedule) => schedule.id !== scheduleId),
      );
      setRemoveTargetId(null);
      showToast(`"${removedTitle}" deleted.`);
    } catch (error) {
      showToast(error.message, { variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const openQuickAddSchedule = (view) => {
    window.dispatchEvent(
      new CustomEvent("quick-add:open", { detail: { view } }),
    );
    onClose?.();
  };

  if (!open) return null;

  return (
    <StandardModal
      title="Schedules"
      subtitle="Rename or remove saved manual and auto-generated schedules."
      subtitleClassName={styles.scheduleDialogSubtitle}
      onClose={onClose}
    >
      <div className={styles.scheduleDialogBody}>
        {loading && (
          <p className={styles.scheduleDialogEmpty}>Loading schedules…</p>
        )}
        {!loading && schedules.length === 0 && (
          <div className={styles.scheduleEmptyActions}>
            <PrimaryButton
              variant="primary"
              size="small"
              pill
              onClick={() => openQuickAddSchedule("schedule_manual")}
              aria-label="Open manual schedule quick add"
            >
              🧩 Manual Schedule
            </PrimaryButton>
            <PrimaryButton
              variant="ghost"
              size="small"
              pill
              onClick={() => openQuickAddSchedule("schedule_auto")}
              aria-label="Open auto schedule quick add"
            >
              ⚙️ Auto Schedule
            </PrimaryButton>
          </div>
        )}
        {!loading && schedules.length > 0 && (
          <div className={styles.scheduleList}>
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                editingId={editingId}
                renameDraft={renameDraft}
                isSaving={isSaving && editingId === schedule.id}
                isRemoving={isDeleting && removeTargetId === schedule.id}
                onRenameStart={startRename}
                onRenameCancel={cancelRename}
                onRenameDraftChange={setRenameDraft}
                onRenameSave={saveRename}
                onRemoveRequest={setRemoveTargetId}
              />
            ))}
          </div>
        )}
      </div>
      {removeTargetId && (
        <HoldConfirmModal
          title="Remove Schedule"
          warningText="This removes the saved schedule and its allocations. This cannot be undone."
          cancelLabel="Keep Schedule"
          holdLabel="Hold to Clear"
          onConfirm={() => confirmDelete(removeTargetId)}
          onCancel={() => setRemoveTargetId(null)}
        />
      )}
    </StandardModal>
  );
}

export function ScheduleManagerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={styles.settingsBtn}
        onClick={() => setOpen(true)}
        title="Manage schedules"
        aria-label="Manage schedules"
        type="button"
      >
        <FolderKanban size={18} />
      </button>
      <ScheduleManagerDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function FilterDropdownButton({ active, onChange, isMobile = false }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const [popupShiftX, setPopupShiftX] = useState(0);

  const selectedValues = useMemo(() => {
    const source = Array.isArray(active) ? active.flat(Infinity) : [active];
    const normalized = Array.from(
      new Set(
        source
          .filter((value) => typeof value === "string")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    return normalized.length === 0 || normalized.includes("all")
      ? []
      : normalized;
  }, [active]);

  const tagObjects = useMemo(() => {
    const uniqueTags = Array.from(
      new Map((tags || []).map((t) => [t.label.toLowerCase(), t])).values(),
    );
    return uniqueTags.map((t) => ({
      id: t.label.toLowerCase(),
      label: t.label,
    }));
  }, [tags]);

  const selectedTagObjects = tagObjects.filter((t) =>
    selectedValues.includes(t.id),
  );

  const handleSelectionChange = (newSelected) => {
    if (newSelected.length === 0) {
      onChange("all");
    } else {
      onChange(newSelected.map((t) => t.id));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => () => clearTimeout(hoverTimeoutRef.current), []);

  useEffect(() => {
    if (!isOpen) {
      setPopupShiftX(0);
      return;
    }

    const updateShift = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const popup = wrap.querySelector(`.${styles.filterPopup}`);
      if (!popup) return;

      const popupRect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const edgePadding = 8;

      let shift = 0;
      if (popupRect.left < edgePadding) {
        shift += edgePadding - popupRect.left;
      }
      if (popupRect.right > viewportWidth - edgePadding) {
        shift -= popupRect.right - (viewportWidth - edgePadding);
      }

      setPopupShiftX(shift);
    };

    const raf = requestAnimationFrame(updateShift);
    window.addEventListener("resize", updateShift);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateShift);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (isMobile) return;
    clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const activeCount = selectedValues.length;

  return (
    <>
      <div
        className={styles.filterWrap}
        ref={wrapRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`${styles.filterTriggerBtn} ${isOpen || activeCount > 0 ? styles.filterTriggerBtnActive : ""}`}
          aria-label="Filter events"
          type="button"
          onClick={() => setIsOpen((p) => !p)}
        >
          <Tag size={18} />
          {activeCount > 0 && (
            <span className={styles.filterBadge}>{activeCount}</span>
          )}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={styles.filterPopup}
              style={{ right: popupShiftX ? `${-popupShiftX}px` : undefined }}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className={styles.filterPopupHeader}>
                <span className={styles.filterPopupTitle}>Filter by tag</span>
                <button
                  type="button"
                  className={styles.filterManageBtn}
                  onClick={() => {
                    setIsOpen(false);
                    setShowManager(true);
                  }}
                >
                  Manage tags…
                </button>
              </div>
              <TagsSelector
                tags={tagObjects}
                selectedTags={selectedTagObjects}
                onSelectionChange={handleSelectionChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}
