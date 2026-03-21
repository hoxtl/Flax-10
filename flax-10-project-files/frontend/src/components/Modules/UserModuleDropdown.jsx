import { useMemo } from "react";
<<<<<<< HEAD
import AnimatedDropdown from "../common/animated_dropdown/AnimatedDropdown";
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
=======
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

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  return (
    <AnimatedDropdown
      value={value}
      onChange={onChange}
      options={moduleOptions}
      searchable={true}
<<<<<<< HEAD
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
=======
      placeholder={loading ? "Loading modules..." : placeholder}
      className={className}
      {...props}
    />
  );
}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
