
const DEFAULT_PAGE_TIME = 2.0;

function getTotalPagesAndMinutes(tasks) {
    let totalPages = 0;
    let totalMinutes = 0;
    for (const t of tasks) {
        totalPages += t.reading_page_count ?? t.page_count ?? 0;
        totalMinutes += t.time_spent_minutes;
    }
    return {pages: totalPages, minutes: totalMinutes};
}

export function getAvgMinPerPage(tasks) {
    const done = tasks.filter(
        t => t.completed && t.time_spent_minutes > 0 && (t.reading_id || t.page_count)
    );
    const {pages, minutes} = getTotalPagesAndMinutes(done)
    return pages === 0 ? DEFAULT_PAGE_TIME : minutes/pages;
}

export function recalculatePendingBlocks(tasks) {
    const avg = getAvgMinPerPage(tasks);
    return tasks.map((task) => {
        if (task.completed) return task;
        const pages = task.reading_page_count ?? task.page_count ?? null;
        if (!pages) return task;
        return {...task, estimated_blocks: Math.max(1, Math.ceil((pages*avg)/25))};
    });
}