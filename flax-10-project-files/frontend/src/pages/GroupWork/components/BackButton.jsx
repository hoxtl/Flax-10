import React from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.css";

export default function BackButton({ onClick, children = "Back to all projects" }) {
    return (
        <button onClick={onClick} className={styles.backButton}>
            <ChevronLeft size={16} />
            {children}
        </button>
    );
}
