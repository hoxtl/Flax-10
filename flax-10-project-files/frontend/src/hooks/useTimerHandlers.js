export function useTimerHandlers(t, modal, setModal, startNext) {
    return {
        break: () => {
            t.setIsActive(false); setModal(null);
            t.setMode('break'); t.setTimeLeft(t.breakTime * 60); t.setIsActive(true);
        },
        goal: () => { t.resetTimer(); setModal(null); },
        overtimeBreak: () => { t.setIsActive(false); startNext(); }
    };
}
