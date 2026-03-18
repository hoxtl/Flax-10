import { forwardRef, useEffect, useRef } from "react";
import { Search } from "lucide-react";

import styles from "./SearchBar.module.css";
import TextInput from "../TextInput/TextInput";

const shortcutTargets = new Set();
let shortcutListenerAttached = false;

function isEditableTarget(target) {
    const tag = target?.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}

function getVisibleTargets() {
    return Array.from(shortcutTargets)
        .filter((el) => el && el.isConnected && !el.disabled && !el.readOnly && el.offsetParent !== null);
}

function pickPrimaryTarget(targets) {
    if (!targets.length) return null;
    return targets
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .sort((a, b) => (a.rect.top - b.rect.top) || (a.rect.left - b.rect.left))[0]?.el || null;
}

function handleSlashShortcut(event) {
    if (event.key !== "/") return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;

    const target = pickPrimaryTarget(getVisibleTargets());
    if (!target) return;
    event.preventDefault();
    target.focus();
}

function syncShortcutListener() {
    if (!shortcutListenerAttached && shortcutTargets.size > 0) {
        document.addEventListener("keydown", handleSlashShortcut);
        shortcutListenerAttached = true;
        return;
    }
    if (shortcutListenerAttached && shortcutTargets.size === 0) {
        document.removeEventListener("keydown", handleSlashShortcut);
        shortcutListenerAttached = false;
    }
}

function mergeRefs(externalRef, value) {
    if (!externalRef) return;
    if (typeof externalRef === "function") {
        externalRef(value);
        return;
    }
    externalRef.current = value;
}

function withShortcutHint(placeholder, enabled, hint) {
    if (!enabled) return placeholder;
    if (String(placeholder).includes("/")) return placeholder;
    return `${placeholder} ${hint}`;
}

const SearchBar = forwardRef(function SearchBar(
    {
        value,
        onChange,
        placeholder = "Search...",
        className = "",
        onFocus,
        onBlur,
        inputClassName = "",
        enableSlashShortcut = true,
        showShortcutHint = true,
        shortcutHint = "( / )",
        ...inputProps
    },
    ref
) {
    const internalRef = useRef(null);
    const handleChange = (e) => onChange?.(e.target.value);
    const containerClass = className ? `${styles.container} ${className}` : styles.container;
    const resolvedInputClassName = inputClassName ? `${styles.input} ${inputClassName}` : styles.input;
    const resolvedPlaceholder = withShortcutHint(placeholder, showShortcutHint, shortcutHint);

    useEffect(() => {
        const node = internalRef.current;
        if (!enableSlashShortcut || !node) return undefined;
        shortcutTargets.add(node);
        syncShortcutListener();
        return () => {
            shortcutTargets.delete(node);
            syncShortcutListener();
        };
    }, [enableSlashShortcut]);

    const setRef = (node) => {
        internalRef.current = node;
        mergeRefs(ref, node);
    };

    return (
        <TextInput
            ref={setRef}
            className={containerClass}
            inputClassName={resolvedInputClassName}
            leading={<Search size={16} strokeWidth={2} />}
            value={value}
            onChange={handleChange}
            placeholder={resolvedPlaceholder}
            onFocus={onFocus}
            onBlur={onBlur}
            {...inputProps}
        />
    );
});

export default SearchBar;
