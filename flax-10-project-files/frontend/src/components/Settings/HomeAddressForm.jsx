import { useState, useEffect } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import { getHomeAddress } from "../../api/userService";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import EmptyState from "../common/EmptyState/EmptyState";

export default function HomeAddressForm({ onSave, isSaving, error }) {
    const [homeAddress, setHomeAddress] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHomeAddress = async () => {
            try {
                const data = await getHomeAddress();
                setHomeAddress(data.home_address || "");
            } catch (err) {
                console.error("Failure to load user's home address: ", err);
            } finally {
                setLoading(false);
            }
        };
        loadHomeAddress();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(homeAddress);
    };

    if (loading) return <SectionSkeleton label="Loading home address" rows={1} />;

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Home Address</h2>
                <p className={styles.sectionDescription}>
                    View your home address on UniMap to plan your journey in advance!
                </p>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="homeAddress" className={styles.label}>
                    Address
                </label>
                <input
                  id="homeAddress"
                  type="text"
                  className={styles.input}
                  value={homeAddress}
                  onChange={e => setHomeAddress(e.target.value)}
                  placeholder="e.g., 123 Example Street, London E1 B23"
                  />
                  {error && (
                    <EmptyState
                      icon="⚠️"
                      title="Could not save address"
                      description={error}
                    />
                  )}
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSaving}>
                {isSaving ? "Saving address...": "Save Home Address"}
            </button>
        </form>
    );
}
