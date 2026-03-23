/*
 * Account-form state management and request loading.
 */

import { useEffect, useState } from "react";
import { getMyCourseChangeRequest } from "../../../api/adminApi";
import { useAuth } from "../../../context/AuthContext";
import {
  clearCachedPendingRequest,
  getCachedPendingRequest,
  normaliseCourseRequest,
  setCachedPendingRequest,
} from "./accountCourseRequests";
import { getInitialAccountData } from "./accountFormConfig";

function useSafeAuth(externalUser) {
  try {
    return useAuth();
  } catch {
    return { profile: externalUser, loading: false, refreshProfile: () => {} };
  }
}

function useEffectiveProfile(externalUser) {
  const auth = useSafeAuth(externalUser);
  const profile = externalUser || auth.profile;
  const loading = externalUser ? false : auth.loading;
  return { profile, loading, refreshProfile: auth.refreshProfile };
}

function syncProfileState(profile, setFormData, setInitialFormData, setCurrentCourse) {
  const nextData = getInitialAccountData(profile);
  setFormData(nextData);
  setInitialFormData(nextData);
  setCurrentCourse(profile.major || "");
}

function useProfileSync(profile, loading, setFormData, setInitialFormData, setCurrentCourse) {
  useEffect(() => {
    if (!loading && profile) syncProfileState(profile, setFormData, setInitialFormData, setCurrentCourse);
  }, [profile, loading, setFormData, setInitialFormData, setCurrentCourse]);
}

function usePendingRequest(setPendingRequest) {
  useEffect(() => {
    getMyCourseChangeRequest()
      .then(normaliseCourseRequest)
      .then((request) => applyPendingRequest(request, setPendingRequest))
      .catch(() => setPendingRequest(getCachedPendingRequest()));
  }, [setPendingRequest]);
}

function applyPendingRequest(request, setPendingRequest) {
  if (!request) return setPendingRequest(getCachedPendingRequest());
  if (request.status !== "pending") return clearPendingRequest(setPendingRequest);
  setPendingRequest(request);
  if (request.requested_course) setCachedPendingRequest(request.requested_course);
}

function clearPendingRequest(setPendingRequest) {
  clearCachedPendingRequest();
  setPendingRequest(null);
}

export default function useAccountFormState(externalUser) {
  const { profile, loading, refreshProfile } = useEffectiveProfile(externalUser);
  const initialData = getInitialAccountData(profile);
  const state = useAccountState(initialData, profile?.major || "");

  useProfileSync(
    profile,
    loading,
    state.setFormData,
    state.setInitialFormData,
    state.setCurrentCourse,
  );
  usePendingRequest(state.setPendingRequest);
  return buildAccountFormState(state, refreshProfile);
}

function useAccountState(initialData, course) {
  const [formData, setFormData] = useState(initialData);
  const [initialFormData, setInitialFormData] = useState(initialData);
  const [currentCourse, setCurrentCourse] = useState(course);
  const [pendingRequest, setPendingRequest] = useState(null);
  return { formData, setFormData, initialFormData, setInitialFormData, currentCourse, setCurrentCourse, pendingRequest, setPendingRequest };
}

function buildAccountFormState(state, refreshProfile) {
  return {
    formData: state.formData,
    initialFormData: state.initialFormData,
    setInitialFormData: state.setInitialFormData,
    handleChange: createHandleChange(state.setFormData),
    currentCourse: state.currentCourse,
    pendingRequest: state.pendingRequest,
    setPendingRequest: state.setPendingRequest,
    refreshProfile,
  };
}

function createHandleChange(setFormData) {
  return (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };
}
