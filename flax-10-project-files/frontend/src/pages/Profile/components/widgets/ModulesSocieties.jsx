import { useState, useEffect } from "react";
import { getModules } from "../../../../api/moduleApi";
import Card from "../../../../components/common/Card/Card";
import ProfileWidget from "./ProfileWidget";
import widgetStyles from "./ProfileWidgets.module.css";
import badgeStyles from "./ProfileBadgesModules.module.css";
import teachingCardColors from './teachingCardColors.json';
const styles = { ...widgetStyles, ...badgeStyles };
const TEACHING_CARD_COLORS = teachingCardColors;

export function useModuleNameMap() {
  const [nameMap, setNameMap] = useState({});
  useEffect(() => {
    getModules()
      .then(data => {
        const list = Array.isArray(data) ? data : data?.results || [];
        const entries = list.filter(m => m.module_code).map(m => [m.module_code, m.module_name]);
        setNameMap(Object.fromEntries(entries));
      })
      .catch(() => {});
  }, []);
  return nameMap;
}

function ModuleList({ modules, nameMap, onNavigate }) {
  return (
    <div className={styles.modulesScroll}>
      {modules.map((code, i) => (
        <button key={i} className={styles.moduleCard} onClick={() => onNavigate?.(`modules_${code}`)}>
          <div className={styles.moduleIcon}>📚</div>
          <div className={styles.moduleCode}>{code}</div>
          {nameMap[code] && <div className={styles.moduleName}>{nameMap[code]}</div>}
        </button>
      ))}
    </div>
  );
}

function SocietyCard({ soc, onNavigate }) {
  const societyId = soc.society_id ?? soc.id;
  const imageUrl = soc.cover_image || soc.image;
  return (
    <button
      key={societyId || soc.name}
      className={styles.societyCard}
      onClick={() => societyId && onNavigate(`/societies?id=${societyId}`)}
    >
      <div className={styles.socLogoWrap}>
        {imageUrl
          ? <img src={imageUrl} alt={soc.name} className={styles.socLogo} />
          : <div className={styles.socInitial}>{soc.name[0]}</div>}
      </div>
      <span className={styles.socName}>{soc.name}</span>
    </button>
  );
}

function SocietyList({ societies, onNavigate }) {
  return (
    <div className={styles.societiesScroll}>
      {societies.map(soc => <SocietyCard key={soc.society_id ?? soc.id ?? soc.name} soc={soc} onNavigate={onNavigate} />)}
    </div>
  );
}

function TeacherModuleCard({ code, name, color, onNavigate }) {
  return (
    <button
      type="button"
      className={styles.teacherModuleCard}
      style={{ borderLeftColor: color }}
      onClick={() => onNavigate?.(`modules_${code}`)}
    >
      <div className={styles.teacherModuleIcon} style={{ background: `${color}18`, color }} aria-hidden="true">📚</div>
      <div className={styles.teacherModuleContent}>
        <p className={styles.teacherModuleLabel}>Teaching module</p>
        <div className={styles.teacherModuleCode}>{code}</div>
        {name && <p className={styles.teacherModuleName}>{name}</p>}
      </div>
    </button>
  );
}

function TeacherModulesSection({ modules, nameMap, onNavigate }) {
  if (!modules?.length) return null;
  return (
    <Card padding="lg" className={styles.teacherModulesSection}>
      <p className={styles.teacherModulesEyebrow}>Modules I Teach</p>
      <div className={styles.teacherModulesGrid}>
        {modules.map((code, index) => (
          <TeacherModuleCard
            key={code}
            code={code}
            name={nameMap[code]}
            color={TEACHING_CARD_COLORS[index % TEACHING_CARD_COLORS.length]}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </Card>
  );
}

function TabsAction({ tab, setTab, isTeacher, hasSocieties }) {
  if (!hasSocieties) return null;
  return (
    <div className={styles.widgetTabs}>
      <button
        className={`${styles.widgetTab} ${tab === "modules" ? styles.widgetTabActive : ""}`}
        onClick={() => setTab("modules")}
      >
        Modules
      </button>
      <button
        className={`${styles.widgetTab} ${tab === "societies" ? styles.widgetTabActive : ""}`}
        onClick={() => setTab("societies")}
      >
        Societies
      </button>
    </div>
  );
}

export function ModulesSocietiesWidget({ modules, societies, onNavigate, role, canViewSocieties }) {
  const nameMap = useModuleNameMap();
  const isTeacher = role === "teacher";
  const hasSocieties = canViewSocieties && societies?.length > 0;
  const [tab, setTab] = useState("modules");

  if (isTeacher) return <TeacherModulesSection modules={modules} nameMap={nameMap} onNavigate={onNavigate} />;
  if (!modules?.length && !isTeacher) return null;

  const title = tab === "modules" ? "MODULES" : "SOCIETIES JOINED";
  const tabsAction = <TabsAction tab={tab} setTab={setTab} isTeacher={isTeacher} hasSocieties={hasSocieties} />;

  return (
    <ProfileWidget title={title} action={tabsAction} className={styles.modulesWidget}>
      {tab === "modules" && modules?.length > 0 && <ModuleList modules={modules} nameMap={nameMap} onNavigate={onNavigate} />}
      {tab === "societies" && <SocietyList societies={societies || []} onNavigate={onNavigate} />}
    </ProfileWidget>
  );
}

export function ModulesSection({ modules, onNavigate, role }) {
  const nameMap = useModuleNameMap();
  const isTeacher = role === "teacher";
  if (isTeacher) return <TeacherModulesSection modules={modules} nameMap={nameMap} onNavigate={onNavigate} />;
  if (!modules?.length) return null;
  return (
    <ProfileWidget title="MODULES" className={styles.modulesWidget}>
      {modules?.length > 0 && <ModuleList modules={modules} nameMap={nameMap} onNavigate={onNavigate} />}
    </ProfileWidget>
  );
}

export function SocietiesSection({ societies, onNavigate }) {
  if (!societies?.length) return null;
  return (
    <ProfileWidget title="SOCIETIES JOINED">
      <SocietyList societies={societies} onNavigate={onNavigate} />
    </ProfileWidget>
  );
}
