import { useState, useEffect } from "react";
import styles from "../../pages/Settings/Settings.module.css";
import { getHomeAddress } from "../../api/userService";


export default function HomeAddressForm({ onSave, isSaving, error }) {
    const [homeAddress, setHomeAddress] = useState("");
    const [loading, setLoading] = useState(true);
}