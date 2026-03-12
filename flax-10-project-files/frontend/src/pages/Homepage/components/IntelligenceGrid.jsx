import React from "react";
import { ArrowUp, ArrowDown, Plus, Minus } from "lucide-react";
import styles from "./IntelligenceRow.module.css";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";

const getPosClass = (id) => {
  const classes = {
    deadlines: styles.posDeadlines,
    tasks: styles.posTodaysTasks,
    rightNow: styles.posRightNow,
    studyPulse: styles.posStudyPulse,
    quickActions: styles.posQuickActions,
    socialDiscover: styles.posSocialDiscover,
  };
  return classes[id] || "";
};

const EditActions = ({ index, isFirst, isLast, onMove, onRemove }) => (
  <div className={styles.widgetEditOverlay}>
    <div className={styles.widgetEditActions}>
      <button type="button" onClick={() => onMove(index, -1)} disabled={isFirst}><ArrowUp size={16}/></button>
      <button type="button" onClick={() => onRemove(index)}><Minus size={16}/></button>
      <button type="button" onClick={() => onMove(index, 1)} disabled={isLast}><ArrowDown size={16}/></button>
    </div>
  </div>
);

const ActiveWidget = ({ widget, index, isFirst, isLast, el, isEditing, onMove, onRemove }) => (
  <BentoCard key={widget.id} className={`${styles.bentoSlot} ${styles[`bentoSlotVariant${widget.id}`] || ""} ${getPosClass(widget.id)}`}>
    {el}
    {isEditing && (
      <EditActions index={index} isFirst={isFirst} isLast={isLast} onMove={onMove} onRemove={onRemove} />
    )}
  </BentoCard>
);

const AvailableWidget = ({ id, el, onAdd }) => (
  <BentoCard key={`available-${id}`} className={`${styles.bentoSlot} ${styles[`bentoSlotVariant${id}`] || ""} ${getPosClass(id)}`} style={{ opacity: 0.6, order: 999 }}>
    <div style={{ pointerEvents: "none" }}>{el}</div>
    <div className={styles.widgetEditOverlay}>
      <div className={styles.widgetEditActions}>
        <button type="button" onClick={() => onAdd(id)} title="Add widget"><Plus size={16}/></button>
      </div>
    </div>
  </BentoCard>
);

const ActiveWidgetList = ({ widgets, elements, isEditing, onMove, onRemove }) => (
  <>
    {widgets.map((w, i) => (
      elements[w.id] && <ActiveWidget key={w.id} widget={w} index={i} isFirst={i === 0} isLast={i === widgets.length - 1} el={elements[w.id]} isEditing={isEditing} onMove={onMove} onRemove={onRemove} />
    ))}
  </>
);

const AvailableWidgetList = ({ isEditing, available, elements, onAdd }) => (
  isEditing && available.map(id => (
    <AvailableWidget key={`available-${id}`} id={id} el={elements[id]} onAdd={onAdd} />
  ))
);

export default function IntelligenceGrid({
  homepageWidgets, widgetElements, isEditingDashboard,
  availableWidgets, moveWidget, removeWidget, addWidget,
}) {
  return (
    <BentoGrid className={styles.primaryGrid}>
      <ActiveWidgetList widgets={homepageWidgets} elements={widgetElements} isEditing={isEditingDashboard} onMove={moveWidget} onRemove={removeWidget} />
      <AvailableWidgetList isEditing={isEditingDashboard} available={availableWidgets} elements={widgetElements} onAdd={addWidget} />
    </BentoGrid>
  );
}
