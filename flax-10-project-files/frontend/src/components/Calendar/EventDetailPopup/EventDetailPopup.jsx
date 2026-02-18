import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./EventDetailPopup.module.css";
import { formatDateWithYear, formatTimeRange } from "../utils/dateUtils";
import { PopupHeader } from "./PopupHeader";
import { PopupBody } from "./PopupBody";
import { PopupActions } from "./PopupActions";
import { usePopupPosition } from "./usePopupPosition";
import { useClickOutside } from "./useClickOutside";

export default function EventDetailPopup({ event, tag, anchorRect, onClose, actions }) {
    const popupRef = useRef(null);
    const position = usePopupPosition(anchorRect);
    useClickOutside(popupRef, onClose);

    if (!event) return null;

    return createPortal(
        <div ref={popupRef} className={styles.popup} style={position}>
            <PopupHeader event={event} tag={tag} onClose={onClose} />
            <PopupBody event={event} />
            {actions && <PopupActions actions={actions} />}
        </div>,
        document.body
    );
}
