/** Modules page for browsing, enrolling, and managing course modules. */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppPage from "../../components/common/AppPage/AppPage";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import PageToolbar, {
  ToolbarSortControl,
} from "../../components/common/PageToolbar/PageToolbar";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import PageTransition from "../../components/common/PageTransition/PageTransition.jsx";
import {
  isEnrolledIn,
  filterModules,
} from "../../components/Modules/utils/moduleUtils.js";
import useModules from "../../components/Modules/hooks/useModules.js";
import ModuleGrid from "../../components/Modules/Modules/ModuleGrid.jsx";
import ModuleForm from "../../components/Modules/Modules/ModuleForm.jsx";
import ModuleDetails from "../../components/Modules/Modules/ModuleDetails.jsx";
import styles from "./ModulesPage.module.css";
import DeadlineModal from "../../components/Modules/Deadlines/DeadlineModal.jsx";
import useModuleSorting from "../../components/Modules/hooks/useModuleSorting.js";
import { SegmentedControl } from "../../components/common/SegmentedControl/SegmentedControl";
import Tabs from "../../components/common/Tabs/Tabs";
import ModuleCourseFilter from "../../components/Modules/Modules/ModuleCourseFilter";
import {
  Pagination,
  BackToTop,
} from "../../components/Pagination/Pagination.jsx";
import SearchBar from "../../components/common/SearchBar/SearchBar.jsx";
import ReadingModal from "../../components/Modules/Readings/ReadingModal.jsx";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import SearchEmptyState from "../../components/common/SearchEmptyState/SearchEmptyState.jsx";
import MyModulesDashboard from "./MyModulesDashboard.jsx";

function usePageState(initialSearch, initialCreate, searchParams) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const filterFromUrl = searchParams.get("filter");
  const is_teacher = user.role === "teacher";
  const initialFilter =
    filterFromUrl === "enrolled"
      ? "enrolled"
      : filterFromUrl === "all"
        ? "all"
        : is_teacher
          ? "all"
          : "enrolled";
  return {
    is_teacher,
    search: useState(initialSearch || ""),
    filter: useState(initialFilter),
    form: useState(!!initialCreate),
    editing: useState(null),
    viewing: useState(null),
    deadline: useState(null),
    reading: useState(null),
  };
}

function useInitialSearchMatch(
  initialSearch,
  codeFromUrl,
  moduleIdFromUrl,
  modules,
  setViewingModule,
) {
  useEffect(() => {
    if (!initialSearch || codeFromUrl || moduleIdFromUrl || !modules?.length)
      return;
    const match = modules.find(
      (m) => m.module_code?.toLowerCase() === initialSearch.toLowerCase(),
    );
    if (match) setViewingModule(match);
  }, [initialSearch, modules, codeFromUrl, moduleIdFromUrl, setViewingModule]);
}

function handleModuleIdMatch(
  moduleIdFromUrl,
  modules,
  setViewingModule,
  searchParams,
  setSearchParams,
) {
  const id = Number(moduleIdFromUrl);
  const match = modules.find((m) => m.id === id);
  if (!match) return false;
  setViewingModule(match);
  const next = new URLSearchParams(searchParams);
  next.delete("moduleId");
  setSearchParams(next.toString(), { replace: true });
  return true;
}

function handleCodeMatch(
  codeFromUrl,
  modules,
  setViewingModule,
  setSearchQuery,
  setSearchParams,
) {
  const norm = (s) => (s || "").toUpperCase().replace(/\s/g, "");
  const match = modules?.find((m) => norm(m.module_code) === norm(codeFromUrl));
  if (match) {
    setViewingModule(match);
    setSearchParams({}, { replace: true });
  } else {
    setSearchQuery(codeFromUrl.trim());
    setSearchParams({}, { replace: true });
  }
}

function useUrlModuleMatch(
  codeFromUrl,
  moduleIdFromUrl,
  hook,
  setViewingModule,
  setSearchQuery,
  searchParams,
  setSearchParams,
) {
  useEffect(() => {
    if (!codeFromUrl && !moduleIdFromUrl) return;
    if (hook.loading || !hook.modules) return;
    if (
      moduleIdFromUrl &&
      handleModuleIdMatch(
        moduleIdFromUrl,
        hook.modules,
        setViewingModule,
        searchParams,
        setSearchParams,
      )
    )
      return;
    if (codeFromUrl)
      handleCodeMatch(
        codeFromUrl,
        hook.modules,
        setViewingModule,
        setSearchQuery,
        setSearchParams,
      );
  }, [
    codeFromUrl,
    moduleIdFromUrl,
    hook.loading,
    hook.modules,
    searchParams,
    setSearchParams,
    setViewingModule,
    setSearchQuery,
  ]);
}

function useShowAllListener(setters, setSearchParams) {
  useEffect(() => {
    const showAll = () => {
      Object.values(setters).forEach((fn) => fn(null));
      setters.setSearchQuery("");
      setters.setFilterMode("all");
      setSearchParams({}, { replace: true });
    };
    window.addEventListener("modules:show-all", showAll);
    return () => window.removeEventListener("modules:show-all", showAll);
  }, [setSearchParams, setters]);
}

function useModulesPage(initialSearch = "", initialCreate = false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageState = usePageState(initialSearch, initialCreate, searchParams);
  const [search_query, setSearchQuery] = pageState.search;
  const [filter_mode, setFilterMode] = pageState.filter;
  const [show_form, setShowForm] = pageState.form;
  const [editing_module, setEditingModule] = pageState.editing;
  const [viewing_module, setViewingModule] = pageState.viewing;
  const [deadline_module, setDeadlineModule] = pageState.deadline;
  const [reading_module, setReadingModule] = pageState.reading;
  const hook = useModules();
  const codeFromUrl = searchParams.get("code"),
    moduleIdFromUrl = searchParams.get("moduleId");

  useInitialSearchMatch(
    initialSearch,
    codeFromUrl,
    moduleIdFromUrl,
    hook.modules,
    setViewingModule,
  );
  useUrlModuleMatch(
    codeFromUrl,
    moduleIdFromUrl,
    hook,
    setViewingModule,
    setSearchQuery,
    searchParams,
    setSearchParams,
  );
  useShowAllListener(
    {
      setViewingModule,
      setEditingModule,
      setShowForm,
      setDeadlineModule,
      setReadingModule,
      setSearchQuery,
      setFilterMode,
    },
    setSearchParams,
  );

  return {
    is_teacher: pageState.is_teacher,
    search_query,
    setSearchQuery,
    filter_mode,
    setFilterMode,
    show_form,
    setShowForm,
    editing_module,
    setEditingModule,
    viewing_module,
    setViewingModule,
    deadline_module,
    setDeadlineModule,
    hook,
    reading_module,
    setReadingModule,
  };
}

function useMainView(state) {
  const {
    hook,
    search_query,
    filter_mode,
    setSearchQuery,
    setFilterMode,
    is_teacher,
  } = state;
  const filtered = filterModules(
    hook.modules,
    hook.enrollments,
    search_query,
    filter_mode,
    { excludeEnrolled: !is_teacher && filter_mode === "all" },
  );
  const sorting = useModuleSorting(filtered);
  const search = {
    query: search_query,
    filter: filter_mode,
    onQueryChange: (q) => {
      setSearchQuery(q);
      sorting.setCurrentPage(1);
    },
    onFilterChange: (f) => {
      setFilterMode(f);
      sorting.setCurrentPage(1);
    },
  };
  return { sorting, search };
}

function SkeletonHeader() {
  return (
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonHeaderText}>
        <SkeletonBlock className={styles.skeletonTitle} />
        <SkeletonBlock className={styles.skeletonSubtitle} />
      </div>
      <SkeletonBlock className={styles.skeletonAction} />
    </div>
  );
}

function SkeletonToolbar() {
  return (
    <div className={styles.skeletonToolbar}>
      <SkeletonBlock className={styles.skeletonSearch} />
      <SkeletonBlock className={styles.skeletonSelect} />
      <SkeletonBlock className={styles.skeletonSelect} />
      <SkeletonBlock className={styles.skeletonSort} />
    </div>
  );
}

function ModulesSkeleton() {
  return (
    <div
      className={styles.container}
      data-testid="modules-skeleton"
      aria-busy="true"
    >
      <SkeletonHeader />
      <SkeletonToolbar />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}

function getViewKey(show_form, viewing_module) {
  if (show_form) return "modules-form";
  if (viewing_module)
    return `modules-details-${viewing_module.id || viewing_module.module_code || "active"}`;
  return "modules-list";
}

function TestModeContent({ state }) {
  const { show_form, viewing_module, deadline_module, setDeadlineModule } =
    state;
  if (show_form) return <FormView state={state} />;
  if (viewing_module) return <DetailsView state={state} />;
  return (
    <>
      <MainView state={state} />
      {deadline_module && (
        <DeadlineModal
          module={deadline_module}
          onClose={() => setDeadlineModule(null)}
        />
      )}
    </>
  );
}

function AnimatedContent({ state, viewKey }) {
  const { show_form, viewing_module } = state;
  return (
    <AnimatePresence mode="wait" initial={false}>
      {show_form && (
        <PageTransition key={viewKey}>
          <FormView state={state} />
        </PageTransition>
      )}
      {!show_form && viewing_module && (
        <PageTransition key={viewKey}>
          <DetailsView state={state} />
        </PageTransition>
      )}
      {!show_form && !viewing_module && (
        <PageTransition key={viewKey}>
          <MainView state={state} />
        </PageTransition>
      )}
    </AnimatePresence>
  );
}

function Modals({ state }) {
  const {
    show_form,
    viewing_module,
    deadline_module,
    setDeadlineModule,
    reading_module,
    setReadingModule,
  } = state;
  if (show_form || viewing_module) return null;
  return (
    <>
      {deadline_module && (
        <DeadlineModal
          module={deadline_module}
          onClose={() => setDeadlineModule(null)}
        />
      )}
      {reading_module && (
        <ReadingModal
          module={reading_module}
          onClose={() => setReadingModule(null)}
        />
      )}
    </>
  );
}

export default function ModulesPage({
  initialSearch = "",
  initialCreate = false,
}) {
  const state = useModulesPage(initialSearch, initialCreate);
  if (state.hook.loading) return <ModulesSkeleton />;
  const isTestEnv =
    typeof process !== "undefined" && process.env?.NODE_ENV === "test";
  if (isTestEnv) return <TestModeContent state={state} />;
  const viewKey = getViewKey(state.show_form, state.viewing_module);
  return (
    <>
      <AnimatedContent state={state} viewKey={viewKey} />
      <Modals state={state} />
    </>
  );
}

function FormView({ state }) {
  const { editing_module, hook, setShowForm, setEditingModule } = state;
  function handleSuccess(saved_module, is_new) {
    if (is_new) hook.handleModuleCreated(saved_module);
    else hook.handleModuleUpdated(saved_module);
    setShowForm(false);
    setEditingModule(null);
  }
  const handleCancel = () => {
    setShowForm(false);
    setEditingModule(null);
  };
  return (
    <div className={styles.container}>
      <ModuleForm
        module={editing_module}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

function DetailsView({ state }) {
  const { viewing_module, hook, setViewingModule, is_teacher } = state;
  return (
    <div className={styles.container}>
      <ModuleDetails
        module={viewing_module}
        is_enrolled={isEnrolledIn(viewing_module.id, hook.enrollments)}
        is_teacher={is_teacher}
        onBack={() => {
          setViewingModule(null);
          state.setSearchQuery("");
        }}
        onEnroll={() => hook.handleEnrollment(viewing_module)}
        onUnenroll={() => hook.handleDisenrol(viewing_module)}
      />
      <BackToTop />
    </div>
  );
}

function CreateModuleButton({ setEditingModule, setShowForm }) {
  return (
    <PrimaryButton
      className={styles.createButton}
      pill
      onClick={() => {
        setEditingModule(null);
        setShowForm(true);
      }}
    >
      + Create Module
    </PrimaryButton>
  );
}

function StudentModulesTabs({ filterMode, onChange }) {
  const options = [
    { value: "enrolled", label: "My Modules" },
    { value: "all", label: "Browse Modules" },
  ];
  return (
    <SegmentedControl
      className={styles.studentTabs}
      value={filterMode}
      onChange={onChange}
      options={options}
      variant="solid"
    />
  );
}

function MyModulesTabContent({ state }) {
  const { hook } = state;
  return (
    <>
      <MyModulesDashboard
        modules={hook.modules}
        enrollments={hook.enrollments}
      />
      <BackToTop />
    </>
  );
}

function MyEnrollmentsTabContent({ state }) {
  const {
    hook,
    setViewingModule,
    setEditingModule,
    setShowForm,
    setDeadlineModule,
    setReadingModule,
  } = state;
  const [enrollSearch, setEnrollSearch] = useState("");
  const enrolledModules = filterModules(
    hook.modules,
    hook.enrollments,
    enrollSearch,
    "enrolled",
  );
  const enrolledSorting = useModuleSorting(enrolledModules);
  const sortOptions = [
    { value: "name", label: "A → Z" },
    { value: "name-desc", label: "Z → A" },
    { value: "deadlines", label: "Deadlines" },
  ];
  return (
    <>
      <PageToolbar
        searchSlot={
          <SearchBar
            value={enrollSearch}
            onChange={(q) => {
              setEnrollSearch(q);
              enrolledSorting.setCurrentPage(1);
            }}
            placeholder="Search your enrolled modules..."
          />
        }
        controlsSlot={
          <ToolbarSortControl>
            <SegmentedControl
              value={enrolledSorting.sortBy}
              onChange={enrolledSorting.handleNewSort}
              options={sortOptions}
            />
          </ToolbarSortControl>
        }
      />
      {enrolledSorting.results.length === 0 ? (
        <SearchEmptyState
          query={enrollSearch}
          itemLabel="your modules"
          onClear={() => setEnrollSearch("")}
        />
      ) : (
        <ModuleGrid
          modules={enrolledSorting.results}
          enrollments={hook.enrollments}
          isTeacher={false}
          onViewModule={setViewingModule}
          onEnrollmentToggle={hook.toggleEnrollment}
          onEdit={(m) => {
            setEditingModule(m);
            setShowForm(true);
          }}
          onDelete={(m) =>
            hook.handleDeleteModule(m, () => setViewingModule(null))
          }
          onManageDeadlines={setDeadlineModule}
          onManageReadings={setReadingModule}
          taskCountsByModule={hook.taskCountsByModule}
        />
      )}
      <BackToTop />
    </>
  );
}

function MyModulesWithTabs({ state, sorting, search }) {
  const [innerTab, setInnerTab] = useState("overview");
  const tabs = [
    {
      id: "overview",
      icon: "📊",
      label: "Overview",
      content: <MyModulesTabContent state={state} />,
    },
    {
      id: "enrollments",
      icon: "📚",
      label: (
        <>
          <span className={styles.enrollmentsLabelFull}>My Enrollments</span>
          <span className={styles.enrollmentsLabelShort}>Enrollments</span>
        </>
      ),
      content: <MyEnrollmentsTabContent state={state} />,
    },
  ];
  return (
    <Tabs
      tabs={tabs}
      activeTab={innerTab}
      onTabChange={setInnerTab}
      layoutId="myModulesTabIndicator"
      tabVariant="heading"
      className={styles.myModulesTabs}
      tabClassName={styles.myModulesTabButton}
    />
  );
}

function MainView({ state }) {
  const {
    hook,
    is_teacher,
    setViewingModule,
    setEditingModule,
    setShowForm,
    setDeadlineModule,
    setReadingModule,
  } = state;
  const { sorting, search } = useMainView(state);
  const isStudentMyModules = !is_teacher && search.filter === "enrolled";
  const isTestEnv =
    typeof process !== "undefined" && process.env?.NODE_ENV === "test";
  const title = is_teacher
    ? "Modules"
    : isStudentMyModules
      ? "My Modules"
      : "Browse Modules";
  const subtitle = is_teacher ? (
    <>
      Manage <em>King's modules</em> and keep your <em>teaching schedule</em>{" "}
      organised.
    </>
  ) : isStudentMyModules ? (
    <>
      See your <em>enrolled modules</em>, <em>readings</em>, and{" "}
      <em>deadlines</em> in one place.
    </>
  ) : (
    <>
      Browse <em>King's modules</em> and add more options for your{" "}
      <em>term choices</em>.
    </>
  );
  const action = is_teacher ? (
    <CreateModuleButton
      setEditingModule={setEditingModule}
      setShowForm={setShowForm}
    />
  ) : (
    <StudentModulesTabs
      filterMode={search.filter}
      onChange={search.onFilterChange}
    />
  );
  const pageContent = (
    <AppPage
      width="xl"
      className={styles.container}
      title={title}
      subtitle={subtitle}
      action={action}
    >
      {isStudentMyModules ? (
        <MyModulesWithTabs state={state} sorting={sorting} search={search} />
      ) : (
        <>
          <ModuleToolbar
            search={search}
            sorting={sorting}
            isTeacher={is_teacher}
            isMyModules={isStudentMyModules}
          />
          <ModuleResults
            sorting={sorting}
            search={search}
            hook={hook}
            isTeacher={is_teacher}
            setViewingModule={setViewingModule}
            setEditingModule={setEditingModule}
            setShowForm={setShowForm}
            setDeadlineModule={setDeadlineModule}
            setReadingModule={setReadingModule}
          />
        </>
      )}
    </AppPage>
  );
  if (is_teacher || isTestEnv) {
    return pageContent;
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={`student-modules-${search.filter}`}>
        {pageContent}
      </PageTransition>
    </AnimatePresence>
  );
}

function ModuleToolbar({ search, sorting, isTeacher, isMyModules }) {
  const sortOptions = [
    { value: "name", label: "A → Z" },
    { value: "name-desc", label: "Z → A" },
    { value: "deadlines", label: "Deadlines" },
  ];
  const selectedCourses = sorting.selectedCourses || [];
  const onToggleCourse = sorting.toggleCourse || (() => {});
  const searchPlaceholder = isMyModules
    ? "Search your modules by name or code..."
    : "Search King's modules by name or code...";
  return (
    <PageToolbar
      searchSlot={
        <SearchBar
          value={search.query}
          onChange={search.onQueryChange}
          placeholder={searchPlaceholder}
        />
      }
      controlsSlot={
        <>
          {!isTeacher && !isMyModules && (
            <ModuleCourseFilter
              selectedCourses={selectedCourses}
              onToggleCourse={onToggleCourse}
            />
          )}
          <ToolbarSortControl>
            <SegmentedControl
              value={sorting.sortBy}
              onChange={sorting.handleNewSort}
              options={sortOptions}
            />
          </ToolbarSortControl>
        </>
      }
    />
  );
}

function createClearHandler(search, sorting) {
  return ({ preserveView = false } = {}) =>
    () => {
      if (String(search.query || "").trim()) search.onQueryChange("");
      if (!preserveView && search.filter !== "all")
        search.onFilterChange("all");
      sorting.clearFilters();
    };
}

function EmptyResults({ search, sorting, isTeacher }) {
  const isStudentMyModules = !isTeacher && search.filter === "enrolled";
  const hasSearch = String(search.query || "").trim().length > 0;
  const hasActiveFilter =
    search.filter !== "all" || (sorting.selectedCourses || []).length > 0;
  const handleClear = createClearHandler(search, sorting);
  if (hasSearch) {
    return (
      <SearchEmptyState
        query={search.query}
        itemLabel={isStudentMyModules ? "your modules" : "modules"}
        onClear={handleClear({ preserveView: isStudentMyModules })}
      />
    );
  }
  if (hasActiveFilter && !isStudentMyModules) {
    return (
      <SearchEmptyState
        itemLabel="modules"
        title="No modules matched your filters"
        hint="Try adjusting your filters or clear them to show more."
        onClear={handleClear()}
        alwaysShowClear
        clearLabel="Clear filters"
      />
    );
  }
  if (isTeacher)
    return (
      <EmptyState
        icon="📚"
        title="No modules yet"
        description="Create your first module for students to browse and enrol in."
      />
    );
  if (isStudentMyModules) {
    return (
      <EmptyState
        icon="📚"
        title="You're not enrolled in any modules yet"
        description="Browse modules to add your first King's module."
        action={
          <PrimaryButton pill onClick={() => search.onFilterChange("all")}>
            Browse modules
          </PrimaryButton>
        }
      />
    );
  }
  return (
    <EmptyState
      icon="📚"
      title="No modules found"
      description="Try adjusting your search or filters."
    />
  );
}

function ModuleGridWithPagination({
  sorting,
  hook,
  isTeacher,
  setViewingModule,
  setEditingModule,
  setShowForm,
  setDeadlineModule,
  setReadingModule,
}) {
  return (
    <div>
      <Pagination
        currentPage={sorting.currentPage}
        totalPages={sorting.totalPages}
        onPageChange={sorting.setCurrentPage}
      />
      <ModuleGrid
        modules={sorting.pageModules}
        enrollments={hook.enrollments}
        isTeacher={isTeacher}
        onViewModule={setViewingModule}
        onEnrollmentToggle={hook.toggleEnrollment}
        onEdit={(m) => {
          setEditingModule(m);
          setShowForm(true);
        }}
        onDelete={(m) =>
          hook.handleDeleteModule(m, () => setViewingModule(null))
        }
        onManageDeadlines={setDeadlineModule}
        onManageReadings={setReadingModule}
        taskCountsByModule={hook.taskCountsByModule}
      />
      <Pagination
        currentPage={sorting.currentPage}
        totalPages={sorting.totalPages}
        onPageChange={sorting.setCurrentPage}
      />
      <BackToTop />
    </div>
  );
}

function ModuleResults(props) {
  const { sorting, search, isTeacher } = props;
  if (sorting.results.length === 0)
    return (
      <EmptyResults search={search} sorting={sorting} isTeacher={isTeacher} />
    );
  return <ModuleGridWithPagination {...props} />;
}
