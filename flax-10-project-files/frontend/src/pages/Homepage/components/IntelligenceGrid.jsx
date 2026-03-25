/**
 * Intelligence dashboard grid.
 */

import { useState } from "react";
import styles from "./IntelligenceGrid.module.css";
import { GridActions } from "./IntelligenceGridControls";
import { AddSheet } from "./IntelligenceGridSheets";
import { AddWidgetSlot, GridWidgetList, HeroWidget } from "./IntelligenceGridWidgets";

export default function IntelligenceGrid(props) {
  const drag = useGridDrag(props.setLayout);
  return (
    <div className={styles.gridContainer}>
      <GridActions edit={props.edit} onRandomize={props.onRandomize} onReset={props.onReset} onToggleEdit={() => toggleEdit(props)} />
      <div className={styles.bentoGrid} data-testid="bento-grid">
        <HeroWidget {...props} />
        <MobileActionsBar edit={props.edit} onRandomize={props.onRandomize} onReset={props.onReset} onToggleEdit={() => toggleEdit(props)} />
        <GridWidgetList {...props} {...drag} />
        <AddWidgetSlot edit={props.edit} onClick={() => props.setShowAdd(true)} />
      </div>
      <AddSheet visible={props.showAdd} active={props.layout} catalogue={props.catalogue} onAdd={(id) => addWidget(id, props.setLayout)} onClose={() => props.setShowAdd(false)} />
    </div>
  );
}

function toggleEdit(props) {
  props.setEdit(!props.edit);
  if (props.edit) props.setShowAdd(false);
}

function addWidget(id, setLayout) {
  setLayout((prev) => (prev.includes(id) ? prev : [...prev, id]));
}

function useGridDrag(setLayout) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  return { dragOver, dragging, onDragEnd: () => endDrag(setDragging, setDragOver), onDragOver: (event, id) => markDragTarget(event, dragging, id, setDragOver), onDragStart: (event, id) => beginDrag(event, id, setDragging), onDrop: (event, id) => dropWidget(event, dragging, id, setLayout, setDragging, setDragOver) };
}

function beginDrag(event, id, setDragging) {
  setDragging(id);
  event.dataTransfer.effectAllowed = "move";
}

function endDrag(setDragging, setDragOver) {
  setDragging(null);
  setDragOver(null);
}

function markDragTarget(event, dragging, id, setDragOver) {
  event.preventDefault();
  if (id !== dragging) setDragOver(id);
}

function dropWidget(event, dragging, targetId, setLayout, setDragging, setDragOver) {
  event.preventDefault();
  if (!dragging || dragging === targetId) return;
  setLayout((prev) => reorderLayout(prev, dragging, targetId));
  endDrag(setDragging, setDragOver);
}

function reorderLayout(layout, dragging, targetId) {
  const next = [...layout];
  const fromIndex = next.indexOf(dragging);
  const targetIndex = next.indexOf(targetId);
  next.splice(fromIndex, 1);
  next.splice(targetIndex, 0, dragging);
  return next;
}

function MobileActionsBar({ edit, onRandomize, onReset, onToggleEdit }) {
  return (
    <div className={styles.afterHeroBar} style={{ gridColumn: "1 / -1" }}>
      <div className={styles.mobileActionsBar}><GridActions edit={edit} onRandomize={onRandomize} onReset={onReset} onToggleEdit={onToggleEdit} /></div>
    </div>
  );
}
