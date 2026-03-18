import React from 'react';
import styles from './BackButton.module.css';

/**
 * Standard BackButton component used across the application.
 * Style is based on the Groupwork implementation.
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Function to call when clicked
 * @param {string} props.label - Text to display (default: "Back")
 * @param {string} [props.className] - Additional class names
 */
export default function BackButton({ onClick, label = "Back", className = "" }) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className={`${styles.backButton} ${className}`}
      aria-label={label}
    >
      <span className={styles.arrow}>←</span>
      <span>{label}</span>
    </button>
  );
}
