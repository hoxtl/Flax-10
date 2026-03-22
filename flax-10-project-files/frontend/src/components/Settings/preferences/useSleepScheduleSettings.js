/*
 * Sleep-schedule state loading and save tracking.
 */
import { useEffect, useState } from "react";
import { getUserSettings } from "../../../api/user/userApi";

function applySleepSettings(data, setters) {
  if (data?.sleep_time) setters.setSleep(data.sleep_time.slice(0, 5));
  if (data?.wake_time) setters.setWake(data.wake_time.slice(0, 5));
}

function useSleepState() {
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [initialSleepTime, setInitialSleepTime] = useState("23:00");
  const [initialWakeTime, setInitialWakeTime] = useState("07:00");
  return { sleepTime, setSleepTime, wakeTime, setWakeTime, initialSleepTime, setInitialSleepTime, initialWakeTime, setInitialWakeTime };
}

function createSleepSetters(state) {
  return { setSleep: (value) => syncSleepValue(state, value), setWake: (value) => syncWakeValue(state, value) };
}

function syncSleepValue(state, value) {
  state.setSleepTime(value);
  state.setInitialSleepTime(value);
}

function syncWakeValue(state, value) {
  state.setWakeTime(value);
  state.setInitialWakeTime(value);
}

function useSleepLoader(state, setLoading) {
  useEffect(() => {
    getUserSettings().then((data) => applySleepSettings(data, createSleepSetters(state))).finally(() => setLoading(false));
  }, []);
}

function useSleepStatus(state) {
  const [loading, setLoading] = useState(true);
  const [saveSignal, setSaveSignal] = useState(0);
  const markSaved = () => {
    state.setInitialSleepTime(state.sleepTime);
    state.setInitialWakeTime(state.wakeTime);
    setSaveSignal((count) => count + 1);
  };
  return { loading, setLoading, saveSignal, markSaved };
}

function buildSleepSettings(state, status) {
  return {
    sleepTime: state.sleepTime,
    setSleepTime: state.setSleepTime,
    wakeTime: state.wakeTime,
    setWakeTime: state.setWakeTime,
    loading: status.loading,
    saveSignal: status.saveSignal,
    hasUnsavedSleep: state.sleepTime !== state.initialSleepTime || state.wakeTime !== state.initialWakeTime,
    markSaved: status.markSaved,
  };
}

export default function useSleepScheduleSettings() {
  const state = useSleepState();
  const status = useSleepStatus(state);
  useSleepLoader(state, status.setLoading);
  return buildSleepSettings(state, status);
}
