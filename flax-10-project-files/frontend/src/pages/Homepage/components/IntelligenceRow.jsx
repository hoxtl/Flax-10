import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflService";
import { RightNowWidget } from "./RightNowWidget";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { SocialDiscoverWidget } from "./SocialDiscoverWidget";
import { StudyPulseWidget } from "./StudyPulseWidget";
import { ImageWidget } from "./ImageWidget";
import { Reorder } from "framer-motion";
import { Settings, Check, Lock, GripHorizontal, Trash2, Plus, X as CloseIcon, RotateCcw } from "lucide-react";
import bentoStyles from "../../../components/ui/bento-grid.module.css";

function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  return `${day} · ${date}`;
}

function useTflDelays() {
  const [delays, setDelays] = useState(undefined);
  useEffect(() => {
    tflService.getTfLDelays()
      .then(data => setDelays(Array.isArray(data) ? data : []))
      .catch(() => setDelays([]));
  }, []);
  return delays;
}

export default function IntelligenceRow({
  displayName,
  slot1TodayTasks,
  slot3Urgent,
  studyPulseWindows,
  studyPulseNow,
  studyPulseOnStartFocus,
  studyPulseDeadlines,
  slot5Data,
  homepageWidgets = [],
  isEditingDashboard,
  setIsEditingDashboard,
  saveWidgetLayout
}) {
  const tflDelays = useTflDelays();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleRemoveWidget = (widgetId) => {
    saveWidgetLayout(homepageWidgets.filter((w) => w.id !== widgetId));
  };
  const defaultOrder = ["rightNow", "tasks", "quickActions", "studyPulse", "deadlines", "socialDiscover"];
  const isDefaultLayout =
    homepageWidgets.length === defaultOrder.length &&
    homepageWidgets.every((w, i) => w.id === defaultOrder[i]);

  const layoutModeClass = (!isEditingDashboard && isDefaultLayout) ? styles.defaultLayout : styles.customLayout;

  const renderWidgetContent = (id) => {
    switch (id) {
      case "rightNow":
        return (
          <RightNowWidget
            {...slot5Data}
            tflDelays={tflDelays}
            onOpenTimer={() => navigate("/timer")}
          />
        );
      case "tasks":
        return slot1TodayTasks;
      case "quickActions":
        return <QuickActionsWidget />;
      case "socialDiscover":
        return <SocialDiscoverWidget />;
      case "deadlines":
        return slot3Urgent;
      case "studyPulse":
        return (
          <StudyPulseWidget
            windows={studyPulseWindows ?? []}
            now={studyPulseNow ?? new Date()}
            onStartFocus={studyPulseOnStartFocus}
            deadlines={studyPulseDeadlines ?? []}
          />
        );
      default:
        // Handle custom image widget
        if (id.startsWith("customImage")) {
          const wData = homepageWidgets.find((w) => w.id === id);
          return (
            <ImageWidget
              widgetData={wData}
              isEditing={isEditingDashboard}
              onUpdateImage={(wId, url) => {
                saveWidgetLayout(homepageWidgets.map(w => w.id === wId ? { ...w, url } : w));
              }}
              onUpdateSpan={(wId, spanSize) => {
                saveWidgetLayout(homepageWidgets.map(w => w.id === wId ? { ...w, span: spanSize } : w));
              }}
            />
          );
        }
        return null; // fallback for widgets removed or unavailable
    }
  };

  const getWidgetStyleClass = (id) => {
    if (id.startsWith("customImage")) return styles.posImageWidget;
    switch (id) {
      case "rightNow": return styles.posRightNow;
      case "tasks": return styles.posTodaysTasks;
      case "quickActions": return styles.posQuickActions;
      case "socialDiscover": return styles.posSocialDiscover;
      case "deadlines": return styles.posDeadlines;
      case "studyPulse": return styles.posStudyPulse;
      default: return "";
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <motion.span
            className={styles.headerDateRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2} aria-hidden />
            <span className={styles.headerLabel}>{getTodayLabel()}</span>
          </motion.span>
          <motion.h2
            className={styles.headerTitle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {getGreeting(displayName)}
          </motion.h2>
        </div>
        <div className={styles.headerRight} style={{ flexDirection: 'row', gap: '8px' }}>
          {isEditingDashboard && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm transition-all hover:bg-red-50"
              style={{ borderColor: 'var(--border)', color: 'var(--warning-text)', backgroundColor: 'var(--card-bg)' }}
              onClick={() => {
                const resetWidgets = defaultOrder.map(id => ({ id, type: "system" }));
                saveWidgetLayout(resetWidgets);
                setIsEditingDashboard(false);
              }}
            >
              <RotateCcw size={14} /> Reset Layout
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm hover:opacity-80 transition-all"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)',
              backgroundColor: 'var(--color-card)'
            }}
            onClick={() => setIsEditingDashboard(!isEditingDashboard)}
          >
            {isEditingDashboard ? (
              <><Check size={14} /> Done Editing</>
            ) : (
              <><Settings size={14} /> Edit Dashboard</>
            )}
          </button>
        </div>
      </header>

      {isEditingDashboard ? (
        <Reorder.Group
          values={homepageWidgets}
          onReorder={saveWidgetLayout}
          className={`${layoutModeClass} ${bentoStyles.grid}`}
        >
          {homepageWidgets.map((widget) => (
            <Reorder.Item
              key={widget.id}
              value={widget}
              drag
              className={getWidgetStyleClass(widget.id)}
              style={widget.id.startsWith("customImage") ? { gridColumn: `span ${widget.span ?? 2}` } : undefined}
            >
              <motion.div
                className={`h-full ${isEditingDashboard ? 'opacity-95 outline outline-2 outline-offset-2 scale-[0.98] active:scale-[0.96] shadow-sm transition-transform cursor-grab active:cursor-grabbing' : ''}`}
                style={{ outlineColor: isEditingDashboard ? 'var(--color-primary)' : 'transparent' }}
              >
                <BentoCard className="h-full relative pointer-events-none">
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 z-10 transition-opacity pointer-events-auto bg-white/50 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-black/5">
                    <div className="p-1 rounded-md hover:bg-black/5 cursor-grab">
                      <GripHorizontal size={12} style={{ color: 'var(--text)' }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="p-1 rounded-md hover:bg-red-50 text-red-400 hover:text-red-500 cursor-pointer transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="pointer-events-auto h-full w-full">
                    {renderWidgetContent(widget.id)}
                  </div>
                </BentoCard>
              </motion.div>
            </Reorder.Item>
          ))}
          {/* Remove placeholder card, Add Button acts as the trigger now */}
        </Reorder.Group>
      ) : (
        <BentoGrid className={layoutModeClass}>
          {homepageWidgets.map((widget) => (
            <BentoCard
              key={widget.id}
              className={getWidgetStyleClass(widget.id)}
              style={widget.id.startsWith("customImage") ? { gridColumn: `span ${widget.span ?? 2}` } : undefined}
            >
              {renderWidgetContent(widget.id)}
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      {/* Circular Add Widget Button at the bottom */}
      {isEditingDashboard && (
        <div className="w-full flex justify-center mt-8 pb-12">
          <button
            type="button"
            className="flex items-center justify-center w-12 h-12 rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95 bg-white text-stone-600 hover:text-stone-900"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Add Widget Modal */}
      {showAddModal && isEditingDashboard && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800">Add Widget</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600 rounded-full transition-colors"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
              {[
                { id: "rightNow", title: "Right Now", desc: "Live compass of your schedule" },
                { id: "tasks", title: "Today's Tasks", desc: "Your action items and routines" },
                { id: "quickActions", title: "Quick Actions", desc: "One-click shortcuts" },
                { id: "socialDiscover", title: "Discover Societies", desc: "Explore events and groups" },
                { id: "deadlines", title: "Upcoming Deadlines", desc: "Stay on top of coursework" },
                { id: "studyPulse", title: "Study Pulse", desc: "Monitor weekly focus goals" },
                { id: "customImage", title: "Photo", desc: "Upload and display a custom image" }
              ].map((wItem) => {
                const isSystemInUse = wItem.id !== "customImage" && homepageWidgets.some((w) => w.id === wItem.id);
                if (isSystemInUse) return null; // Can only have one of each system widget

                return (
                  <button
                    key={wItem.id}
                    type="button"
                    onClick={() => {
                      const newId = wItem.id === "customImage" ? `customImage-${Date.now()}` : wItem.id;
                      saveWidgetLayout([...homepageWidgets, { id: newId, type: wItem.id === "customImage" ? "image" : "system" }]);
                      setShowAddModal(false);
                    }}
                    className="flex flex-col items-start gap-1 p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50 transition-all text-left"
                  >
                    <span className="font-semibold text-stone-800">{wItem.title}</span>
                    <span className="text-sm text-stone-500">{wItem.desc}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

