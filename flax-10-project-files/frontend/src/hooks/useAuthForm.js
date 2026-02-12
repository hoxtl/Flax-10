import { useState } from "react";

/**
 * Hook to handle authentication form state when a field is changed
 */

export const useAuthForm = (initialState) => {
    const [formData, setFormData] = useState(initialState);

    const updateField = (field) => (e) => {
        setFormData({...formData, [field]: e.target.value});
    };

    const resetForm = () => {setFormData(initialState);};

    return {formData, setFormData, updateField, resetForm};
};