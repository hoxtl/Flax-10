/*
 * Reminder field UI components.
 */
import { useEffect, useRef, useState } from "react";
import PrimaryButton from "../../../common/PrimaryButton/PrimaryButton";

export function useReminderOutsideClick(ref, callback) {
  useEffect(() => {
    const handler = (event) => ref.current && !ref.current.contains(event.target) && callback();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, callback]);
}

function PermissionButton({ setPermission }) {
  return <button type="button" onClick={() => Notification.requestPermission().then(setPermission)} className="reminder-enable-btn">Enable notifications</button>;
}

export function PermissionStatus() {
  const [permission, setPermission] = useState("Notification" in window ? Notification.permission : "denied");
  if (!("Notification" in window)) return <div className="reminder-status">Not supported</div>;
  if (permission === "granted") return <div className="reminder-status granted">Notifications enabled</div>;
  if (permission === "denied") return <div className="reminder-status denied">Notifications blocked</div>;
  return <PermissionButton setPermission={setPermission} />;
}

function addCustomReminder(value, selected, onChange, setValue) {
  const minutes = parseInt(value, 10);
  if (!Number.isNaN(minutes) && minutes >= 0 && !selected.includes(minutes)) onChange([...selected, minutes].sort((left, right) => left - right));
  setValue("");
}

export function CustomReminderInput({ selected, onChange }) {
  const [value, setValue] = useState("");
  const onAdd = () => addCustomReminder(value, selected, onChange, setValue);
  return (
    <div className="custom-reminder">
      <input type="number" min="0" placeholder="Custom (min)" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault() || onAdd())} />
      <PrimaryButton type="button" variant="primary" size="small" pill onClick={onAdd}>Add</PrimaryButton>
    </div>
  );
}
