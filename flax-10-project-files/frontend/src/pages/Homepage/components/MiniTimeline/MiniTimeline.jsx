/*
 * Homepage mini timeline coordinator.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { isReadOnlyEvent } from "../../../../components/Calendar/utils/eventUtils";
import { isToday } from "../../../../components/Calendar/utils/dateUtils";
import { useMiniTimelineData } from "../../hooks/useMiniTimelineData";
import { useMiniTimelineState } from "../../hooks/useMiniTimelineState";
import { EventContextMenu } from "./EventContextMenu";
import { MiniTimelineRowRenderer } from "./MiniTimelineRowRenderer";
import { NowStrip } from "./NowStrip";

const MotionRow = motion.div;

function useMiniTimelineAssignments(props, state) {
  return useMiniTimelineData({
    sortedEvents: props.sortedEvents,
    selectedDate: props.selectedDate,
    now: props.now,
    dayTasks: props.dayTasks,
    tasksDueToday: props.tasksDueToday,
    suggestableTasks: props.suggestableTasks,
    deadlineSuggestions: props.deadlineSuggestions,
    hasTimerSession: props.hasTimerSession,
    skippedGapTasks: state.skippedGapTasks,
    slottedTaskIds: state.slottedTaskIds,
    slottedTitles: state.slottedTitles,
  });
}

function buildRendererProps(props, uiState, data, setSkippedGapTasks, setSlottedTaskIds, setSlottedTitles) {
  const onQuickStart = (gapStartDate, gapMins, task, nextTask) => {
    if (task?.id) setSlottedTaskIds((current) => new Set([...current, task.id]));
    if (task?.title) setSlottedTitles((current) => new Set([...current, task.title]));
    props.onQuickStart?.(gapStartDate, gapMins, task, nextTask);
  };
  const onSkipGapTask = (rowId, taskId) => setSkippedGapTasks((current) => ({ ...current, [rowId]: new Set([...(current[rowId] || []), taskId]) }));
  return { ...props, ...data, ...uiState, onQuickStart, onSkipGapTask, onEventContextMenu: (eventItem, x, y) => uiState.setEventCtxMenu({ eventItem, x, y }) };
}

function TimelineRows({ rows, rendererProps, styles }) {
  if (rows.length === 0) return <div className={styles.planTimelineEmpty}><span className={styles.planTimelineEmptyText}>No events scheduled for this day.</span></div>;
  return rows.map((row) => <MotionRow key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}><MiniTimelineRowRenderer row={row} rows={rows} props={rendererProps} /></MotionRow>);
}

function TimelineContextMenu({ eventCtxMenu, onClose, onEdit, onDelete, styles }) {
  if (!eventCtxMenu || isReadOnlyEvent(eventCtxMenu.eventItem)) return null;
  return <EventContextMenu eventItem={eventCtxMenu.eventItem} pos={{ x: eventCtxMenu.x, y: eventCtxMenu.y }} styles={styles} onClose={onClose} onEdit={(eventItem) => onEdit?.(eventItem, eventItem?.tag)} onDelete={async (eventItem) => { await onDelete?.(eventItem); }} />;
}

export function MiniTimeline(props) {
  const uiState = useMiniTimelineState();
  const [skippedGapTasks, setSkippedGapTasks] = useState({});
  const [slottedTaskIds, setSlottedTaskIds] = useState(new Set());
  const [slottedTitles, setSlottedTitles] = useState(new Set());
  const assignmentState = { skippedGapTasks, slottedTaskIds, slottedTitles };
  const data = useMiniTimelineAssignments(props, assignmentState);
  const rendererProps = buildRendererProps(props, uiState, data, setSkippedGapTasks, setSlottedTaskIds, setSlottedTitles);
  const hasVisibleNowStrip = isToday(props.selectedDate) && (props.hasTimerSession || data.currentBlock);
  return <div className={props.styles.planTimelineWrap}>{hasVisibleNowStrip ? <NowStrip hasTimerSession={props.hasTimerSession} timerMode={props.timerMode} timerTask={props.timerTask} timeLeft={props.timeLeft} currentBlock={data.currentBlock} sleepWindow={uiState.sleepWindow} styles={props.styles} /> : null}<div className={`${props.styles.planTimelineList} ${data.rows.some((row) => row.type === "eventGroup") ? props.styles.planTimelineListHasConflict : ""}`.trim()}><TimelineRows rows={data.rows} rendererProps={{ ...rendererProps, attachNowRow: uiState.attachNowRow }} styles={props.styles} /><TimelineContextMenu eventCtxMenu={uiState.eventCtxMenu} onClose={() => uiState.setEventCtxMenu(null)} onEdit={props.onEdit} onDelete={props.onDelete} styles={props.styles} /></div></div>;
}
