// Shared mock components for DashboardLayout tests

export const SidebarMock = ({ user, onChange, onSettingsClick, onLogoutClick, onProfileClick, onToggle }) => (
  <div data-testid="sidebar">
    <span>User: {user?.name}</span>
    <button onClick={() => onChange("settings")}>Nav to Settings</button>
    <button onClick={() => onChange("timer")}>Nav to Timer</button>
    <button onClick={onSettingsClick}>Sidebar Settings</button>
    <button onClick={onLogoutClick}>Sidebar Logout</button>
    <button onClick={onProfileClick}>Sidebar Profile</button>
    <button onClick={onToggle}>Toggle Sidebar</button>
  </div>
);

export const TopbarMock = ({ onLogoutClick, onAddClick, onSettingsClick, onProfileClick, onNavChange }) => (
  <div data-testid="topbar">
    <button onClick={onLogoutClick}>Logout</button>
    <button onClick={onAddClick}>Quick Add</button>
    <button onClick={onSettingsClick}>Settings</button>
    <button onClick={onProfileClick}>Profile</button>
    <button onClick={() => onNavChange?.("other")}>Nav Other</button>
  </div>
);

export const QuickAddMock = ({ onClose, onSelectType, initialView }) => (
  <div data-testid="quick-add-modal">
    <span data-testid="quick-add-initial-view">{initialView}</span>
    <button onClick={onClose}>Close Quick Add</button>
    <button onClick={() => onSelectType("event", null)}>Add Event</button>
    <button onClick={() => onSelectType("society", null)}>Add Society</button>
    <button onClick={() => onSelectType("task", null)}>Add Task</button>
    <button onClick={() => onSelectType("create_module", null)}>Add Module</button>
    <button onClick={() => onSelectType("add_deadline", { id: 1, module_code: "CS101" })}>Add Deadline</button>
    <button onClick={() => onSelectType("add_reading", { id: 2, module_code: "CS102" })}>Add Reading</button>
  </div>
);

export const EventModalMock = ({ onClose }) => (
  <div data-testid="event-modal"><button onClick={onClose}>Close Event Modal</button></div>
);

export const CreateSocietyMock = ({ onClose, onCreate }) => (
  <div data-testid="society-modal">
    <button onClick={onClose}>Close Society Modal</button>
    <button onClick={() => onCreate({ name: "Soc", description: "" })}>Create Society</button>
  </div>
);

export const DeadlineModalMock = ({ onClose }) => (
  <div data-testid="deadline-modal"><button onClick={onClose}>Close Deadline Modal</button></div>
);

export const ReadingModalMock = ({ onClose }) => (
  <div data-testid="reading-modal"><button onClick={onClose}>Close Reading Modal</button></div>
);

export const LeaveTimerMock = ({ onCancel, onPause, onExit, onTakeBreak, timeLeftSeconds, sessionTotalSeconds }) => (
  <div data-testid="leave-timer-modal">
    <span data-testid="leave-timer-time-left">{timeLeftSeconds}</span>
    <span data-testid="leave-timer-session-total">{sessionTotalSeconds}</span>
    <button onClick={onCancel}>Stay</button>
    <button onClick={onPause}>Pause and Leave</button>
    <button onClick={onTakeBreak}>Take a 5m Break instead</button>
    <button onClick={onExit}>Exit Timer</button>
  </div>
);

export const CreateTaskMock = ({ onClose, onSave }) => (
  <div data-testid="create-task-modal">
    <button onClick={onClose}>Close Task Modal</button>
    <button onClick={() => onSave && onSave({ title: "New Task" })}>Save Task</button>
  </div>
);
