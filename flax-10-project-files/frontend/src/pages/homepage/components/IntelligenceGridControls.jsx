/**
 * Intelligence grid controls.
 */

import { Check, Minus, Pencil, Plus, RotateCcw, Shuffle } from "lucide-react";
import { motion as Motion } from "framer-motion";
import styles from "./IntelligenceGrid.module.css";

export function DeleteButton({ onClick }) {
  return <button className={styles.delBtn} onClick={stopAndRun(onClick)}>−</button>;
}

function stopAndRun(onClick) {
  return (event) => {
    event.stopPropagation();
    onClick();
  };
}

export function GridGrip() {
  return <div className={styles.grip}>{Array.from({ length: 6 }).map((_, index) => <div key={index} className={styles.gripDot} />)}</div>;
}

export function ResizeControls(props) {
  if (!hasResizeOptions(props)) return null;
  return (
    <div className={styles.resizeControls} onClick={(event) => event.stopPropagation()}>
      <ResizeGroup axis="W" value={props.col} onDecrease={() => props.onResize(props.id, { col: props.col - 1, row: props.row })} onIncrease={() => props.onResize(props.id, { col: props.col + 1, row: props.row })} canDecrease={canShrinkWidth(props)} canIncrease={canGrowWidth(props)} disabled={props.id === "hero"} />
      <div className={styles.resizeDivider} />
      <ResizeGroup axis="H" value={props.row} onDecrease={() => props.onResize(props.id, { col: props.col, row: props.row - 1 })} onIncrease={() => props.onResize(props.id, { col: props.col, row: props.row + 1 })} canDecrease={props.row > (props.minRow || 1)} canIncrease={props.row < (props.maxRow || 4)} />
    </div>
  );
}

function hasResizeOptions(props) {
  return canGrowWidth(props) || canShrinkWidth(props) || props.row < (props.maxRow || 4) || props.row > (props.minRow || 1);
}

function canGrowWidth(props) {
  return props.id !== "hero" && props.col < (props.maxCol || 2);
}

function canShrinkWidth(props) {
  return props.id !== "hero" && props.col > (props.minCol || 1);
}

function ResizeGroup({ axis, canDecrease, canIncrease, disabled, onDecrease, onIncrease, value }) {
  return (
    <div className={styles.resizeGroup} style={disabled ? disabledStyle : undefined}>
      <ResizeButton disabled={!canDecrease || disabled} onClick={onDecrease} title={canDecrease ? `Shrink ${axis}` : "Minimum reached"}><Minus size={13} strokeWidth={3} /></ResizeButton>
      <span className={styles.resizeVal}>{value}{axis}</span>
      <ResizeButton disabled={!canIncrease || disabled} onClick={onIncrease} title={`Grow ${axis}`}><Plus size={13} strokeWidth={3} /></ResizeButton>
    </div>
  );
}

function ResizeButton({ children, disabled, onClick, title }) {
  return <button className={styles.resizeBtn} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

const disabledStyle = {
  opacity: 0.4,
  pointerEvents: "none",
};

export function GridActions({ edit, onRandomize, onReset, onToggleEdit }) {
  return (
    <div className={styles.gridActions}>
      <EditButton edit={edit} onToggleEdit={onToggleEdit} />
      {edit && <ExtraActions onRandomize={onRandomize} onReset={onReset} />}
    </div>
  );
}

function EditButton({ edit, onToggleEdit }) {
  return (
    <div className={styles.editBtnWrap}>
      <Motion.button
        onClick={onToggleEdit}
        className={`${styles.iconActionBtn} ${edit ? styles.editBtnActive : ""}`}
        aria-label={edit ? "Done editing layout" : "Edit dashboard layout"}
        animate={edit ? { scale: 1 } : { scale: [1, 1.08, 1] }}
        transition={edit ? {} : { duration: 1.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
      >
        {edit ? <Check size={26} /> : <Pencil size={24} />}
      </Motion.button>
      {!edit && <span className={styles.editBtnTooltip}>Edit your widgets</span>}
    </div>
  );
}

function ExtraActions({ onRandomize, onReset }) {
  return <><IconButton onClick={onRandomize} title="Shuffle Layout"><Shuffle size={16} /></IconButton><IconButton onClick={onReset} title="Reset Layout"><RotateCcw size={16} /></IconButton></>;
}

function IconButton({ children, onClick, title }) {
  return <button onClick={onClick} className={styles.iconActionBtn} title={title}>{children}</button>;
}
