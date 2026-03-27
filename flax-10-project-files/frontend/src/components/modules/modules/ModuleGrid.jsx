/*
 * Grid layout for rendering module cards with actions.
 */

import ModulesCard from './ModulesCard.jsx';
import gridStyles from '../../common/card/CardGrid.module.css';

function getModuleCardKey(module, index) {
    return String(module?.id ?? module?.module_code ?? `module-${index}`);
}

export default function ModuleGrid({
    modules, enrollments, isTeacher, onViewModule, onEnrollmentToggle, onEdit, onDelete, onManageDeadlines, onManageReadings, taskCountsByModule = {}
}) {
    return (
        <div className={gridStyles.grid}>
            {modules.map((module, index) => (
                <ModulesCard
                    key = {getModuleCardKey(module, index)} module={module} enrollments={enrollments} isTeacher={isTeacher}
                    onViewModule = {onViewModule} onEnrollmentToggle = {onEnrollmentToggle}
                    onEdit = {onEdit} onDelete = {onDelete}
                    onManageDeadlines={onManageDeadlines} onManageReadings={onManageReadings}
                    taskCountsByModule={taskCountsByModule}
                />
            ))}
        </div>
    );
}
