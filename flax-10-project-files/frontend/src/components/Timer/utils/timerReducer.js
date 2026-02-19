export const initialState = (work = 25, breakTime = 5, sessions = 4) => ({
    workTime: work, breakTime, targetSessions: sessions, completedSessions: 0,
    timeLeft: work * 60, totalWork: 0, totalBreak: 0, isActive: false, mode: 'work'
});

const tickState = (state) => {
    const isWork = state.mode === 'work';
    return {
        ...state, timeLeft: state.timeLeft - 1,
        totalWork: isWork ? state.totalWork + 1 : state.totalWork,
        totalBreak: !isWork ? state.totalBreak + 1 : state.totalBreak
    };
};

export const timerReducer = (state, action) => {
    switch (action.type) {
        case 'TICK': return tickState(state);
        case 'RESET': return initialState(state.workTime, state.breakTime, state.targetSessions);
        case 'SET_MODE': return { ...state, mode: action.payload };
        case 'SET_ACTIVE': return { ...state, isActive: action.payload };
        case 'SET_TIME_LEFT': return { ...state, timeLeft: action.payload };
        case 'SET_COMPLETED': return { ...state, completedSessions: action.payload };
        case 'UPDATE_SETTINGS': return { ...state, ...action.payload };
        default: return state;
    }
};
