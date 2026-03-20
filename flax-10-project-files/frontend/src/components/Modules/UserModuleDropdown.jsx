import { useMemo } from "react";
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import useModules from "./hooks/useModules";

export default function UserModuleDropdown({ value, onChange, placeholder = "Select a module...", className, ...props }) {
  const { enrollments, loading } = useModules();

  const moduleOptions = useMemo(() => {
    if (!enrollments) return [];
    return enrollments.map(e => ({
      value: e.module_code || e.module?.module_code,
      label: e.module_name || e.module?.module_name || e.module_code || e.module?.module_code
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
      {...props}
    />
  );
}
