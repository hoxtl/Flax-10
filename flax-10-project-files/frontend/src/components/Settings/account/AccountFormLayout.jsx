/*
 * Presentational account form layout.
 */
import InlineAlert from "../../common/InlineAlert/InlineAlert";
import styles from "../../../pages/Settings/Settings.module.css";
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton } from "../SettingsUI";
import { PersonalInfoFields, YearField } from "./AccountInfoFields";
import CourseDisplay from "./CourseDisplay";

function AccountSidebarCard() {
  return (
    <SettingsContextCard
      emoji="🧾"
      title="Account setup"
      items={[
        "Accurate first and last name for your timetable display",
        "Correct year and course for relevant recommendations",
        "Email helps with secure access and notifications",
      ]}
    />
  );
}

function AccountFields(props) {
  const {
    formData,
    handleChange,
    currentCourse,
    pendingRequest,
    onRequestClick,
    onCancelRequest,
    cancellingRequest,
    courseRequestNotice,
    courseRequestError,
    isSaving,
    hasUnsaved,
    saveSignal,
  } = props;

  return <div><AccountPrimaryFields formData={formData} handleChange={handleChange} /><AccountCourseSection currentCourse={currentCourse} pendingRequest={pendingRequest} onRequestClick={onRequestClick} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} courseRequestNotice={courseRequestNotice} courseRequestError={courseRequestError} /><SubmitButton isSaving={isSaving} label="Save Changes" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} /></div>;
}

function AccountPrimaryFields({ formData, handleChange }) {
  return <><PersonalInfoFields formData={formData} onChange={handleChange} /><YearField value={formData.year} onChange={(event) => handleChange({ target: { name: "year", value: event.target.value } })} /></>;
}

function AccountCourseSection(props) {
  return <><CourseDisplay course={props.currentCourse} pendingRequest={props.pendingRequest} onRequestClick={props.onRequestClick} onCancelRequest={props.onCancelRequest} cancellingRequest={props.cancellingRequest} successMessage={props.courseRequestNotice ? `✓ ${props.courseRequestNotice}` : null} /><InlineAlert message={props.courseRequestError} variant="error" /></>;
}

export default function AccountFormLayout(props) {
  return (
    <form onSubmit={props.onSubmit} className={styles.form}>
      <SectionHeader title="Personal Information" description="Your profile details and current degree are shown everywhere across the app" />
      <div className={styles.twoColLayout}>
        <AccountFields {...props} />
        <AccountSidebarCard />
      </div>
    </form>
  );
}
