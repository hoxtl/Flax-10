import { NotificationBell } from './NotificationBell';
import { NotificationPanel } from './NotificationPanel';
import './NotificationCenter.css';

export function NotificationCenter() {
    return (
        <div className="notification-center">
            <NotificationBell />
            <NotificationPanel />
        </div>
    );
}
