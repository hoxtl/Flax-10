import { useState, useEffect } from "react";
import { getModules } from "../../../../api/moduleApi";
import ProfileWidget from "./ProfileWidget";
import widgetStyles from "./ProfileWidgets.module.css";
import badgeStyles from "./ProfileBadgesModules.module.css";
const styles = { ...widgetStyles, ...badgeStyles };

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

function TabsAction({ tab, setTab, isTeacher, hasSocieties }) {
  if (!hasSocieties) return null;
  return (
    <div className={styles.widgetTabs}>
      <button
        className={`${styles.widgetTab} ${tab === "modules" ? styles.widgetTabActive : ""}`}
        onClick={() => setTab("modules")}
      >
        {isTeacher ? "Teaching" : "Modules"}
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

  if (!modules?.length && !isTeacher) return null;

  const title = tab === "modules" ? (isTeacher ? "MODULES I TEACH" : "MODULES") : "SOCIETIES JOINED";
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
  if (!modules?.length && !isTeacher) return null;
  return (
    <ProfileWidget title={isTeacher ? "MODULES I TEACH" : "MODULES"} className={styles.modulesWidget}>
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
