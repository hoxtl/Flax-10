/*
 * State and URL-sync hooks for the modules page.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useModules from "../../components/modules/hooks/useModules.js";
import useModuleSorting from "../../components/modules/hooks/useModuleSorting.js";
import { filterModules } from "../../components/modules/utils/moduleUtils.js";

function readUserRole() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.role === "teacher";
}

function getInitialFilter(searchParams, isTeacher) {
  const filter = searchParams.get("filter");
  if (filter === "enrolled") return "enrolled";
  if (filter === "all") return "all";
  return isTeacher ? "all" : "enrolled";
}

function usePageState(initialSearch, initialCreate) {
  const [searchParams] = useSearchParams();
  const isTeacher = readUserRole();
  return {
    isTeacher,
    search: useState(initialSearch || ""),
    filter: useState(getInitialFilter(searchParams, isTeacher)),
    form: useState(Boolean(initialCreate)),
    editing: useState(null),
    viewing: useState(null),
    deadline: useState(null),
    reading: useState(null),
    deleting: useState(null),
  };
}

function useInitialSearchMatch(config) {
  const { initialSearch, codeFromUrl, moduleIdFromUrl, modules, setViewingModule } = config;
  useEffect(() => {
    if (!initialSearch || codeFromUrl || moduleIdFromUrl || !modules?.length) return;
    const match = modules.find((item) => item.module_code?.toLowerCase() === initialSearch.toLowerCase());
    if (match) setViewingModule(match);
  }, [initialSearch, codeFromUrl, moduleIdFromUrl, modules, setViewingModule]);
}

function normalizeModuleCode(value) {
  return String(value || "").toUpperCase().replace(/\s/g, "");
}

function syncViewingFromModuleId(config) {
  const { moduleIdFromUrl, modules, setViewingModule, searchParams, setSearchParams } = config;
  const match = modules.find((item) => item.id === Number(moduleIdFromUrl));
  if (!match) return false;
  const next = new URLSearchParams(searchParams);
  setViewingModule(match);
  next.delete("moduleId");
  setSearchParams(next.toString(), { replace: true });
  return true;
}

function syncViewingFromCode(config) {
  const { codeFromUrl, modules, setViewingModule, setSearchQuery, setSearchParams } = config;
  const match = modules.find((item) => normalizeModuleCode(item.module_code) === normalizeModuleCode(codeFromUrl));
  if (match) setViewingModule(match);
  if (!match) setSearchQuery(codeFromUrl.trim());
  setSearchParams({}, { replace: true });
}

function useUrlModuleMatch(config) {
  const { codeFromUrl, moduleIdFromUrl, hook } = config;
  useEffect(() => {
    if ((!codeFromUrl && !moduleIdFromUrl) || hook.loading || !hook.modules) return;
    if (moduleIdFromUrl && syncViewingFromModuleId(config)) return;
    if (codeFromUrl) syncViewingFromCode(config);
  }, [codeFromUrl, moduleIdFromUrl, hook.loading, hook.modules, config]);
}

function createShowAllHandler(setters, setSearchParams) {
  return () => {
    Object.values(setters).forEach((setter) => setter(null));
    setters.setSearchQuery("");
    setters.setFilterMode("all");
    setSearchParams({}, { replace: true });
  };
}

function useShowAllListener(setters, setSearchParams) {
  useEffect(() => {
    const handler = createShowAllHandler(setters, setSearchParams);
    window.addEventListener("modules:show-all", handler);
    return () => window.removeEventListener("modules:show-all", handler);
  }, [setSearchParams, setters]);
}

function useSearchBindings(state) {
  const [searchQuery, setSearchQuery] = state.search;
  const [filterMode, setFilterMode] = state.filter;
  return { searchQuery, setSearchQuery, filterMode, setFilterMode };
}

function useFormBindings(state) {
  const [showForm, setShowForm] = state.form;
  const [editingModule, setEditingModule] = state.editing;
  const [viewingModule, setViewingModule] = state.viewing;
  return {
    showForm,
    setShowForm,
    editingModule,
    setEditingModule,
    viewingModule,
    setViewingModule,
  };
}

function useModalBindings(state) {
  const [deadlineModule, setDeadlineModule] = state.deadline;
  const [readingModule, setReadingModule] = state.reading;
  const [deletingModule, setDeletingModule] = state.deleting;
  return { deadlineModule, setDeadlineModule, readingModule, setReadingModule, deletingModule, setDeletingModule };
}

function useModulesPageBindings(initialSearch, initialCreate) {
  const state = usePageState(initialSearch, initialCreate);
  return { state, ...useSearchBindings(state), ...useFormBindings(state), ...useModalBindings(state) };
}

function buildMatchConfig(initialSearch, searchParams, setSearchParams, hook, bindings) {
  return {
    initialSearch,
    codeFromUrl: searchParams.get("code"),
    moduleIdFromUrl: searchParams.get("moduleId"),
    modules: hook.modules,
    setViewingModule: bindings.setViewingModule,
    setSearchQuery: bindings.setSearchQuery,
    searchParams,
    setSearchParams,
    hook,
  };
}

function activateModulesPageBindings(setSearchParams, matchConfig, bindings) {
  useInitialSearchMatch(matchConfig);
  useUrlModuleMatch(matchConfig);
  useShowAllListener({
    setViewingModule: bindings.setViewingModule,
    setEditingModule: bindings.setEditingModule,
    setShowForm: bindings.setShowForm,
    setDeadlineModule: bindings.setDeadlineModule,
    setReadingModule: bindings.setReadingModule,
    setSearchQuery: bindings.setSearchQuery,
    setFilterMode: bindings.setFilterMode,
  }, setSearchParams);
}

function buildPrimaryStateResult(hook, matchConfig, bindings) {
  return {
    hook,
    codeFromUrl: matchConfig.codeFromUrl,
    moduleIdFromUrl: matchConfig.moduleIdFromUrl,
    isTeacher: bindings.state.isTeacher,
    searchQuery: bindings.searchQuery,
    setSearchQuery: bindings.setSearchQuery,
    filterMode: bindings.filterMode,
    setFilterMode: bindings.setFilterMode,
    showForm: bindings.showForm,
    setShowForm: bindings.setShowForm,
    editingModule: bindings.editingModule,
    setEditingModule: bindings.setEditingModule,
    viewingModule: bindings.viewingModule,
    setViewingModule: bindings.setViewingModule,
  };
}

function buildSecondaryStateResult(bindings) {
  return {
    deadlineModule: bindings.deadlineModule,
    setDeadlineModule: bindings.setDeadlineModule,
    readingModule: bindings.readingModule,
    setReadingModule: bindings.setReadingModule,
    deletingModule: bindings.deletingModule,
    setDeletingModule: bindings.setDeletingModule,
  };
}

export function useModulesPageState(initialSearch = "", initialCreate = false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const bindings = useModulesPageBindings(initialSearch, initialCreate);
  const hook = useModules();
  const matchConfig = buildMatchConfig(initialSearch, searchParams, setSearchParams, hook, bindings);
  activateModulesPageBindings(setSearchParams, matchConfig, bindings);
  return { ...buildPrimaryStateResult(hook, matchConfig, bindings), ...buildSecondaryStateResult(bindings) };
}

function getFilteredModules(state) {
  return filterModules(state.hook.modules, state.hook.enrollments, state.searchQuery, state.filterMode, {
    excludeEnrolled: !state.isTeacher && state.filterMode === "all",
  });
}

function buildSearchModel(state, sorting) {
  return {
    query: state.searchQuery,
    filter: state.filterMode,
    onQueryChange: (value) => updateSearchQuery(state, sorting, value),
    onFilterChange: (value) => updateFilterMode(state, sorting, value),
  };
}

function updateSearchQuery(state, sorting, value) {
  state.setSearchQuery(value);
  sorting.setCurrentPage(1);
}

function updateFilterMode(state, sorting, value) {
  state.setFilterMode(value);
  sorting.setCurrentPage(1);
}

export function useMainModuleView(state) {
  const filtered = getFilteredModules(state);
  const sorting = useModuleSorting(filtered);
  return { search: buildSearchModel(state, sorting), sorting };
}
