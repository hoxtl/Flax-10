/**
 * SocietyHero renders the visual header of the society detail page,
 * featuring a single cover image and an editable society name.
 */

import { useEffect, useMemo, useState } from "react";
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

function useHeroMedia(society) {
    const reduceMotion = useReducedMotion();
    const images = useMemo(() => getSocietyImages(society), [society]);
    return {
        activeImage: images[0] || "",
        heroLayoutId: reduceMotion ? undefined : getSocietyHeroLayoutId(society.id),
        titleLayoutId: reduceMotion ? undefined : getSocietyTitleLayoutId(society.id),
    };
}

/** Visual header carousel for the society detail page. */
export default function SocietyHero(props) {
    const media = useHeroMedia(props.society);
    return <HeroFrame {...props} media={media} />;
}

function HeroFrame(props) {
    const { media, editMode, onImageClick } = props;
    const [hovered, setHovered] = useState(false);
    const handleClick = () => { if (!editMode) onImageClick?.(0); };
    return (
        <div className={styles.hero} onClick={handleClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <HeroMedia activeImage={media.activeImage} heroLayoutId={media.heroLayoutId} />
            <HeroOverlay {...props} hovered={hovered} titleLayoutId={media.titleLayoutId} />
        </div>
    );
}

function HeroMedia({ activeImage, heroLayoutId }) {
    return (
        <motion.div
            className={styles.heroMedia}
            layoutId={heroLayoutId}
            transition={SOCIETY_SHARED_TRANSITION}
            style={activeImage ? { backgroundImage: `url("${activeImage}")` } : undefined}
        />
    );
}

function HeroOverlay({ hovered, society, editMode, onEditImages, actionContent, onUpdateName, onUpdateBio, onViewMembers, metaContent, titleLayoutId }) {
    return (
        <div className={styles.overlay}>
            <HeroUtilityBar hovered={hovered} editMode={editMode} onEditImages={onEditImages} actionContent={actionContent} />
            <HeroContent society={society} editMode={editMode} onUpdateName={onUpdateName} onUpdateBio={onUpdateBio} onViewMembers={onViewMembers} metaContent={metaContent} titleLayoutId={titleLayoutId} />
        </div>
    );
}

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

function HeroContent({ society, editMode, onUpdateName, onUpdateBio, onViewMembers, metaContent, titleLayoutId }) {
    return (
        <div className={styles.content}>
            <HeroCopyRail society={society} editMode={editMode} onUpdateName={onUpdateName} onUpdateBio={onUpdateBio} onViewMembers={onViewMembers} titleLayoutId={titleLayoutId} />
            {metaContent && <HeroMetaSlot>{metaContent}</HeroMetaSlot>}
        </div>
    );
}

function HeroCopyRail({ society, editMode, onUpdateName, onUpdateBio, onViewMembers, titleLayoutId }) {
    return (
        <div className={styles.copyRail}>
            <HeroNameRow society={society} editMode={editMode} onUpdateName={onUpdateName} onViewMembers={onViewMembers} titleLayoutId={titleLayoutId} />
            <EditableBio bio={society.bio} editMode={editMode} onUpdate={onUpdateBio} />
        </div>
    );
}

function HeroNameRow({ society, editMode, onUpdateName, onViewMembers, titleLayoutId }) {
    return (
        <div className={styles.nameRow}>
            <EditableName name={society.name} editMode={editMode} onUpdate={onUpdateName} layoutId={titleLayoutId} />
            {society.is_ratified && <RatifiedIndicator />}
            <MemberCountPill count={society.member_count} onClick={onViewMembers} />
        </div>
    );
}

function HeroMetaSlot({ children }) {
    return (
        <div className={styles.metaSlot} onClick={(event) => event.stopPropagation()}>
            {children}
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
        <button type="button" className={styles.memberPill} onClick={(event) => handleMemberClick(event, onClick)} title="View members" aria-label={`View members: ${label}`}>
            {label}
        </button>
    );
}

function handleMemberClick(event, onClick) {
    event.stopPropagation();
    onClick?.();
}

/** Renders a name that becomes an input field in edit mode. */
export function EditableName({ name, editMode, onUpdate, layoutId }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(name);
    useEffect(() => setValue(name), [name]);
    if (isEditing) return <NameInput value={value} setValue={setValue} onUpdate={onUpdate} setEditing={setIsEditing} />;
    return <EditableNameDisplay editMode={editMode} name={name} layoutId={layoutId} onEdit={() => setIsEditing(true)} />;
}

function EditableNameDisplay({ editMode, name, layoutId, onEdit }) {
    return (
        <div className={styles.nameWrapper} onClick={(event) => handleNameClick(event, editMode, onEdit)}>
            <h1 className={styles.name}>
                <motion.span layoutId={layoutId} transition={SOCIETY_SHARED_TRANSITION}>{name}</motion.span>
            </h1>
            {editMode && <span className={styles.editIcon}>✎</span>}
        </div>
    );
}

function handleNameClick(event, editMode, onEdit) {
    if (!editMode) return;
    event.stopPropagation();
    onEdit();
}

function NameInput({ value, setValue, onUpdate, setEditing }) {
    const handleClose = () => {
        setEditing(false);
        onUpdate?.(value);
    };
    return <input className={styles.nameInput} value={value} autoFocus onChange={(event) => setValue(event.target.value)} onBlur={handleClose} onKeyDown={(event) => event.key === "Enter" && handleClose()} />;
}

function useBioEditor(bio) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(bio || "");
    useEffect(() => setValue(bio || ""), [bio]);
    return { isEditing, setIsEditing, value, setValue };
}

function EditableBio({ bio, editMode, onUpdate }) {
    const editor = useBioEditor(bio);
    if (editor.isEditing) return <BioEditor bio={bio} editor={editor} onUpdate={onUpdate} />;
    return <BioDisplay bio={bio} editMode={editMode} onEdit={() => editor.setIsEditing(true)} />;
}

function BioEditor({ bio, editor, onUpdate }) {
    return (
        <div className={styles.bioEditor} onClick={(event) => event.stopPropagation()}>
            <textarea className={styles.bioInput} value={editor.value} onChange={(event) => editor.setValue(event.target.value)} rows={2} autoFocus placeholder="Describe your society..." />
            <BioEditorActions bio={bio} editor={editor} onUpdate={onUpdate} />
        </div>
    );
}

function BioEditorActions({ bio, editor, onUpdate }) {
    return (
        <div className={styles.bioActions}>
            <button type="button" className={styles.bioGhostButton} onClick={() => resetBioEditor(bio, editor)}>Cancel</button>
            <button type="button" className={styles.bioSaveButton} onClick={() => saveBioEditor(editor, onUpdate)}>Save</button>
        </div>
    );
}

function resetBioEditor(bio, editor) {
    editor.setValue(bio || "");
    editor.setIsEditing(false);
}

function saveBioEditor(editor, onUpdate) {
    onUpdate?.(editor.value);
    editor.setIsEditing(false);
}

function BioDisplay({ bio, editMode, onEdit }) {
    if (!bio && !editMode) return null;
    const text = bio || "Add a short society bio...";
    const className = bio ? styles.heroBio : `${styles.heroBio} ${styles.heroBioPlaceholder}`;
    if (!editMode) return <p className={className}>{text}</p>;
    return <BioEditButton className={className} text={text} onEdit={onEdit} />;
}

function BioEditButton({ className, text, onEdit }) {
    return (
        <button type="button" className={`${styles.heroBioButton} ${className}`} onClick={(event) => handleBioEditClick(event, onEdit)}>
            <span>{text}</span>
            <span className={styles.inlineEditPill}>Edit</span>
        </button>
    );
}

function handleBioEditClick(event, onEdit) {
    event.stopPropagation();
    onEdit();
}
