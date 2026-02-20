import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function submitOnboarding(year, major) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE_URL}/onboarding/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Token ${token}` },
    body: JSON.stringify({ year, major }),
  });
}

export default function useOnboarding() {
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleMajorChange = (val) => { setMajor(val); setConfirmed(false); };

  const handleSubmit = async () => {
    if (!year || !major || !confirmed) return;
    setLoading(true);
    await submitOnboarding(year, major).catch(console.error);
    setLoading(false);
    setDone(true);
  };

  return { year, setYear, major, handleMajorChange, confirmed, setConfirmed, loading, done, handleSubmit };
}