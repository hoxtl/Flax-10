/**
 * Intelligence grid sheets.
 */

import styles from "./IntelligenceGrid.module.css";

export function AddSheet({ active, catalogue, onAdd, onClose, visible }) {
  if (!visible) return null;
  const sections = getSections(active, catalogue);
  return (
    <div className={styles.addSheetBackdrop}>
      <div className={styles.addSheetOverlay} onClick={onClose} />
      <div className={styles.addSheet}>
        <div className={styles.addSheetHandle} />
        <h3 className={styles.addSheetTitle}>Add Widgets</h3>
        <p className={styles.addSheetSubtitle}>Tap a widget to add it to your dashboard</p>
        {sections.length === 0 ? <EmptySheet /> : <SectionList onAdd={onAdd} onClose={onClose} sections={sections} />}
      </div>
    </div>
  );
}

function getSections(active, catalogue) {
  const available = catalogue.filter((widget) => !active.includes(widget.id));
  return orderedSectionKeys(available).map((key) => ({ key, widgets: available.filter((widget) => (widget.section || "Homepage") === key) }));
}

function orderedSectionKeys(widgets) {
  const sections = [...new Set(widgets.map((widget) => widget.section || "Homepage"))];
  const preferred = ["Essentials", "Planning", "Progress", "Profile", "Analytics"];
  return [...preferred.filter((key) => sections.includes(key)), ...sections.filter((key) => !preferred.includes(key))];
}

function EmptySheet() {
  return <div style={emptyStyle}>All widgets are already on your dashboard!</div>;
}

const emptyStyle = {
  textAlign: "center",
  color: "var(--text-muted-sage)",
  padding: "32px 0",
};

function SectionList({ onAdd, onClose, sections }) {
  return <div className={styles.addSections}>{sections.map((section) => <SectionCard key={section.key} onAdd={onAdd} onClose={onClose} section={section} />)}</div>;
}

function SectionCard({ onAdd, onClose, section }) {
  return (
    <div className={styles.addSection}>
      <div className={styles.addSectionTitle}>{section.key}</div>
      <div className={styles.addOptionsGrid}>{section.widgets.map((widget) => <OptionCard key={widget.id} onAdd={onAdd} onClose={onClose} widget={widget} />)}</div>
    </div>
  );
}

function OptionCard({ onAdd, onClose, widget }) {
  return (
    <div className={styles.addOptionCard} onClick={() => addWidget(onAdd, onClose, widget.id)}>
      <span className={styles.addOptionIcon}>{widget.icon}</span>
      <div className={styles.addOptionInfo}>
        <div className={styles.addOptionLabel}>{widget.label}</div>
        <div className={styles.addOptionMeta}>{widget.col}×{widget.row} tile</div>
      </div>
    </div>
  );
}

function addWidget(onAdd, onClose, widgetId) {
  onAdd(widgetId);
  onClose();
}
