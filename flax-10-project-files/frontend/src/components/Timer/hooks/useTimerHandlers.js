/*
 * Timer feature file.
 */

export function useTimerHandlers(t, modal, setModal, startNext, resetBlockId, endEarly) {
    return {
        break: () => {
            t.setIsActive(false); setModal(null);
            if (t.completedSessions + 1 >= t.targetSessions) {
                t.setTimeLeft(t.workTime * 60);
                return startNext();
            }
            t.setMode('break'); t.setTimeLeft(t.breakTime * 60); t.setIsActive(true);
        },
        goal: () => { t.resetTimer(); setModal(null); resetBlockId(); },
        overtimeBreak: () => { t.setIsActive(false); startNext(); },
        autoBreakDone: () => { t.setIsActive(false); startNext(); },
        endEarly: () => { endEarly(); }
    };
}
