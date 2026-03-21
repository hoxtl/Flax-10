/*
 * Timer feature file.
 */

export const initialState = (work = 25, breakTime = 5, sessions = 4) => ({
    workTime: work, breakTime, targetSessions: sessions, completedSessions: 0,
    timeLeft: work * 60, totalWork: 0, totalBreak: 0, totalPaused: 0,
    blockTotalWork: 0, blockTotalBreak: 0,
    isActive: false, isPaused: false, mode: 'work'
});

const tickState = (state) => {
    if (state.isPaused) return { ...state, totalPaused: state.totalPaused + 1 };
    const isWork = state.mode === 'work';
    return {
        ...state, timeLeft: state.timeLeft - 1,
        totalWork: isWork ? state.totalWork + 1 : state.totalWork,
        totalBreak: !isWork ? state.totalBreak + 1 : state.totalBreak,
        blockTotalWork: isWork ? (state.blockTotalWork || 0) + 1 : (state.blockTotalWork || 0),
        blockTotalBreak: !isWork ? (state.blockTotalBreak || 0) + 1 : (state.blockTotalBreak || 0)
    };
};

export const timerReducer = (state, action) => {
    switch (action.type) {
        case 'TICK': return tickState(state);
        case 'RESET': return initialState(state.workTime, state.breakTime, state.targetSessions);
        case 'SET_MODE': return { ...state, mode: action.payload };
        case 'SET_ACTIVE': return { ...state, isActive: action.payload, isPaused: false };
        case 'TOGGLE_PAUSE': return { ...state, isPaused: !state.isPaused };
        case 'SET_TIME_LEFT': return { ...state, timeLeft: action.payload };
        case 'SET_COMPLETED': return { ...state, completedSessions: action.payload, totalPaused: 0 };
        case 'UPDATE_SETTINGS': return { ...state, ...action.payload };
        default: return state;
    }
};
