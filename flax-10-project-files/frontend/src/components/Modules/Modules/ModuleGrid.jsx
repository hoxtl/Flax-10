/*
 * Grid layout for rendering module cards with actions.
 */
import ModulesCard from './ModulesCard.jsx';
import gridStyles from '../../common/Card/CardGrid.module.css';

export default function ModuleGrid({
    modules, enrollments, isTeacher, onViewModule, onEnrollmentToggle, onEdit, onDelete, onManageDeadlines, onManageReadings, taskCountsByModule = {}
}) {
    return (
        <div className={gridStyles.grid}>
            {modules.map(module => (
                <ModulesCard
                    key = {module.id} module={module} enrollments={enrollments} isTeacher={isTeacher}
                    onViewModule = {onViewModule} onEnrollmentToggle = {onEnrollmentToggle}
                    onEdit = {onEdit} onDelete = {onDelete}
                    onManageDeadlines={onManageDeadlines} onManageReadings={onManageReadings}
                    taskCountsByModule={taskCountsByModule}
                />
            ))}
        </div>
    );
}
