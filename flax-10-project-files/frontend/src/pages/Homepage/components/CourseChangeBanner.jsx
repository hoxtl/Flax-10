import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCourseChangeRequest } from "../../../api/admin/adminApi";
import styles from "./CourseChangeBanner.module.css";

export default function CourseChangeBanner() {
  const [request, setRequest] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMyCourseChangeRequest()
      .then((data) => { if (data?.status === "pending") setRequest(data); })
      .catch(() => {});
  }, []);

  if (!request || dismissed) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>📋</span>
      <div className={styles.body}>
        <span className={styles.label}>Course change pending</span>
        <span className={styles.sub}>
          Your request to switch to <strong>{request.requested_course}</strong> is awaiting admin approval.
        </span>
      </div>
      <button
        className={styles.viewBtn}
        onClick={() => navigate("/settings?tab=course")}
        type="button"
      >
        View
      </button>
      <button className={styles.dismiss} onClick={() => setDismissed(true)} type="button" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
