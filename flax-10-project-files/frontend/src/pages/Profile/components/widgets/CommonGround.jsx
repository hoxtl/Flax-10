import Card from "../../../../components/Common/Card/Card";
import compatStyles from "./ProfileCompat.module.css";

const COMMON_GROUND_COLORS = {
  modules: "#9aaebe",
  societies: "#b69f90",
};

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

function buildInsightCards(data) {
  const { sharedModules, sharedSocieties, otherModules, otherSocieties } = data;
  const cards = [];

  if (sharedModules.length || otherModules.length) {
    cards.push({
      key: "modules",
      icon: "📚",
      color: COMMON_GROUND_COLORS.modules,
      label: "Modules",
      value: sharedModules.length,
      unit: "in common",
      subtitle: null,
      content: <ModulePills sharedModules={sharedModules} otherModules={otherModules} />,
    });
  }

  if (sharedSocieties.length || otherSocieties.length) {
    cards.push({
      key: "societies",
      icon: "👥",
      color: COMMON_GROUND_COLORS.societies,
      label: "Societies",
      value: sharedSocieties.length,
      unit: "in common",
      subtitle: null,
      content: <SocietyPills sharedSocieties={sharedSocieties} otherSocieties={otherSocieties} />,
    });
  }

  return cards;
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

function CommonGroundInsightCard({ icon, color, label, value, unit, subtitle, content }) {
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
          {subtitle && <p className={compatStyles.commonInsightSubtitle}>{subtitle}</p>}
        </div>
      </div>
      <div className={compatStyles.commonInsightPills}>{content}</div>
    </div>
  );
}

export function CommonGroundSection({ viewedModules, viewedSocieties, currentUserModules, currentUserSocieties, onNavigate }) {
  const data = buildCommonGroundData(viewedModules, viewedSocieties, currentUserModules, currentUserSocieties);
  const cards = buildInsightCards({
    ...data,
    onNavigate,
  }).map((card) => ({
    ...card,
    content: card.key === "modules"
      ? <ModulePills sharedModules={data.sharedModules} otherModules={data.otherModules} onNavigate={onNavigate} />
      : <SocietyPills sharedSocieties={data.sharedSocieties} otherSocieties={data.otherSocieties} onNavigate={onNavigate} />,
  }));
  if (!cards.length) return null;
  return (
    <Card className={compatStyles.commonGroundCard}>
      <p className={compatStyles.commonGroundEyebrow}>Common Ground</p>
      <div className={compatStyles.commonGroundGrid}>
        {cards.map(({ key, ...card }) => <CommonGroundInsightCard key={key} {...card} />)}
      </div>
    </Card>
  );
}
