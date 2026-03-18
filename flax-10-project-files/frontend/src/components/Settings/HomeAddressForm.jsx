import { useState, useEffect } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import { getHomeAddress } from "../../api/userService";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import EmptyState from "../common/EmptyState/EmptyState";
import { LocationAutocomplete } from "../Calendar/EventModal/components/LocationAutoComplete";
import TextInput from "../common/TextInput/TextInput";
import InlineAlert from "../common/InlineAlert/InlineAlert";
import { SectionHeader, SubmitButton, FormField } from "./SettingsUI";

export default function HomeAddressForm({ onSave, isSaving, error }) {
  const [homeAddress, setHomeAddress] = useState("");
  const [initialHomeAddress, setInitialHomeAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveSignal, setSaveSignal] = useState(0);

  useEffect(() => {
    getHomeAddress()
      .then((data) => {
        const address = data.home_address || "";
        setHomeAddress(address);
        setInitialHomeAddress(address);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const hasUnsaved = homeAddress !== initialHomeAddress;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSave(homeAddress);
    if (ok) {
      setInitialHomeAddress(homeAddress);
      setSaveSignal((s) => s + 1);
    }
  };

  if (loading) return <SectionSkeleton label="Loading home address" rows={1} />;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <SectionHeader
        title="Home Address"
        description="Used to calculate your commute time to KCL campuses 🏠"
      />

      <div className={styles.twoColLayout}>
        <div>
          <div className={styles.settingsTile}>
            <div className={styles.formGroup}>
              <label htmlFor="homeAddress" className={styles.label}>
                Address
              </label>
              <LocationAutocomplete
                value={homeAddress}
                onChange={setHomeAddress}
                placeholder="e.g., 123 Example Street, London, E1 B23"
              />
              {error && (
                <EmptyState
                  icon="⚠️"
                  title="Could not save address"
                  description={error}
                />
              )}
            </div>
            <SubmitButton
              isSaving={isSaving}
              label="Save Home Address"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </div>
          <InlineAlert message={error} variant="warning" />
        </div>
        <div className={styles.contextCard}>
          <span className={styles.contextCardEmoji}>🗺️</span>
          <h3 className={styles.contextCardTitle}>Why we ask</h3>
          <p className={styles.contextCardBody}>
            Your address lets us calculate real commute times to KCL campuses — no more surprise 45-minute journeys to a 9am.
          </p>
          <ul className={styles.contextCardList}>
            <li>Commute time estimates</li>
            <li>Campus proximity info</li>
            <li>Smart travel alerts</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
