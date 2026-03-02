import { useState, useEffect } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import { getHomeAddress } from "../../api/userService";

export default function HomeAddressForm({ onSave, isSaving, error }) {
    console.log('🏠 HomeAddressForm component loaded');
    console.log('🏠 Props:', { onSave: !!onSave, isSaving, error });
    
    const [homeAddress, setHomeAddress] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🏠 useEffect running...');
        
        const loadHomeAddress = async () => {
            try {
                console.log('🏠 Calling getHomeAddress...');
                const data = await getHomeAddress();
                console.log('🏠 Got data:', data);
                setHomeAddress(data.home_address || "");
            } catch (err) {
                console.error("🏠 Error loading home address:", err);
                setHomeAddress("");
            } finally {
                console.log('🏠 Setting loading to false');
                setLoading(false);
            }
        };
        
        loadHomeAddress();
    }, []);

    console.log('🏠 Current state:', { loading, homeAddress });

    if (loading) {
        console.log('🏠 Rendering loading state');
        return <div className={styles.loading}>Loading...</div>;
    }

    console.log('🏠 Rendering form');
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(homeAddress); }} className={styles.form}>
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
                {error && <p className={styles.error}>{error}</p>}
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSaving}>
                {isSaving ? "Saving address..." : "Save Home Address"}
            </button>
        </form>
    );
}