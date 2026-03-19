import ProfileWidget from "./ProfileWidget";
import compatStyles from "./ProfileCompat.module.css";

function buildCommonGroundData(viewedModules, viewedSocieties, currentUserModules, currentUserSocieties) {
  const sharedModules = (viewedModules || []).filter(m => (currentUserModules || []).includes(m));
  const sharedSocieties = (viewedSocieties || []).filter(s =>
    (currentUserSocieties || []).some(cs => cs.id === s.id)
  );
  const otherModules = (viewedModules || []).filter(m => !(currentUserModules || []).includes(m));
  const otherSocieties = (viewedSocieties || []).filter(s =>
    !(currentUserSocieties || []).some(cs => cs.id === s.id)
  );
  return { sharedModules, sharedSocieties, otherModules, otherSocieties };
}

function buildSummaryText(sharedModules, sharedSocieties, viewedUsername) {
  const parts = [];
  if (sharedModules.length) parts.push(`${sharedModules.length} module${sharedModules.length > 1 ? "s" : ""}`);
  if (sharedSocieties.length) parts.push(`${sharedSocieties.length} societ${sharedSocieties.length > 1 ? "ies" : "y"}`);
  return parts.length ? `You share ${parts.join(" and ")} with ${viewedUsername}.` : null;
}

function ModulePills({ sharedModules, otherModules, onNavigate }) {
  return (
    <div className={compatStyles.commonGroundPills}>
      {sharedModules.map(m => (
        <button key={`sm-${m}`} className={compatStyles.sharedPill} onClick={() => onNavigate?.(`modules_${m}`)}>{m}</button>
      ))}
      {otherModules.map(m => (
        <button key={`om-${m}`} className={compatStyles.otherPill} onClick={() => onNavigate?.(`modules_${m}`)}>{m}</button>
      ))}
    </div>
  );
}

function SocietyPills({ sharedSocieties, otherSocieties, onNavigate }) {
  return (
    <div className={compatStyles.commonGroundPills}>
      {sharedSocieties.map(s => (
        <button key={`ss-${s.id}`} className={compatStyles.sharedPill} onClick={() => onNavigate?.(`/societies?id=${s.id}`)}>{s.name}</button>
      ))}
      {otherSocieties.map(s => (
        <button key={`os-${s.id}`} className={compatStyles.otherPill} onClick={() => onNavigate?.(`/societies?id=${s.id}`)}>{s.name}</button>
      ))}
    </div>
  );
}

function CommonGroundGroup({ label, children }) {
  return (
    <div className={compatStyles.commonSubGroup}>
      <div className={compatStyles.commonSubHeader}>{label}</div>
      {children}
    </div>
  );
}

export function CommonGroundSection({ viewedModules, viewedSocieties, currentUserModules, currentUserSocieties, viewedUsername, onNavigate }) {
  const { sharedModules, sharedSocieties, otherModules, otherSocieties } = buildCommonGroundData(viewedModules, viewedSocieties, currentUserModules, currentUserSocieties);
  const hasModules = sharedModules.length > 0 || otherModules.length > 0;
  const hasSocieties = sharedSocieties.length > 0 || otherSocieties.length > 0;
  if (!hasModules && !hasSocieties) return null;
  const summaryText = buildSummaryText(sharedModules, sharedSocieties, viewedUsername);
  return (
    <ProfileWidget title="COMMON GROUND">
      {summaryText && <p className={compatStyles.commonGroundTitle}>{summaryText}</p>}
      {hasModules && <CommonGroundGroup label="MODULES"><ModulePills sharedModules={sharedModules} otherModules={otherModules} onNavigate={onNavigate} /></CommonGroundGroup>}
      {hasSocieties && <CommonGroundGroup label="SOCIETIES"><SocietyPills sharedSocieties={sharedSocieties} otherSocieties={otherSocieties} onNavigate={onNavigate} /></CommonGroundGroup>}
    </ProfileWidget>
  );
}
