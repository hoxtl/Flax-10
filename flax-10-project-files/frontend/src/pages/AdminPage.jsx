import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchTeacherRequests,
  resolveTeacherRequest,
  fetchReportedSocieties,
  dismissReport,
  fetchPendingRatifications,
  approveRatification,
  rejectRatification,
} from "../api/adminApi";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <PageHeader
        title="Admin"
        subtitle="Superuser controls — only visible to admin accounts"
      />
      <div className={styles.placeholder}>
        <p>Admin tools coming soon.</p>
      </div>
    </div>
  );
}