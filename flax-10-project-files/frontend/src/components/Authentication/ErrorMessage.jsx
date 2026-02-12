import React from "react";

/**
 * Component to display field error messages
 */

export const ErrorMessage = ({ error }) => {
    if (!error) return null;

    return (
        <div style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroound: "ff4444",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            zIndex: 1000,
            maxWidth: "400px",
            textAlign: "center"
        }}>
            {error}
        </div>
    );
};