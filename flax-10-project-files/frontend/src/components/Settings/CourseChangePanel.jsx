import { useState, useEffect } from "react";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import {
  requestCourseChange,
  getMyCourseChangeRequest,
} from "../../api/adminApi";
import styles from "../../pages/Settings/Settings.module.css";

function StatusBadge({ status, requestedCourse, currentCourse }) {
  if (status === "pending") {
    return (
      <div className={styles.teacherPending}>
        <div className={styles.teacherBadge}>
          <span>⏳</span>
          <div>
            <strong>Course change pending</strong>
            <p className={styles.teacherBadgeSub}>
              Requested: <em>{requestedCourse}</em>
              {currentCourse ? ` (from ${currentCourse})` : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className={styles.teacherPending}>
        <div className={styles.teacherBadge}>
          <span>✅</span>
          <div>
            <strong>Course change approved</strong>
            <p className={styles.teacherBadgeSub}>
              Your course has been updated to <em>{requestedCourse}</em>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className={styles.teacherPending}>
        <div className={styles.teacherBadge}>
          <span>❌</span>
          <div>
            <strong>Course change rejected</strong>
            <p className={styles.teacherBadgeSub}>
              Your request to change to <em>{requestedCourse}</em> was rejected.
              You may submit a new request below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}