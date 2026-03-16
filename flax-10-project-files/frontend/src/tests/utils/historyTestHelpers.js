import { screen } from '@testing-library/react';

const currentYear = new Date().getFullYear();

export const mockHistoryData = [
    {
        id: 1, date: `${currentYear}-01-01T12:00:00Z`, startTime: `${currentYear}-01-01T12:00:00Z`, endTime: `${currentYear}-01-01T12:25:00Z`,
        duration: 25, breakDuration: 5, sessionCount: 1, studyBlockId: 'block_1', status: 'Completed'
    },
    {
        id: 2, date: `${currentYear}-01-01T12:30:00Z`, startTime: `${currentYear}-01-01T12:30:00Z`, endTime: `${currentYear}-01-01T12:55:00Z`,
        duration: 25, breakDuration: 0, sessionCount: 2, studyBlockId: 'block_1', status: 'Completed'
    },
    {
        id: 3, date: `${currentYear}-01-02T14:30:00Z`, startTime: `${currentYear}-01-02T14:00:00Z`, endTime: `${currentYear}-01-02T14:30:00Z`,
        duration: 30, breakDuration: 0, studyBlockId: 'block_2', status: 'Completed'
    },
    {
        id: 4, date: `${currentYear}-01-03T10:00:00Z`, duration: 60, status: 'Completed' // Legacy
    }
];

export const expectBlock1Summary = () => {
    // 50m Focus, 5m Break, 2 Sessions
    expect(screen.getByText(/50m Focus/)).toBeInTheDocument();
    expect(screen.getByText(/5m Break/)).toBeInTheDocument();
    expect(screen.getByText(/2 Sessions/)).toBeInTheDocument();
};

export const expectBlock2Summary = () => {
    // 30m Focus, 1 Session
    expect(screen.getByText(/30m Focus/)).toBeInTheDocument();
};

export const expectLegacyBlockSummary = () => {
    // 60m Focus, 1 Session
    expect(screen.getByText(/60m Focus/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
};

export const expectDatesPresent = () => {
    expect(screen.getByText(/Jan 1/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 2/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 3/)).toBeInTheDocument();
};

export const expectSessionCounts = () => {
    const singleSessionPills = screen.getAllByText(/1 Session$/); // Use $ or exact to avoid catching '1 Sessions' if it still exists somehow, but regex /1 Session/ works
    expect(singleSessionPills).toHaveLength(2);
};
