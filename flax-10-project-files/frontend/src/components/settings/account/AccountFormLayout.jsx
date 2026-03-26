/*
 * Presentational account form layout.
 */
<<<<<<< HEAD

import InlineAlert from "../../common/inline_alert/InlineAlert";
import styles from "../../../pages/settings/Settings.module.css";
=======
import InlineAlert from "../../common/InlineAlert/InlineAlert";
import styles from "../../../pages/Settings/Settings.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton } from "../SettingsUI";
import { PersonalInfoFields, YearField } from "./AccountInfoFields";
import CourseDisplay from "./CourseDisplay";

function AccountSidebarCard() {
  return (
    <SettingsContextCard
      emoji="🧾"
      title="Account setup"
<<<<<<< HEAD
=======
      body="Keep your profile updated for a personalised experience."
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
    isTeacher,
  } = props;

  return <div><AccountPrimaryFields formData={formData} handleChange={handleChange} isTeacher={isTeacher} />{!isTeacher && <AccountCourseSection currentCourse={currentCourse} pendingRequest={pendingRequest} onRequestClick={onRequestClick} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} courseRequestNotice={courseRequestNotice} courseRequestError={courseRequestError} />}<SubmitButton isSaving={isSaving} label="Save Changes" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} /></div>;
}

function AccountPrimaryFields({ formData, handleChange, isTeacher }) {
  return <><PersonalInfoFields formData={formData} onChange={handleChange} />{!isTeacher && <YearField value={formData.year} onChange={(event) => handleChange({ target: { name: "year", value: event.target.value } })} />}</>;
=======
  } = props;

  return <div><AccountPrimaryFields formData={formData} handleChange={handleChange} /><AccountCourseSection currentCourse={currentCourse} pendingRequest={pendingRequest} onRequestClick={onRequestClick} onCancelRequest={onCancelRequest} cancellingRequest={cancellingRequest} courseRequestNotice={courseRequestNotice} courseRequestError={courseRequestError} /><SubmitButton isSaving={isSaving} label="Save Changes" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} /></div>;
}

function AccountPrimaryFields({ formData, handleChange }) {
  return <><PersonalInfoFields formData={formData} onChange={handleChange} /><YearField value={formData.year} onChange={(event) => handleChange({ target: { name: "year", value: event.target.value } })} /></>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function AccountCourseSection(props) {
  return <><CourseDisplay course={props.currentCourse} pendingRequest={props.pendingRequest} onRequestClick={props.onRequestClick} onCancelRequest={props.onCancelRequest} cancellingRequest={props.cancellingRequest} successMessage={props.courseRequestNotice ? `✓ ${props.courseRequestNotice}` : null} /><InlineAlert message={props.courseRequestError} variant="error" /></>;
}

export default function AccountFormLayout(props) {
  return (
    <form onSubmit={props.onSubmit} className={styles.form}>
      <SectionHeader title="Personal Information" description="Your profile details and current degree are shown everywhere across the app" />
      <div className={styles.twoColLayout}>
<<<<<<< HEAD
        <AccountFields {...props} isTeacher={props.isTeacher} />
=======
        <AccountFields {...props} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        <AccountSidebarCard />
      </div>
    </form>
  );
}
