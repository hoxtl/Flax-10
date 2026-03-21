import { createContext, useContext, useState, useCallback } from 'react';
<<<<<<< HEAD
import ConfirmModal from '../components/common/confirm_modal/ConfirmModal';
=======
import ConfirmModal from '../components/common/ConfirmModal/ConfirmModal';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
