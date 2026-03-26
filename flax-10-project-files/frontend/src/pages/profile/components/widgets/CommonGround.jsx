<<<<<<< HEAD
/*
 * CommonGroundSection widget – shared modules and societies between two users.
 */

import Card from "../../../../components/common/Card/Card";
import compatStyles from "./ProfileCompat.module.css";

const COMMON_GROUND_COLORS = {
  modules: "var(--common-ground-modules)",
  societies: "var(--common-ground-societies)",
};

=======
import ProfileWidget from "./ProfileWidget";
import compatStyles from "./ProfileCompat.module.css";

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

<<<<<<< HEAD
function buildModuleCard(data) {
  if (!data.sharedModules.length && !data.otherModules.length) return null;
  return { key: "modules", icon: "📚", color: COMMON_GROUND_COLORS.modules, label: "Modules", value: data.sharedModules.length, unit: "in common" };
}

function buildSocietyCard(data) {
  if (!data.sharedSocieties.length && !data.otherSocieties.length) return null;
  return { key: "societies", icon: "👥", color: COMMON_GROUND_COLORS.societies, label: "Societies", value: data.sharedSocieties.length, unit: "in common" };
}

function buildInsightCards(data) {
  return [buildModuleCard(data), buildSocietyCard(data)].filter(Boolean);
=======
function buildSummaryText(sharedModules, sharedSocieties, viewedUsername) {
  const parts = [];
  if (sharedModules.length) parts.push(`${sharedModules.length} module${sharedModules.length > 1 ? "s" : ""}`);
  if (sharedSocieties.length) parts.push(`${sharedSocieties.length} societ${sharedSocieties.length > 1 ? "ies" : "y"}`);
  return parts.length ? `You share ${parts.join(" and ")} with ${viewedUsername}.` : null;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

<<<<<<< HEAD
function CommonGroundInsightCard({ icon, color, label, value, unit, content }) {
  return (
    <div className={compatStyles.commonInsightCard} style={{ borderLeftColor: color }}>
      <div className={compatStyles.commonInsightTop}>
        <div className={compatStyles.commonInsightIcon} style={{ background: `${color}18`, color }}>
          <span className={compatStyles.commonInsightEmoji}>{icon}</span>
        </div>
        <div className={compatStyles.commonInsightBody}>
          <p className={compatStyles.commonInsightLabel}>{label}</p>
          <div className={compatStyles.commonInsightValueRow}>
            <span className={compatStyles.commonInsightValue}>{value}</span>
            <span className={compatStyles.commonInsightUnit}>{unit}</span>
          </div>
        </div>
      </div>
      <div className={compatStyles.commonInsightPills}>{content}</div>
=======
function CommonGroundGroup({ label, children }) {
  return (
    <div className={compatStyles.commonSubGroup}>
      <div className={compatStyles.commonSubHeader}>{label}</div>
      {children}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}

<<<<<<< HEAD
function buildCardContent(card, data, onNavigate) {
  if (card.key === "modules") return <ModulePills sharedModules={data.sharedModules} otherModules={data.otherModules} onNavigate={onNavigate} />;
  return <SocietyPills sharedSocieties={data.sharedSocieties} otherSocieties={data.otherSocieties} onNavigate={onNavigate} />;
}

function buildCardsWithContent(data, onNavigate) {
  return buildInsightCards(data).map((card) => ({ ...card, content: buildCardContent(card, data, onNavigate) }));
}

export function CommonGroundSection({ viewedModules, viewedSocieties, currentUserModules, currentUserSocieties, onNavigate }) {
  const data = buildCommonGroundData(viewedModules, viewedSocieties, currentUserModules, currentUserSocieties);
  const cards = buildCardsWithContent(data, onNavigate);
  if (!cards.length) return null;
  return (
    <Card className={compatStyles.commonGroundCard}>
      <p className={compatStyles.commonGroundEyebrow}>Common Ground</p>
      <div className={compatStyles.commonGroundGrid}>
        {cards.map(({ key, ...card }) => <CommonGroundInsightCard key={key} {...card} />)}
      </div>
    </Card>
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
