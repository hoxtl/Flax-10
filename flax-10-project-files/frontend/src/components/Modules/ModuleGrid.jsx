import ModulesCard from './ModulesCard.jsx';
import styles from './ModuleGrid.module.css';

export default function ModuleGrid({
    modules, enrollments, isTeacher, onViewModule, onEnrollmentToggle, onEdit, onDelete, onManageDeadlines
}) {
    return (
        <div className={styles.grid}>
            {modules.map(module => (
                <ModulesCard
                    key = {module.id} module={module} enrollments={enrollments} isTeacher={isTeacher}
                    onViewModule = {onViewModule} onEnrollmentToggle = {onEnrollmentToggle}
                    onEdit = {onEdit} onDelete = {onDelete}
                    onManageDeadlines={onManageDeadlines}
                />
            ))}
        </div>
    );
}