/**
 * SocietyHero renders the visual header of the society detail page,
 * featuring a single cover image and an editable society name.
 */

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import styles from "./SocietyHero.module.css";
import Tooltip from "../../common/tooltip/Tooltip";
import {
    getSocietyHeroLayoutId,
    getSocietyImages,
    getSocietyTitleLayoutId,
    SOCIETY_SHARED_TRANSITION,
} from "../utils/societyMotion";

/** Visual header carousel for the society detail page. */

export default function SocietyHero({
    society,
    onImageClick,
    editMode,
    onEditImages,
    onUpdateName,
    onUpdateBio,
    onViewMembers,
    metaContent,
    actionContent,
}) {
    const heroRef = useRef(null);
    const reduceMotion = useReducedMotion();
    const images = useMemo(() => getSocietyImages(society), [society]);
    const heroLayoutId = reduceMotion ? undefined : getSocietyHeroLayoutId(society.id);
    const titleLayoutId = reduceMotion ? undefined : getSocietyTitleLayoutId(society.id);
    const activeImage = images[0] || "";
    const [hovered, setHovered] = useState(false);

    return (
        <div className={styles.hero}
            ref={heroRef}
            onClick={() => {
                if (editMode) return;
                onImageClick?.(0);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                className={styles.heroMedia}
                layoutId={heroLayoutId}
                transition={SOCIETY_SHARED_TRANSITION}
                style={activeImage ? { backgroundImage: `url("${activeImage}")` } : undefined}
            />
            <div className={styles.overlay}>
                <HeroUtilityBar
                    hovered={hovered}
                    editMode={editMode}
                    onEditImages={onEditImages}
                    actionContent={actionContent}
                />
                <HeroContent
                    society={society}
                    editMode={editMode}
                    onUpdateName={onUpdateName}
                    onUpdateBio={onUpdateBio}
                    bio={society.bio}
                    onViewMembers={onViewMembers}
                    metaContent={metaContent}
                    titleLayoutId={titleLayoutId}
                />
            </div>
        </div>
    );
}

/** Handles rendering of contextual controls (arrows or edit layer). */

function HeroUtilityBar({ hovered, editMode, onEditImages, actionContent }) {
    const showEditButton = editMode && hovered;
    if (!showEditButton && !actionContent) return null;

    return (
        <div className={styles.utilityBar} onClick={(event) => event.stopPropagation()}>
            {showEditButton && <EditLayer onClick={onEditImages} />}
            {actionContent}
        </div>
    );
}

function EditLayer({ onClick }) {
    return (
        <button type="button" className={styles.editLayer} onClick={onClick}>
            <span className={styles.editLabel}>Edit Cover Image</span>
        </button>
    );
}

function HeroContent({ society, editMode, onUpdateName, onUpdateBio, bio, onViewMembers, metaContent, titleLayoutId }) {
    return (
        <div className={styles.content}>
            <div className={styles.copyRail}>
                <div className={styles.nameRow}>
                    <EditableName name={society.name} editMode={editMode} onUpdate={onUpdateName} layoutId={titleLayoutId} />
                    {society.is_ratified && <RatifiedIndicator />}
                    <MemberCountPill count={society.member_count} onClick={onViewMembers} />
                </div>
                <EditableBio bio={bio} editMode={editMode} onUpdate={onUpdateBio} />
            </div>
            {metaContent && <div className={styles.metaSlot} onClick={(e) => e.stopPropagation()}>{metaContent}</div>}
        </div>
    );
}

function RatifiedIndicator() {
    return (
        <Tooltip content="Ratified" position="top" wrapperClassName={styles.ratifiedTooltip}>
            <span className={styles.ratifiedBadge} aria-label="Ratified">
                <BadgeCheck size={20} strokeWidth={2.1} />
            </span>
        </Tooltip>
    );
}

function MemberCountPill({ count = 0, onClick }) {
    const label = `${count} member${count === 1 ? "" : "s"}`;
    return (
        <button
            type="button"
            className={styles.memberPill}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.();
            }}
            title="View members"
            aria-label={`View members: ${label}`}
        >
            {label}
        </button>
    );
}

/** Renders a name that becomes an input field in edit mode. */

export function EditableName({ name, editMode, onUpdate, layoutId }) {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(name);

    useEffect(() => {
        setVal(name);
    }, [name]);

    if (isEditing) return <NameInput val={val} setVal={setVal} onUpdate={onUpdate} setEditing={setIsEditing} />;

    return (
        <div className={styles.nameWrapper}
            onClick={(e) => { if (editMode) { e.stopPropagation(); setIsEditing(true); } }}>
            <h1 className={styles.name}>
                <motion.span layoutId={layoutId} transition={SOCIETY_SHARED_TRANSITION}>{name}</motion.span>
            </h1>
            {editMode && <span className={styles.editIcon}>✎</span>}
        </div>
    );
}

/** Inline text input for editing society names. */

function NameInput({ val, setVal, onUpdate, setEditing }) {
    const handleClose = () => { setEditing(false); onUpdate?.(val); };
    return <input className={styles.nameInput} value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onBlur={handleClose}
        onKeyDown={e => e.key === 'Enter' && handleClose()} />;
}

function EditableBio({ bio, editMode, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(bio || "");

    useEffect(() => {
        setValue(bio || "");
    }, [bio]);

    if (isEditing) {
        return (
            <div className={styles.bioEditor} onClick={(e) => e.stopPropagation()}>
                <textarea
                    className={styles.bioInput}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={2}
                    autoFocus
                    placeholder="Describe your society..."
                />
                <div className={styles.bioActions}>
                    <button type="button" className={styles.bioGhostButton} onClick={() => { setValue(bio || ""); setIsEditing(false); }}>
                        Cancel
                    </button>
                    <button type="button" className={styles.bioSaveButton} onClick={() => { onUpdate?.(value); setIsEditing(false); }}>
                        Save
                    </button>
                </div>
            </div>
        );
    }

    if (!bio && !editMode) return null;

    const text = bio || "Add a short society bio...";
    const className = bio ? styles.heroBio : `${styles.heroBio} ${styles.heroBioPlaceholder}`;

    if (!editMode) return <p className={className}>{text}</p>;

    return (
        <button type="button" className={`${styles.heroBioButton} ${className}`} onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
            <span>{text}</span>
            <span className={styles.inlineEditPill}>Edit</span>
        </button>
    );
}
