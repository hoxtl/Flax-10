/*
 * Attendance page entry.
 */

import AppPage from "../../components/common/AppPage/AppPage";
import AttendancePageBody from "./components/AttendancePageBody";
import AttendancePageStatus from "./components/AttendancePageStatus";
import { useAttendancePageModel } from "./hooks/useAttendancePageModel";
import styles from "./AttendancePage.module.css";

export default function AttendancePage() {
  const model = useAttendancePageModel();
  const statusView = <AttendancePageStatus loading={model.loading} error={model.error} />;

  return (
    <AppPage title="Attendance" subtitle="Track your attendance for lectures, small groups, and labs." width="full" contentClassName={styles.page}>
      {model.loading || model.error ? statusView : <AttendancePageBody model={model} />}
    </AppPage>
  );
}
