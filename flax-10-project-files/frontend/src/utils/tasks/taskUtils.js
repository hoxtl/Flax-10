export function normalizeItem(x) {
  return {
    id: x?.id ?? crypto.randomUUID(),
    title: typeof x?.title === "string" ? x.title : "",
    done: !!x?.done,
    urgent: !!x?.urgent,
    completedAt: typeof x?.completedAt === "number" ? x.completedAt : null,
  };
}

export function pinUrgentFirst(activeList) {
  const urgent = activeList.filter((t) => t.urgent);
  const others = activeList.filter((t) => !t.urgent);
  return [...urgent, ...others];
}

export function createNewTask(title) {
  return {
    id: crypto.randomUUID(),
    title,
    done: false,
    urgent: false,
    completedAt: null,
  };
}