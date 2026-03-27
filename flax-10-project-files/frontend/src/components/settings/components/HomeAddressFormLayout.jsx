/*
 * Presentational layout for the home-address form.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/components/settings/components/HomeAddressFormLayout.jsx
import { LocationAutocomplete } from "../../calendar/event_modal/components/LocationAutoComplete";
import InlineAlert from "../../common/inline_alert/InlineAlert";
import styles from "../../../pages/settings/styles/Settings.module.css";
=======
import { LocationAutocomplete } from "../calendar/event_modal/components/LocationAutoComplete";
import InlineAlert from "../common/inline_alert/InlineAlert";
import styles from "../../pages/settings/Settings.module.css";
>>>>>>> main:flax-10-project-files/frontend/src/components/settings/HomeAddressFormLayout.jsx
import SettingsContextCard from "./SettingsContextCard";
import { SectionHeader, SubmitButton } from "./SettingsUI";

function isLookupMiss(error) {
  return `${error}`.toLowerCase().startsWith("address not found");
}

function AddressField({ homeAddress, setHomeAddress, error, isSaving, hasUnsaved, saveSignal }) {
  const showInlineError = error && !isLookupMiss(error);

  return (
    <div>
      <div className={styles.formGroup}>
        <label htmlFor="homeAddress" className={styles.label}>Address</label>
        <LocationAutocomplete value={homeAddress} onChange={setHomeAddress} placeholder="e.g., 123 Example Street, London, E1 B23" />
        {showInlineError ? <InlineAlert message={error} variant="warning" /> : null}
      </div>
      <SubmitButton isSaving={isSaving} label="Save Home Address" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
    </div>
  );
}

export default function HomeAddressFormLayout(props) {
  return (
    <form onSubmit={props.onSubmit} className={styles.form}>
      <SectionHeader title="Home Address" description="Used to calculate your commute time to KCL campuses 🏠" />
      <div className={styles.twoColLayout}>
        <AddressField {...props} />
        <SettingsContextCard emoji="🗺️" title="Why we ask" body="Your address lets us calculate real commute times to KCL campuses — no more surprise 45-minute journeys to a 9am." items={["Commute time estimates", "Campus proximity info", "Smart travel alerts"]} />
      </div>
    </form>
  );
}
