import { useState, useEffect } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import { getHomeAddress } from "../../api/userService";


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
}