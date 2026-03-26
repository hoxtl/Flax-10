import StandardModal from "../../../components/common/standard_modal/StandardModal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import { CreateProjectInputs } from "./CreateProjectInputs";
import { useEditProjectForm } from "./useEditProjectForm";
import styles from "./CreateProjectForm.module.css";

export default function EditProjectModal({ project, onUpdated, onClose }) {
    const { form, errorMessage, isSubmitting, change, submit } = useEditProjectForm(project, (updated) => {
        onUpdated?.(updated);
        onClose();
    });

    return (
        <StandardModal title="Project Settings" onClose={onClose} size="lg">
            <EditProjectForm form={form} errorMessage={errorMessage} isSubmitting={isSubmitting} onChange={change} onSubmit={submit} onClose={onClose} />
        </StandardModal>
    );
}

function EditProjectForm({ form, errorMessage, isSubmitting, onChange, onSubmit, onClose }) {
    return (
        <form onSubmit={onSubmit} className={styles.modalForm}>
            <div className={styles.formFields}>
                <CreateProjectInputs data={form} onChange={onChange} errors={{}} />
            </div>
            {errorMessage && <p className={styles.formError}>{errorMessage}</p>}
            <EditProjectActions onClose={onClose} isSubmitting={isSubmitting} />
        </form>
    );
}

function EditProjectActions({ onClose, isSubmitting }) {
    return (
        <div className={styles.formFooter}>
            <PrimaryButton type="button" variant="secondary" pill onClick={onClose} disabled={isSubmitting}>
                Cancel
            </PrimaryButton>
            <PrimaryButton type="submit" pill disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
            </PrimaryButton>
        </div>
    );
}
