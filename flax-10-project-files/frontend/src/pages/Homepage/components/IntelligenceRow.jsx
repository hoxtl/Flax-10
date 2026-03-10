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
import { Settings, Check, Lock, GripHorizontal, Trash2, Plus, X as CloseIcon } from "lucide-react";

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
        <div className={styles.headerRight}>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border bg-white shadow-sm hover:bg-stone-50 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
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
          axis="y"
          values={homepageWidgets}
          onReorder={saveWidgetLayout}
          className={styles.grid}
        >
          {homepageWidgets.map((widget) => (
            <Reorder.Item
              key={widget.id}
              value={widget}
              className={getWidgetStyleClass(widget.id)}
            >
              <BentoCard className={isEditingDashboard ? 'opacity-90 outline outline-2 outline-gray-200 outline-offset-2 scale-[0.98]' : ''}>
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10 transition-opacity">
                  <div className="p-1.5 rounded-md bg-stone-100 hover:bg-stone-200 cursor-grab">
                    <GripHorizontal size={14} className="text-stone-500" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {renderWidgetContent(widget.id)}
              </BentoCard>
            </Reorder.Item>
          ))}
          <BentoCard className="flex items-center justify-center border-2 border-dashed bg-transparent hover:bg-stone-50 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => { /* TODO: Open modal to add widget */ }}
          >
            <Plus size={24} />
          </BentoCard>
        </Reorder.Group>
      ) : (
        <BentoGrid>
          {homepageWidgets.map((widget) => (
            <BentoCard key={widget.id} className={getWidgetStyleClass(widget.id)}>
              {renderWidgetContent(widget.id)}
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      {/* Add Widget Button */}
      {isEditingDashboard && (
        <div className="mt-6 flex justify-center pb-8">
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full border-2 border-dashed bg-transparent hover:bg-stone-50 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add Widget
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

