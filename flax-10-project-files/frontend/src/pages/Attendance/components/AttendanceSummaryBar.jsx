import StatStrip from "../../../components/Common/StatStrip/StatStrip";
import { useCountUp } from "../../../hooks/useCountUp";
import styles from "./AttendanceSummaryBar.module.css";

export default function AttendanceSummaryBar({ summary }) {
  if (summary.pct === null) return null;
  const overallRef = useCountUp(summary.pct, 1200);
  const attendedRef = useCountUp(summary.attended, 1200);
  const missedRef = useCountUp(summary.missed, 1200);
  const toRecordRef = useCountUp(summary.unmarkedCount, 1200);

  return (
    <StatStrip
      className={styles.summaryBar}
      items={[
        { key: "overall", label: "Overall", value: summary.pct, valueRef: overallRef, suffix: "%" },
        { key: "attended", label: "Attended", value: summary.attended, valueRef: attendedRef, tone: "success" },
        { key: "missed", label: "Missed", value: summary.missed, valueRef: missedRef, tone: "danger" },
        { key: "to-record", label: "To record", value: summary.unmarkedCount, valueRef: toRecordRef },
      ]}
    />
  );
}
