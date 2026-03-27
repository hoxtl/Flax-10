import { useState } from "react";
import { patchGroupProject } from "../api/groupWorkApi";

function validateForm(form) {
    if (!form.name.trim()) return "Project name is required.";
    if (!form.deadline) return "Due date is required.";
    return "";
}

function createSubmitHandler({ project, form, setErrorMessage, setIsSubmitting, onUpdated }) {
    return async (e) => {
        e.preventDefault();
        const error = validateForm(form);
        if (error) return setErrorMessage(error);
        setIsSubmitting(true);
        let res;
        try {
            res = await patchGroupProject(project.id, form);
        } catch (err) {
            setErrorMessage(err.message || "Failed to update project.");
        } finally {
            setIsSubmitting(false);
        }
        if (res) onUpdated?.(res);
    };
}

export function useEditProjectForm(project, onUpdated) {
    const [form, setForm] = useState({
        name: project.name || "",
        course_code: project.course_code || "",
        deadline: project.deadline || "",
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const change = (key, value) => setForm((p) => ({ ...p, [key]: value }));
    const handlers = { project, form, setErrorMessage, setIsSubmitting, onUpdated };
    const submit = createSubmitHandler(handlers);

    return { form, errorMessage, isSubmitting, change, submit };
}
