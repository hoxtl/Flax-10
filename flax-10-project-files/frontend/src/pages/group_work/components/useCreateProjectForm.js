import { useState } from "react";
import { createGroupProject } from "../api/groupWorkApi";

function resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting) {
  setForm({ name: "", course_code: "", deadline: "", members: [] });
  setErrors({});
  setErrorMessage("");
  setIsSubmitting(false);
}

function parseProjectDeadline(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function isPastProjectDeadline(value) {
  if (!value) return false;
  const deadline = parseProjectDeadline(value);
  const now = new Date();
  deadline.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return deadline.getTime() < now.getTime();
}

function addMemberToForm(prev, user) {
  const exists = prev.members.some((member) => String(member.id) === String(user.id));
  return exists ? prev : { ...prev, members: [...prev.members, user] };
}

function createChangeHandler({ setForm, setErrors, setErrorMessage }) {
  return (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    const error = key === "deadline" && isPastProjectDeadline(value)
      ? "Project due date can't be in the past."
      : "";
    setErrors((prev) => ({ ...prev, [key]: error }));
    setErrorMessage("");
  };
}

function createAddMemberHandler({ setForm, setErrors, setErrorMessage }) {
  return (user) => {
    if (!user?.id) return;
    setErrors((prev) => ({ ...prev, members: "" }));
    setErrorMessage("");
    setForm((prev) => addMemberToForm(prev, user));
  };
}

function createRemoveMemberHandler({ setForm, setErrors, setErrorMessage }) {
  return (userId) => {
    setErrors((prev) => ({ ...prev, members: "" }));
    setErrorMessage("");
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((member) => String(member.id) !== String(userId)),
    }));
  };
}

function validateProjectForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Project name is required.";
  if (!form.deadline) errors.deadline = "Due date is required.";
  else if (isPastProjectDeadline(form.deadline)) errors.deadline = "Project due date can't be in the past.";
  return errors;
}

function normaliseDeadline(value) {
  if (!value) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
}

function buildProjectPayload(form) {
  const payload = {
    name: form.name,
    deadline: normaliseDeadline(form.deadline),
    member_ids: form.members.map((member) => member.id),
  };
  const courseCode = String(form.course_code || "").trim();
  if (courseCode) payload.course_code = courseCode;
  return payload;
}

function showFormErrors(nextErrors, setErrors, setErrorMessage) {
  setErrors(nextErrors);
  setErrorMessage("Please fix the highlighted fields.");
}

function handleSubmitResult(created, { setIsSubmitting, onCreated, setForm, setErrors, setErrorMessage }) {
  if (!created) {
    setIsSubmitting(false);
    setErrorMessage("We couldn't create that project. Please try again.");
    return;
  }

  onCreated?.(created);
  resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting);
}

function createSubmitHandler({ form, setForm, setErrors, setErrorMessage, setIsSubmitting, onCreated }) {
  return async (event) => {
    event.preventDefault();
    const nextErrors = validateProjectForm(form);
    if (Object.keys(nextErrors).length > 0) {
      return showFormErrors(nextErrors, setErrors, setErrorMessage);
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const created = await createGroupProject(buildProjectPayload(form));
      handleSubmitResult(created, { setIsSubmitting, onCreated, setForm, setErrors, setErrorMessage });
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "We couldn't create that project. Please try again.");
    }
  };
}

export function useCreateProjectForm(onCreated) {
  const [form, setForm] = useState({ name: "", course_code: "", deadline: "", members: [] });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reset = () => resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting);
  const handlers = { setForm, setErrors, setErrorMessage };

  return {
    form,
    errors,
    errorMessage,
    isSubmitting,
    reset,
    change: createChangeHandler(handlers),
    addMember: createAddMemberHandler(handlers),
    removeMember: createRemoveMemberHandler(handlers),
    submit: createSubmitHandler({ ...handlers, setIsSubmitting, form, onCreated }),
  };
}
