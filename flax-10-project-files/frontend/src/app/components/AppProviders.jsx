import { NotificationProvider } from "../../context/NotificationContext";
import { ConfirmProvider } from "../../context/ConfirmContext";
import { ToastProvider } from "../../context/ToastContext";
import { CalendarProvider } from "../../context/CalendarContext";
import { TagProvider } from "../../context/TagContext";
import { TimerProvider } from "../../context/TimerContext";
import { TaskCompletionProvider } from "../../context/TaskCompletionContext";
import { NotificationToast } from "../../components/Notifications";
import AttendancePrompt from "../../components/Attendance/AttendancePrompt";

const providers = [
  NotificationProvider,
  ConfirmProvider,
  ToastProvider,
  CalendarProvider,
  TagProvider,
  TimerProvider,
  TaskCompletionProvider,
];

export function AppProviders({ children }) {
  const base = (
    <>
      {children}
      <NotificationToast />
      <AttendancePrompt />
    </>
  );
  return providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, base);
}
