/**
 * Intelligence grid widgets.
 */

import { BentoCard } from "../../../components/ui/BentoGrid";
import styles from "./IntelligenceGrid.module.css";
import { DeleteButton, GridGrip, ResizeControls } from "./IntelligenceGridControls";

export function HeroWidget({ catalogue, edit, layout, setWidgetSize, widgetRenderer, widgetSizes }) {
  if (!layout.includes("hero")) return null;
  const widget = catalogue.find((item) => item.id === "hero");
  const row = widgetSizes.hero?.row || widget?.row || 2;
  return (
    <div className={`${styles.widgetWrapper} ${styles["widget-hero"]} ${edit ? styles.editMode : ""}`} style={{ gridColumn: "1 / -1", gridRow: `span ${row}` }}>
      {edit && <HeroResize widget={widget} row={row} setWidgetSize={setWidgetSize} />}
      <WidgetClip>{widgetRenderer("hero", { col: 2, row })}</WidgetClip>
    </div>
  );
}

function HeroResize({ row, setWidgetSize, widget }) {
  return <div style={heroResizeStyle}><ResizeControls id="hero" col={2} row={row} minCol={widget?.minCol} minRow={widget?.minRow} maxCol={widget?.maxCol} maxRow={widget?.maxRow} onResize={setWidgetSize} /></div>;
}

const heroResizeStyle = {
  position: "absolute",
  bottom: 8,
  right: 8,
  zIndex: 30,
};

export function GridWidgetList(props) {
  return props.layout.filter((id) => id !== "hero").map((id) => <GridWidget key={id} id={id} {...props} />);
}

function GridWidget(props) {
  const widget = props.catalogue.find((item) => item.id === props.id);
  if (!widget) return null;
  const size = getWidgetSize(props.widgetSizes, widget, props.id);
  const content = props.widgetRenderer(props.id, size);
  if (content === null) return null;
  return <WidgetFrame {...props} content={content} widget={widget} size={size} />;
}

function getWidgetSize(widgetSizes, widget, id) {
  const customSize = widgetSizes[id] || {};
  return { col: customSize.col || widget.col, row: customSize.row || widget.row };
}

function WidgetFrame(props) {
  return (
    <div key={props.id} draggable={props.edit} onDragStart={props.edit ? (event) => props.onDragStart(event, props.id) : undefined} onDragEnd={props.edit ? props.onDragEnd : undefined} onDragOver={props.edit ? (event) => props.onDragOver(event, props.id) : undefined} onDrop={props.edit ? (event) => props.onDrop(event, props.id) : undefined} className={getWrapperClassName(props)} data-widget-id={props.id} style={{ gridColumn: `span ${props.size.col}`, gridRow: `span ${props.size.row}` }}>
      {props.edit && <DeleteButton onClick={() => props.setLayout((prev) => prev.filter((item) => item !== props.id))} />}
      {props.edit && <GridGrip />}
      {props.edit && <ResizeControls id={props.id} col={props.size.col} row={props.size.row} minCol={props.widget.minCol} minRow={props.widget.minRow} maxCol={props.widget.maxCol} maxRow={props.widget.maxRow} onResize={props.setWidgetSize} />}
      <WidgetClip><BentoCard>{props.content}</BentoCard></WidgetClip>
    </div>
  );
}

function getWrapperClassName({ dragging, dragOver, edit, id }) {
  return [styles.widgetWrapper, edit ? styles.editMode : "", dragging === id ? styles.dragging : "", dragOver === id ? styles.dragOver : "", styles[`widget-${id}`] || ""].join(" ");
}

function WidgetClip({ children }) {
  return <div className={styles.widgetClip}><div className={styles.widgetContent}>{children}</div></div>;
}

export function AddWidgetSlot({ edit, onClick }) {
  if (!edit) return null;
  return <div onClick={onClick} className={styles.addWidgetSlot}><span className={styles.addIcon}>＋</span><span className={styles.addLabel}>Add Widget</span></div>;
}
