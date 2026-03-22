import { useMemo } from "react";
import AnimatedDropdown from "../Common/AnimatedDropdown/AnimatedDropdown";
import useModules from "./hooks/useModules";

export default function UserModuleDropdown({ value, onChange, placeholder = "Select a module...", className, triggerClassName, ...props }) {
  const { enrollments, loading } = useModules();

  const moduleOptions = useMemo(() => {
    if (!enrollments) return [];
    return enrollments.map(e => ({
      value: e.module_code || e.module?.module_code,
      label: buildModuleLabel(e)
    }));
  }, [enrollments]);

  return (
    <AnimatedDropdown
      value={value}
      onChange={onChange}
      options={moduleOptions}
      searchable={true}
      placeholder={loading ? "Loading modules..." : placeholder}
      className={className}
      triggerClassName={triggerClassName}
      {...props}
    />
  );
}

function buildModuleLabel(enrollment) {
  const code = enrollment.module_code || enrollment.module?.module_code || "";
  const name = enrollment.module_name || enrollment.module?.module_name || "";
  if (code && name) return `${code} — ${name}`;
  return name || code;
}
