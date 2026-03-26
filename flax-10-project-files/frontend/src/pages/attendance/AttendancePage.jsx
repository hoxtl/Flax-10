/*
 * Attendance page entry.
 */

import AppPage from "../../components/common/app_page/AppPage";
import { BackToTop } from "../../components/Pagination/Pagination";
import AttendancePageBody from "./components/AttendancePageBody";
import AttendancePageStatus from "./components/AttendancePageStatus";
import { useAttendancePageModel } from "./hooks/useAttendancePageModel";
import styles from "./AttendancePage.module.css";

const attendanceSubtitle = (
  <>
    Track your <em>lectures</em>, <em>small groups</em>, and <em>labs</em> across your timetable at <em>King's</em>.
  </>
);

export default function AttendancePage() {
  const model = useAttendancePageModel();
  const statusView = <AttendancePageStatus loading={model.loading} error={model.error} />;

  return (
    <AppPage title="My Venio Details" subtitle={attendanceSubtitle} width="full" contentClassName={styles.page}>
      {model.loading || model.error ? statusView : <AttendancePageBody model={model} />}
      <BackToTop />
    </AppPage>
  );
}
