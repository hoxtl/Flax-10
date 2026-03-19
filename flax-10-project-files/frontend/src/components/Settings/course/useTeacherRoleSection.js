/*
 * Teacher-role state and event handlers.
 */
import { useEffect, useState } from "react";
import { cancelTeacherRoleRequest } from "../../../api/adminApi";
import { useAuth } from "../../../context/AuthContext";
import {
  clearCachedTeacherRequest,
  getCachedTeacherRequest,
  setCachedTeacherRequest,
} from "./teacherRequestCache";

function useTeacherRoleState() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [teacherNotice, setTeacherNotice] = useState(() => (getCachedTeacherRequest() ? "Request sent." : ""));
  return { status, setStatus, message, setMessage, cancelling, setCancelling, showModal, setShowModal, teacherNotice, setTeacherNotice };
}

function usePendingTeacherNotice(profile, loading, setTeacherNotice) {
  useEffect(() => {
    if (!loading && profile?.role === "pending_teacher") {
      setCachedTeacherRequest();
      setTeacherNotice("Request sent.");
    }
  }, [profile, loading, setTeacherNotice]);
}

function createApplySuccessHandler(state, refreshProfile) {
  return (response) => {
    state.setMessage(response?.message || "Request submitted!");
    state.setStatus("done");
    refreshProfile();
    setCachedTeacherRequest();
    state.setTeacherNotice("Request sent.");
    state.setShowModal(false);
  };
}

function createCancelTeacherHandler(state, refreshProfile) {
  return async () => {
    state.setCancelling(true);
    try {
      await cancelTeacherRoleRequest();
      refreshProfile();
      state.setStatus(null);
      clearCachedTeacherRequest();
      state.setTeacherNotice("");
    } catch (error) {
      state.setMessage(error.message || "Failed to cancel.");
      state.setStatus("error");
    } finally {
      state.setCancelling(false);
    }
  };
}

export default function useTeacherRoleSection() {
  const { profile, loading, refreshProfile } = useAuth();
  const state = useTeacherRoleState();
  usePendingTeacherNotice(profile, loading, state.setTeacherNotice);
  return {
    profile,
    loading,
    status: state.status,
    message: state.message,
    cancelling: state.cancelling,
    showModal: state.showModal,
    setShowModal: state.setShowModal,
    teacherNotice: state.teacherNotice,
    handleApplySuccess: createApplySuccessHandler(state, refreshProfile),
    handleCancelTeacher: createCancelTeacherHandler(state, refreshProfile),
  };
}
