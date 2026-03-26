import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useTags } from "../../../context/TagContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function submitOnboarding(year, major) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE_URL}/onboarding/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Token ${token}` },
    body: JSON.stringify({ year, major }),
  });
  const current = JSON.parse(localStorage.getItem("user") || "{}");
  current.year = year;
  current.major = major;
  current.has_completed_onboarding = true;
  localStorage.setItem("user", JSON.stringify(current));
  window.dispatchEvent(new Event("auth-changed"));
}

function useOnboardingState() {
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  return { year, setYear, major, setMajor, confirmed, setConfirmed, loading, setLoading, done, setDone };
}

export default function useOnboarding() {
  const state = useOnboardingState();
  const { refreshProfile } = useAuth();
  const { refreshTags } = useTags();
  const { year, major, confirmed, setMajor, setConfirmed, setLoading, setDone } = state;
  const handleMajorChange = (val) => { setMajor(val); setConfirmed(false); };
  const handleSubmit = async () => {
    if (!year || !major || !confirmed) return;
    setLoading(true);
    await submitOnboarding(year, major).catch(() => {});
    await refreshProfile().catch(() => {});
    await refreshTags().catch(() => {});
    setLoading(false);
    setDone(true);
  };
  return { ...state, handleMajorChange, handleSubmit };
}
