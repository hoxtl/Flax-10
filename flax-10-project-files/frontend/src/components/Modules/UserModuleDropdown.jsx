import { useMemo } from "react";
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import useModules from "./hooks/useModules";

function getModuleOptions(enrollments) {
  if (!enrollments) return [];
  return enrollments.map((enrollment) => ({
    value: enrollment.module_code || enrollment.module?.module_code,
    label: buildModuleLabel(enrollment),
  }));
}

function getPlaceholder(loading, placeholder) {
  return loading ? "Loading modules..." : placeholder;
}

export default function UserModuleDropdown(props) {
  const { value, onChange, placeholder = "Select a module...", className, triggerClassName, ...rest } = props;
  const { enrollments, loading } = useModules();
  const moduleOptions = useMemo(() => getModuleOptions(enrollments), [enrollments]);
  return (
    <AnimatedDropdown
      value={value}
      onChange={onChange}
      options={moduleOptions}
      searchable={true}
      placeholder={getPlaceholder(loading, placeholder)}
      className={className}
      triggerClassName={triggerClassName}
      {...rest}
    />
  );
}

function buildModuleLabel(enrollment) {
  const code = enrollment.module_code || enrollment.module?.module_code || "";
  const name = enrollment.module_name || enrollment.module?.module_name || "";
  if (code && name) return `${code} — ${name}`;
  return name || code;
}
