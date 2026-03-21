/*
 * Timer feature file.
 */

import { splitEstimatedBlocks } from '../../../lib/focusPlanner';

export function inferTaskType(title = '') {
    const text = String(title || '').toLowerCase();
    if (/(lab|report|code|project|thesis|dissertation|build)/.test(text)) return 'lab';
    if (/(problem|exercise|worksheet|practice|quiz|pset|questions)/.test(text)) return 'problem';
    if (/(read|chapter|paper|article|review|notes|lecture|literature)/.test(text)) return 'reading';
    return 'general';
}

export const BUILT_IN_PRESETS = [
    { id: 'pomodoro',  label: 'Pomodoro',  work: 25, brk: 5,  sessions: 4 },
    { id: 'sprint',    label: 'Sprint',    work: 15, brk: 3,  sessions: 4 },
    { id: 'evening',   label: 'Evening',   work: 45, brk: 15, sessions: 2 },
    { id: 'ultradian', label: 'Ultradian', work: 90, brk: 20, sessions: 2 },
    { id: '5217',      label: '52/17',     work: 52, brk: 17, sessions: 3 },
    { id: 'deepwork',  label: 'Deep Work', work: 60, brk: 10, sessions: 3 },
];

<<<<<<< HEAD
export const AUTOSTART_KEY = 'timerAutoStart';
=======

export const CUSTOM_PRESETS_KEY = 'timerCustomPresets';
export const AUTOSTART_KEY = 'timerAutoStart';
export const PRESET_USAGE_KEY = 'timerPresetUsage';

export function loadCustomPresets() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]'); } catch { return []; }
}

export function saveCustomPresets(presets) {
    try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

export function loadPresetUsage() {
    try { return JSON.parse(localStorage.getItem(PRESET_USAGE_KEY) || '{}'); } catch { return {}; }
}

export function savePresetUsage(data) {
    try { localStorage.setItem(PRESET_USAGE_KEY, JSON.stringify(data)); } catch {}
}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function isPresetActive(preset, t) {
    return t.workTime === preset.work && t.breakTime === preset.brk && t.targetSessions === preset.sessions;
}

export function applyPreset(preset, t) {
    t.updateTime('work', preset.work);
    t.updateTime('break', preset.brk);
    t.updateTime('sessions', preset.sessions);
}

export function getPresetIcon(preset) {
    const id = String(preset?.id || '');
    if (id === 'pomodoro') return '⏱️';
    if (id === '5217') return '🌊';
    if (id === 'ultradian') return '🧠';
    if (id === 'deepwork') return '🎯';
    if (id === 'sprint') return '⚡';
    if (id === 'evening') return '🌙';
    return '⚙️';
}

export const getPresetDurationTag = (preset) => `${preset.work}/${preset.brk}`;

function buildTimerTaskMeta(task, split) {
    return {
        title: task.title,
        categoryColor: task.list_color,
        moduleCode: task.module_code || null,
        dueDate: task.due_date || null,
        listName: task.list_name || null,
        taskType: inferTaskType(task.title),
        estimatedBlocks: Number(task.estimated_blocks || 1),
        estimatedSessionCount: split.sessionCount,
        estimatedWorkMinutes: split.workMinutes,
    };
}

function applyTaskTiming(task, t, split) {
    t.setTask(task.title);
    t.updateTime('work', split.workMinutes);
    t.updateTime('sessions', split.sessionCount);
    t.setTimeLeft(split.workMinutes * 60);
}

function persistTaskSelection(taskId) {
    try { sessionStorage.setItem('timerTaskId', String(taskId)); } catch {}
}

export function applyTaskToTimer(task, t) {
    const split = splitEstimatedBlocks(task.estimated_blocks || 1);
    applyTaskTiming(task, t, split);
    if (t.setActiveTaskId) t.setActiveTaskId(task.id, buildTimerTaskMeta(task, split));
    persistTaskSelection(task.id);
}
