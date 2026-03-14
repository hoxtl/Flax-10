import { useState, useEffect } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import { getHomeAddress } from "../../api/userService";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import TextInput from "../common/TextInput/TextInput";
import { SectionHeader, SubmitButton } from "./SettingsUI";

export default function HomeAddressForm({ onSave, isSaving, error }) {
    const [homeAddress, setHomeAddress] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHomeAddress()
            .then((data) => setHomeAddress(data.home_address || ""))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(homeAddress);
    };

    if (loading) return <SectionSkeleton label="Loading home address" rows={1} />;

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <SectionHeader
                title="Home Address"
                description="Used to calculate your commute time to KCL campuses 🏠"
            />

            <div className={styles.twoColLayout}>
                <div className={styles.formGroup}>
                    <label htmlFor="homeAddress">Address</label>
                    <TextInput
                        id="homeAddress"
                        type="text"
                        value={homeAddress}
                        onChange={e => setHomeAddress(e.target.value)}
                        placeholder="e.g., 123 Example Street, London E1 B23"
                    />
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

            {error && (
                <div className={styles.errorMessage} role="alert">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <SubmitButton isSaving={isSaving} label="Save Home Address" savingLabel="Saving..." />
        </form>
    );
}
