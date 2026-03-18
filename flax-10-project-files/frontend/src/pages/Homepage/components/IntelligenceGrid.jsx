import React, { useState } from "react";
import styles from "./IntelligenceGrid.module.css";
import { BentoCard } from "../../../components/ui/bento-grid";

// Helper for drag animations/logic
const DelBtn = ({ onClick }) => (
  <button
    className={styles.delBtn}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    −
  </button>
);

const Grip = () => (
  <div className={styles.grip}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={styles.gripDot} />
    ))}
  </div>
);

const AddSheet = ({ visible, active, catalogue, onAdd, onClose }) => {
  const available = catalogue.filter((w) => !active.includes(w.id));
  const sections = available.reduce((acc, widget) => {
    const key = widget.section || "Homepage";
    if (!acc[key]) acc[key] = [];
    acc[key].push(widget);
    return acc;
  }, {});
  const sectionOrder = ["Essentials", "Planning", "Progress", "Profile", "Analytics"];
  const orderedSectionKeys = [
    ...sectionOrder.filter((key) => sections[key]?.length),
    ...Object.keys(sections).filter((key) => !sectionOrder.includes(key)),
  ];
  if (!visible) return null;
  return (
    <div className={styles.addSheetBackdrop}>
      <div className={styles.addSheetOverlay} onClick={onClose} />
      <div className={styles.addSheet}>
        <div className={styles.addSheetHandle} />
        <h3 className={styles.addSheetTitle}>Add Widgets</h3>
        <p className={styles.addSheetSubtitle}>Tap a widget to add it to your dashboard</p>
        
        {available.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted-sage)", padding: "32px 0" }}>
            All widgets are already on your dashboard!
          </div>
        ) : (
          <div className={styles.addSections}>
            {orderedSectionKeys.map((sectionKey) => (
              <div key={sectionKey} className={styles.addSection}>
                <div className={styles.addSectionTitle}>{sectionKey}</div>
                <div className={styles.addOptionsGrid}>
                  {sections[sectionKey].map((w) => (
                    <div
                      key={w.id}
                      className={styles.addOptionCard}
                      onClick={() => {
                        onAdd(w.id);
                        onClose();
                      }}
                    >
                      <span className={styles.addOptionIcon}>{w.icon}</span>
                      <div className={styles.addOptionInfo}>
                        <div className={styles.addOptionLabel}>{w.label}</div>
                        <div className={styles.addOptionMeta}>{w.col}×{w.row} tile</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function IntelligenceGrid({
  layout,
  setLayout,
  edit,
  catalogue,
  widgetRenderer,
  showAdd,
  setShowAdd,
  renderAfterHero,
}) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const onDragStart = (e, id) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const onDragOver = (e, id) => {
    e.preventDefault();
    if (id !== dragging) setDragOver(id);
  };

  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragging || dragging === targetId) return;
    setLayout((prev) => {
      const next = [...prev];
      const fi = next.indexOf(dragging);
      const ti = next.indexOf(targetId);
      next.splice(fi, 1);
      next.splice(ti, 0, dragging);
      return next;
    });
    onDragEnd();
  };

  const handleAddWidget = (id) => {
    setLayout((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev];
      const widget = catalogue.find((item) => item.id === id);
      // Keep wide widgets near the top so grid placement feels predictable.
      if (widget?.col >= 2) {
        const firstNonHeroIdx = next.findIndex((itemId) => itemId !== "hero");
        if (firstNonHeroIdx === -1) {
          next.push(id);
          return next;
        }
        next.splice(firstNonHeroIdx, 0, id);
        return next;
      }
      next.push(id);
      return next;
    });
  };

  return (
    <div className={styles.gridContainer}>

      <div className={styles.bentoGrid} data-testid="bento-grid">
        {/* Pinned Hero Section inside the grid container */}
        {layout.includes("hero") && (
          <div 
            className={`${styles.widgetWrapper} ${styles["widget-hero"]}`}
            style={{ gridColumn: "1 / -1" }}
          >
            <div className={styles.widgetClip}>
              <div className={styles.widgetContent}>
                {widgetRenderer("hero")}
              </div>
            </div>
          </div>
        )}
        {renderAfterHero && (
          <div className={styles.afterHeroBar} style={{ gridColumn: "1 / -1" }}>
            {renderAfterHero()}
          </div>
        )}
        {layout.filter(id => id !== "hero").map((id) => {
          const w = catalogue.find((item) => item.id === id);
          if (!w) return null;
          
          const isDragSrc = dragging === id;
          const isDragTgt = dragOver === id;

          const wrapperClass = `
            ${styles.widgetWrapper} 
            ${edit ? styles.editMode : ""} 
            ${isDragSrc ? styles.dragging : ""} 
            ${isDragTgt ? styles.dragOver : ""} 
            ${styles["widget-" + id] || ""}
          `;

          return (
            <div
              key={id}
              draggable={edit}
              onDragStart={edit ? (e) => onDragStart(e, id) : undefined}
              onDragEnd={edit ? onDragEnd : undefined}
              onDragOver={edit ? (e) => onDragOver(e, id) : undefined}
              onDrop={edit ? (e) => onDrop(e, id) : undefined}
              className={wrapperClass}
              data-widget-id={id}
              style={{
                gridColumn: `span ${w.col}`,
                gridRow: `span ${w.row}`,
              }}
            >
              {edit && <DelBtn onClick={() => setLayout((prev) => prev.filter((x) => x !== id))} />}
              {edit && <Grip />}
              <div className={styles.widgetClip}>
                <div className={styles.widgetContent}>
                  <BentoCard>{widgetRenderer(id)}</BentoCard>
                </div>
              </div>
            </div>
          );
        })}

        {edit && (
          <div
            onClick={() => setShowAdd(true)}
            className={styles.addWidgetSlot}
          >
            <span className={styles.addIcon}>＋</span>
            <span className={styles.addLabel}>Add Widget</span>
          </div>
        )}
      </div>

      <AddSheet
        visible={showAdd}
        active={layout}
        catalogue={catalogue}
        onAdd={handleAddWidget}
        onClose={() => setShowAdd(false)}
      />
    </div>
  );
}
