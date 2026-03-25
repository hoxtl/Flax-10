/*
 * Shared dashboard sidebar entry point.
 */

import SidebarDesktop from "./sidebar/SidebarDesktop";
import SidebarMobile from "./sidebar/SidebarMobile";
import useDeadlinePressure from "./sidebar/useDeadlinePressure";

function DesktopSidebar(props) {
  const hasPressure = useDeadlinePressure();
  return <SidebarDesktop {...props} hasPressure={hasPressure} />;
}

export default function Sidebar(props) {
  if (props.isMobile) return <SidebarMobile {...props} />;
  return <DesktopSidebar {...props} />;
}
