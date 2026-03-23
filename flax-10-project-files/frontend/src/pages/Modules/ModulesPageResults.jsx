/*
 * Main content, tabs, toolbar, and result sections for the modules page.
 */

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import AppPage from "../../components/common/AppPage/AppPage";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import PageToolbar, { ToolbarSortControl } from "../../components/common/PageToolbar/PageToolbar";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import PageTransition from "../../components/common/PageTransition/PageTransition.jsx";
import SearchBar from "../../components/common/SearchBar/SearchBar.jsx";
import Tabs from "../../components/common/Tabs/Tabs";
import { SegmentedControl } from "../../components/common/SegmentedControl/SegmentedControl";
import { Pagination, BackToTop } from "../../components/Pagination/Pagination.jsx";
import SearchEmptyState from "../../components/common/SearchEmptyState/SearchEmptyState.jsx";
import ModuleGrid from "../../components/Modules/Modules/ModuleGrid.jsx";
import ModuleCourseFilter from "../../components/Modules/Modules/ModuleCourseFilter";
import useModuleSorting from "../../components/Modules/hooks/useModuleSorting.js";
import { filterModules } from "../../components/Modules/utils/moduleUtils.js";
import MyModulesDashboard from "./MyModulesDashboard.jsx";
import styles from "./ModulesPage.module.css";
import { useMainModuleView } from "./modulesPageHooks.js";

const SORT_OPTIONS = [
  { value: "name", label: "A → Z" },
  { value: "name-desc", label: "Z → A" },
  { value: "deadlines", label: "Deadlines" },
];

function getPageTitle(isTeacher, isStudentMyModules) {
  if (isTeacher) return "Modules";
  return isStudentMyModules ? "My Modules" : "Browse Modules";
}

function getPageSubtitle(isTeacher, isStudentMyModules) {
  if (isTeacher) return <>Manage <em>King's modules</em> and keep your <em>teaching schedule</em> organised.</>;
  if (isStudentMyModules) return <>See your <em>enrolled modules</em>, <em>readings</em>, and <em>deadlines</em> in one place.</>;
  return <>Browse <em>King's modules</em> and add more options for your <em>term choices</em>.</>;
}

function CreateModuleButton({ state }) {
  return <PrimaryButton className={styles.createButton} pill onClick={() => openModuleForm(state)}>+ Create Module</PrimaryButton>;
}

function openModuleForm(state) {
  state.setEditingModule(null);
  state.setShowForm(true);
}

function StudentModulesTabs({ search }) {
  return <SegmentedControl className={styles.studentTabs} value={search.filter} onChange={search.onFilterChange} options={studentTabOptions()} variant="solid" />;
}

function studentTabOptions() {
  return [
    { value: "enrolled", label: "My Modules" },
    { value: "all", label: "Browse Modules" },
  ];
}

function MainAction({ state, search }) {
  if (state.isTeacher) return <CreateModuleButton state={state} />;
  return <StudentModulesTabs search={search} />;
}

function MyModulesTabContent({ state }) {
  return (
    <>
      <MyModulesDashboard modules={state.hook.modules} enrollments={state.hook.enrollments} />
      <BackToTop />
    </>
  );
}

function EnrollmentsSearch({ enrollSearch, setEnrollSearch, sorting }) {
  return (
    <SearchBar
      value={enrollSearch}
      onChange={(value) => handleEnrollSearchChange(value, setEnrollSearch, sorting)}
      placeholder="Search your enrolled modules..."
    />
  );
}

function handleEnrollSearchChange(value, setEnrollSearch, sorting) {
  setEnrollSearch(value);
  sorting.setCurrentPage(1);
}

function MyEnrollmentsToolbar({ enrollSearch, setEnrollSearch, sorting }) {
  return (
    <PageToolbar
      searchSlot={<EnrollmentsSearch enrollSearch={enrollSearch} setEnrollSearch={setEnrollSearch} sorting={sorting} />}
      controlsSlot={<ToolbarSortControl><SegmentedControl value={sorting.sortBy} onChange={sorting.handleNewSort} options={SORT_OPTIONS} /></ToolbarSortControl>}
    />
  );
}

function EnrollmentsGrid({ state, sorting }) {
  return (
    <ModuleGrid
      modules={sorting.results}
      enrollments={state.hook.enrollments}
      isTeacher={false}
      onViewModule={state.setViewingModule}
      onEnrollmentToggle={state.hook.toggleEnrollment}
      onEdit={(item) => editModule(state, item)}
      onDelete={(item) => state.hook.handleDeleteModule(item, () => state.setViewingModule(null))}
      onManageDeadlines={state.setDeadlineModule}
      onManageReadings={state.setReadingModule}
      taskCountsByModule={state.hook.taskCountsByModule}
    />
  );
}

function editModule(state, module) {
  state.setEditingModule(module);
  state.setShowForm(true);
}

export function MyEnrollmentsTabContent({ state }) {
  const [enrollSearch, setEnrollSearch] = useState("");
  const enrolledModules = filterModules(state.hook.modules, state.hook.enrollments, enrollSearch, "enrolled");
  const sorting = useModuleSorting(enrolledModules);
  if (sorting.results.length === 0) return <SearchEmptyState query={enrollSearch} itemLabel="your modules" onClear={() => setEnrollSearch("")} />;
  return (
    <>
      <MyEnrollmentsToolbar enrollSearch={enrollSearch} setEnrollSearch={setEnrollSearch} sorting={sorting} />
      <EnrollmentsGrid state={state} sorting={sorting} />
      <BackToTop />
    </>
  );
}

function MyModulesWithTabs({ state }) {
  const [innerTab, setInnerTab] = useState("overview");
  return (
    <Tabs
      tabs={buildTabs(state)}
      activeTab={innerTab}
      onTabChange={setInnerTab}
      layoutId="myModulesTabIndicator"
      tabVariant="heading"
      className={styles.myModulesTabs}
      tabClassName={styles.myModulesTabButton}
    />
  );
}

function buildTabs(state) {
  return [
    { id: "overview", icon: "📊", label: "Overview", content: <MyModulesTabContent state={state} /> },
    { id: "enrollments", icon: "📚", label: enrollmentTabLabel(), content: <MyEnrollmentsTabContent state={state} /> },
  ];
}

function enrollmentTabLabel() {
  return (
    <>
      <span className={styles.enrollmentsLabelFull}>My Enrolments</span>
      <span className={styles.enrollmentsLabelShort}>Enrollments</span>
    </>
  );
}

function SearchInput({ search, isMyModules }) {
  return <SearchBar value={search.query} onChange={search.onQueryChange} placeholder={getSearchPlaceholder(isMyModules)} />;
}

function getSearchPlaceholder(isMyModules) {
  if (isMyModules) return "Search your modules by name or code...";
  return "Search King's modules by name or code...";
}

export function ModuleToolbar({ search, sorting, isTeacher, isMyModules }) {
  return (
    <PageToolbar
      searchSlot={<SearchInput search={search} isMyModules={isMyModules} />}
      controlsSlot={<ToolbarControls sorting={sorting} isTeacher={isTeacher} isMyModules={isMyModules} />}
    />
  );
}

function ToolbarControls({ sorting, isTeacher, isMyModules }) {
  return (
    <>
      {!isTeacher && !isMyModules && <ModuleCourseFilter selectedCourses={sorting.selectedCourses || []} onToggleCourse={sorting.toggleCourse || (() => {})} />}
      <ToolbarSortControl><SegmentedControl value={sorting.sortBy} onChange={sorting.handleNewSort} options={SORT_OPTIONS} /></ToolbarSortControl>
    </>
  );
}

function createClearHandler(search, sorting, preserveView = false) {
  return () => {
    if (String(search.query || "").trim()) search.onQueryChange("");
    if (!preserveView && search.filter !== "all") search.onFilterChange("all");
    sorting.clearFilters();
  };
}

function SearchResultEmpty({ search, sorting, isStudentMyModules }) {
  return <SearchEmptyState query={search.query} itemLabel={isStudentMyModules ? "your modules" : "modules"} onClear={createClearHandler(search, sorting, isStudentMyModules)} />;
}

function FilterResultEmpty({ search, sorting }) {
  return (
    <SearchEmptyState
      itemLabel="modules"
      title="No modules matched your filters"
      hint="Try adjusting your filters or clear them to show more."
      onClear={createClearHandler(search, sorting)}
      alwaysShowClear
      clearLabel="Clear filters"
    />
  );
}

function TeacherEmptyState() {
  return <EmptyState icon="📚" title="No modules yet" description="Create your first module for students to browse and enrol in." />;
}

function StudentEmptyState({ search }) {
  return (
    <EmptyState
      icon="📚"
      title="You're not enrolled in any modules yet"
      description="Browse modules to add your first King's module."
      action={<PrimaryButton pill onClick={() => search.onFilterChange("all")}>Browse modules</PrimaryButton>}
    />
  );
}

export function EmptyResults({ search, sorting, isTeacher }) {
  const isStudentMyModules = !isTeacher && search.filter === "enrolled";
  const hasSearch = String(search.query || "").trim().length > 0;
  const hasActiveFilter = search.filter !== "all" || (sorting.selectedCourses || []).length > 0;
  if (hasSearch) return <SearchResultEmpty search={search} sorting={sorting} isStudentMyModules={isStudentMyModules} />;
  if (hasActiveFilter && !isStudentMyModules) return <FilterResultEmpty search={search} sorting={sorting} />;
  if (isTeacher) return <TeacherEmptyState />;
  if (isStudentMyModules) return <StudentEmptyState search={search} />;
  return <EmptyState icon="📚" title="No modules found" description="Try adjusting your search or filters." />;
}

function GridPagination({ sorting }) {
  return <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />;
}

function ModuleGridSection({ state, sorting }) {
  return (
    <ModuleGrid
      modules={sorting.pageModules}
      enrollments={state.hook.enrollments}
      isTeacher={state.isTeacher}
      onViewModule={state.setViewingModule}
      onEnrollmentToggle={state.hook.toggleEnrollment}
      onEdit={(item) => editModule(state, item)}
      onDelete={(item) => state.hook.handleDeleteModule(item, () => state.setViewingModule(null))}
      onManageDeadlines={state.setDeadlineModule}
      onManageReadings={state.setReadingModule}
      taskCountsByModule={state.hook.taskCountsByModule}
    />
  );
}

function ModuleGridWithPagination({ state, sorting }) {
  return (
    <div>
      <GridPagination sorting={sorting} />
      <ModuleGridSection state={state} sorting={sorting} />
      <GridPagination sorting={sorting} />
      <BackToTop />
    </div>
  );
}

export function ModuleResults({ state, search, sorting }) {
  if (sorting.results.length === 0) return <EmptyResults search={search} sorting={sorting} isTeacher={state.isTeacher} />;
  return <ModuleGridWithPagination state={state} sorting={sorting} />;
}

function MainViewContent({ state, search, sorting, isStudentMyModules }) {
  if (isStudentMyModules) return <MyModulesWithTabs state={state} />;
  return (
    <>
      <ModuleToolbar search={search} sorting={sorting} isTeacher={state.isTeacher} isMyModules={isStudentMyModules} />
      <ModuleResults state={state} search={search} sorting={sorting} />
    </>
  );
}

function StudentPageTransition({ search, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={`student-modules-${search.filter}`}>{children}</PageTransition>
    </AnimatePresence>
  );
}

function AppPageContent({ state, search, sorting, isStudentMyModules }) {
  return (
    <AppPage
      width="xl"
      className={styles.container}
      title={getPageTitle(state.isTeacher, isStudentMyModules)}
      subtitle={getPageSubtitle(state.isTeacher, isStudentMyModules)}
      action={<MainAction state={state} search={search} />}
    >
      <MainViewContent state={state} search={search} sorting={sorting} isStudentMyModules={isStudentMyModules} />
    </AppPage>
  );
}

export function MainView({ state }) {
  const { search, sorting } = useMainModuleView(state);
  const isStudentMyModules = !state.isTeacher && search.filter === "enrolled";
  const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
  const content = <AppPageContent state={state} search={search} sorting={sorting} isStudentMyModules={isStudentMyModules} />;
  if (state.isTeacher || isTestEnv) return content;
  return <StudentPageTransition search={search}>{content}</StudentPageTransition>;
}
