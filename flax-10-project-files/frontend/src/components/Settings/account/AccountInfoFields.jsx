/*
 * Account profile fields for personal details.
 */
<<<<<<< HEAD

import styles from "../../../pages/settings/Settings.module.css";
=======
import styles from "../../../pages/Settings/Settings.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { FormInput, FormSelect } from "../SettingsUI";
import { YEAR_OPTIONS } from "./accountFormConfig";

export function PersonalInfoFields({ formData, onChange }) {
  return (
    <>
      <div className={styles.formRow}>
        <FormInput id="firstName" name="firstName" label="First Name" value={formData.firstName} onChange={onChange} required autoComplete="given-name" />
        <FormInput id="lastName" name="lastName" label="Last Name" value={formData.lastName} onChange={onChange} required autoComplete="family-name" />
      </div>
      <FormInput id="email" label="Email Address" type="email" value={formData.email} onChange={onChange} required autoComplete="email" />
    </>
  );
}

export function YearField({ value, onChange }) {
  return (
    <div className={styles.formRow}>
      <FormSelect id="year" label="Year" value={value} onChange={onChange} options={YEAR_OPTIONS} />
    </div>
  );
}
