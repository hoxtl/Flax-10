import { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/Common/ConfirmModal/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [state, setState] = useState({ isOpen: false });

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setState({ isOpen: true, ...options, resolve });
        });
    }, []);

    const onConfirm = () => { state.resolve?.(state.confirmValue ?? true); setState({ isOpen: false }); };
    const onAlternate = () => { state.resolve?.(state.alternateValue ?? 'ALTERNATE'); setState({ isOpen: false }); };
    const onCancel = () => { state.resolve?.(state.cancelValue ?? false); setState({ isOpen: false }); };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state.isOpen && <ConfirmModal {...state} onConfirm={onConfirm} onAlternate={onAlternate} onCancel={onCancel} />}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    return useContext(ConfirmContext);
}
