import { Reorder, AnimatePresence } from "framer-motion";
import panelStyles from "./TaskPanel.module.css";
import sectionStyles from "./TaskSection.module.css";
import { UrgentSection, OthersSection, DoneSection } from "./TaskSection";

function EmptyState() {
  return <div className={panelStyles.emptyState}>No tasks yet. Add one below!</div>;
}

function ActiveGroup({ activePinned, onReorder, urgentActive, otherActive, sectionProps }) {
  return (
    <Reorder.Group axis="y" values={activePinned} onReorder={onReorder} className={sectionStyles.reorderGroup}>
      <AnimatePresence>
        <UrgentSection items={urgentActive} {...sectionProps} />
        <OthersSection items={otherActive} {...sectionProps} />
      </AnimatePresence>
    </Reorder.Group>
  );
}

export default function TaskList({ isEmpty, activePinned, urgentActive, otherActive, doneItems, onReorder, ...sectionProps }) {
  return (
    <div className={panelStyles.list}>
      {isEmpty && <EmptyState />}
      <ActiveGroup activePinned={activePinned} onReorder={onReorder} urgentActive={urgentActive} otherActive={otherActive} sectionProps={sectionProps} />
      <DoneSection items={doneItems} {...sectionProps} />
    </div>
  );
}