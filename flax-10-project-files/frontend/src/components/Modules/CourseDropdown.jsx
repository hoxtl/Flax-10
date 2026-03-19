import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import { ALL_KCL_COURSES } from "../../lib/kclCourses";

export default function CourseDropdown({ value, onChange, placeholder = "Select a course...", className }) {
  return (
    <AnimatedDropdown
      value={value}
      onChange={onChange}
      options={ALL_KCL_COURSES}
      searchable={true}
      placeholder={placeholder}
      className={className}
    />
  );
}
