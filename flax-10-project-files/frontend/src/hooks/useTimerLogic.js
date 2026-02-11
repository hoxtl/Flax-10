import { useTimer } from './useTimer';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from './timerUtils';

export function useTimerLogic() {
    const t = useTimer();
    const { modal, setModal, startNext } = useTimerFlow(t);
    const handlers = useTimerHandlers(t, modal, setModal, startNext);
    const ot = t.timeLeft < 0;

    return {
        ...t, modal, handlers, progress: getProgress(t),
        isOvertime: t.mode === 'work' && ot, isBreakOvertime: t.mode === 'break' && ot
    };
}
