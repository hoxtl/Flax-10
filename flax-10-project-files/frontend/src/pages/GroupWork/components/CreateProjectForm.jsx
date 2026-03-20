import React, { useState } from "react";
import Card from "../../../components/common/Card/Card";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { CreateProjectInputs } from "./CreateProjectInputs";
import styles from "./CreateProjectForm.module.css";

export default function CreateProjectForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", course_code: "", deadline: "" });
  
  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  
  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("/api/group-work/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onCreated(await res.json());
      setForm({ name: "", course_code: "", deadline: "" });
    }
  };

  return (
    <Card className={styles.formCard} padding="sm">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>NEW PROJECT</h3>
        <div className={styles.sectionLine} />
      </div>
      <form onSubmit={submit} className={styles.createProjectForm}>
        <CreateProjectInputs data={form} onChange={change} />
        <div className={styles.formFooter}>
          <PrimaryButton type="submit" className={styles.submitBtn} pill>+ Create project</PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
