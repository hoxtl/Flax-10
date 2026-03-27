import { useMemo } from "react";
import AnimatedDropdown from "../common/animated_dropdown/AnimatedDropdown";
import useModules from "./hooks/useModules";

function getModuleOptions(enrollments, allowNone) {
  const options = enrollments?.map((enrollment) => ({
    value: enrollment.module_code || enrollment.module?.module_code,
    label: buildModuleLabel(enrollment),
  })) || [];
  return allowNone ? [{ value: "", label: "None" }, ...options] : options;
}

function getPlaceholder(loading, placeholder) {
  return loading ? "Loading modules..." : placeholder;
}

export default function UserModuleDropdown(props) {
  const { value, onChange, placeholder = "Select a module...", className, triggerClassName, allowNone = false, ...rest } = props;
  const { enrollments, loading } = useModules();
  const moduleOptions = useMemo(() => getModuleOptions(enrollments, allowNone), [enrollments, allowNone]);
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
