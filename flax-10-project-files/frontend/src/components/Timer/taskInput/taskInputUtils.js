/*
 * Task picker utility helpers.
 */

import { FOCUS_BLOCK_COLOURS_HEX } from '../../../pages/Tasks/constants/focusBlockColours';
import { isEnrolledIn } from '../../Modules/utils/moduleUtils';
import { compareTaskDue, compareTaskEstimatedTime, compareTaskPriority, getTaskDurationMinutes } from '../../../lib/focusPlanner';
import { SORT_ALPHA, SORT_DATE_ADDED, SORT_DUE, SORT_TIME } from './taskInputConstants';

export function getTaskUrgencyTone(task) {
  const raw = task?.due_date || task?.dueDate;
  if (!raw) return 'cool';
  const due = new Date(raw);
  if (Number.isNaN(due.getTime())) return 'cool';
  const endOfToday = getEndOfToday();
  if (due.getTime() <= endOfToday.getTime()) return 'hot';
  return (due.getTime() - Date.now()) / 3600000 <= 48 ? 'warm' : 'cool';
}

function getEndOfToday() {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

export function normalizeModuleCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function urgencyRank(task) {
  const tone = getTaskUrgencyTone(task);
  if (tone === 'hot') return 0;
  return tone === 'warm' ? 1 : 2;
}

export function moduleCodePrefix(code = '') {
  return code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || 'Other';
}

export function sortTasks(list, sort) {
  if (sort === SORT_TIME) return list.sort(compareTaskEstimatedTime);
  if (sort === SORT_DUE) return list.sort(compareTaskDue);
  if (sort === SORT_ALPHA) return list.sort((left, right) => (left.title || '').localeCompare(right.title || ''));
  if (sort === SORT_DATE_ADDED) return list.sort((left, right) => (right.id ?? 0) - (left.id ?? 0));
  return list.sort(compareTaskPriority);
}

export function hydrateTasks(tasksData, listsData) {
  const listMap = buildListMap(listsData || []);
  const tasks = (tasksData || []).filter((task) => !task.completed);
  return tasks.map((task) => addListInfo(task, listMap));
}

function buildListMap(lists) {
  const map = {};
  lists.forEach((list, index) => {
    map[String(list.id)] = { name: list.name || 'Other', color: list.color || FOCUS_BLOCK_COLOURS_HEX[index % FOCUS_BLOCK_COLOURS_HEX.length] };
  });
  return map;
}

function addListInfo(task, listMap) {
  const info = listMap[String(task.task_list)] || { name: 'Other', color: '#94a3b8' };
  return { ...task, list_name: info.name, list_color: info.color };
}

export function buildModuleItems(enrolledModules, tasks) {
  const byCode = new Map();
  enrolledModules.forEach((module) => addModuleOption(byCode, module.code, module.name));
  tasks.forEach((task) => addModuleOption(byCode, normalizeModuleCode(task.module_code), String(task.module_name || '').trim()));
  return Array.from(byCode.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([code, name]) => ({ value: code, label: name ? `${code} — ${name}` : code }));
}

function addModuleOption(map, code, name) {
  if (!code || map.has(code)) return;
  map.set(code, name);
}

export function buildListItems(lists) {
  return (lists || []).map((list) => ({ value: String(list.id), label: list.name || 'List' }));
}

export function groupModuleItems(moduleItems, filterQuery) {
  const query = filterQuery.trim().toLowerCase();
  const filtered = !query ? moduleItems : moduleItems.filter((item) => item.label.toLowerCase().includes(query));
  return filtered.reduce((accumulator, item) => appendGroupedItem(accumulator, item), {});
}

function appendGroupedItem(accumulator, item) {
  const key = moduleCodePrefix(item.value);
  if (!accumulator[key]) accumulator[key] = [];
  accumulator[key].push(item);
  return accumulator;
}

export function filterListItems(listItems, filterQuery) {
  const query = filterQuery.trim().toLowerCase();
  if (!query) return listItems;
  return listItems.filter((item) => item.label.toLowerCase().includes(query));
}

export function filterTasks(tasks, state) {
  const filteredBySearch = filterBySearch(tasks, state.search);
  const filteredByList = filterByList(filteredBySearch, state.filterListIds);
  return filterByModule(filteredByList, state.filterModuleCodes);
}

function filterBySearch(tasks, search) {
  const query = (search || '').toLowerCase().trim();
  if (!query) return tasks;
  return tasks.filter((task) => matchesTaskQuery(task, query));
}

function matchesTaskQuery(task, query) {
  return [task.title, task.list_name, task.module_code].some((value) => String(value || '').toLowerCase().includes(query));
}

function filterByList(tasks, filterListIds) {
  if (filterListIds.length === 0) return tasks;
  const ids = new Set(filterListIds.map(String));
  return tasks.filter((task) => ids.has(String(task.task_list)));
}

function filterByModule(tasks, filterModuleCodes) {
  if (filterModuleCodes.length === 0) return tasks;
  const codes = new Set(filterModuleCodes);
  return tasks.filter((task) => codes.has(normalizeModuleCode(task.module_code)));
}

export function getRecommendedTask(filteredTasks) {
  if (!filteredTasks.length) return null;
  return [...filteredTasks].sort((left, right) => compareRecommendedTasks(left, right))[0] || null;
}

function compareRecommendedTasks(left, right) {
  const urgencyDiff = urgencyRank(left) - urgencyRank(right);
  if (urgencyDiff !== 0) return urgencyDiff;
  return compareTaskDue(left, right);
}

export function mapEnrolledModules(allModules, enrollments) {
  return (allModules || []).filter((module) => isEnrolledIn(module.id, enrollments || [])).map((module) => ({ code: normalizeModuleCode(module.module_code), name: String(module.module_name || module.title || '').trim() })).filter((module) => module.code);
}

export function getTaskDurationLabel(task) {
  return `${getTaskDurationMinutes(task)} mins`;
}
