import React from "react";
import { Users, Calendar } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import UserModuleDropdown from "../../../components/Modules/UserModuleDropdown";
import styles from "./ProjectHeader.module.css";

export function ProjectHeaderMeta({ project, members, onPatch }) {
    return (
        <div className={styles.headerBody}>
            <div className={styles.moduleTag}>
                <div className={styles.moduleDot} />
                <UserModuleDropdown
                    value={project.course_code || ""}
                    onChange={val => onPatch({ course_code: val })}
                    placeholder="Module"
                    className={styles.headerModuleDropdown}
                />
            </div>

            <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                    <Users size={14} className={styles.metaIcon} />
                    <span>{members.length} members</span>
                </div>
                <div className={styles.metaItem}>
                    <div className={styles.deadlinePill}>
                        <Calendar size={14} className={styles.metaIcon} />
                        <DateTimePicker
                            value={project.deadline}
                            onChange={val => onPatch({ deadline: val })}
                            dateOnly={true}
                            placeholder="dd / mm / yyyy"
                            hideIcon={true}
                            triggerClassName={styles.detailDateTrigger}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
