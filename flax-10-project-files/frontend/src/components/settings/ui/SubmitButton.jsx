/*
 * Submit button with transient saved-state feedback.
 */

import styles from "../../../pages/settings/styles/Settings.module.css";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import { useTransientSavedState } from "../../common/hooks/useTransientSavedState";

function getButtonClassName(hasUnsaved, isSaving, showSaved) {
  const needsSave = hasUnsaved && !isSaving && !showSaved;
  return [
    styles.btnPrimary,
    needsSave ? styles.btnPrimaryNeedsSave : "",
    showSaved ? styles.btnPrimarySaved : "",
  ].join(" ");
}

function getButtonLabel(isSaving, showSaved, label, savingLabel, savedLabel) {
  if (isSaving) return savingLabel;
  if (showSaved) return `✓ ${savedLabel}`;
  return label;
}

function SubmitActionButton({ isSaving, className, buttonLabel }) {
  return <PrimaryButton type="submit" className={className} disabled={isSaving} pill>{buttonLabel}</PrimaryButton>;
}

export default function SubmitButton(props) {
  const { isSaving, label, savingLabel, hasUnsaved = false, saveSignal = 0, savedLabel = "Saved!" } = props;
  const showSaved = useTransientSavedState(saveSignal);
  const className = getButtonClassName(hasUnsaved, isSaving, showSaved);
  const buttonLabel = getButtonLabel(isSaving, showSaved, label, savingLabel, savedLabel);

  return (
    <div className={styles.formActions}>
      <SubmitActionButton isSaving={isSaving} className={className} buttonLabel={buttonLabel} />
    </div>
  );
}
