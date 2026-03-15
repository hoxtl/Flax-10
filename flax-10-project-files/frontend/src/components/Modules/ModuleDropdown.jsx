import AnimatedDropdown from "../common/AnimatedDropdown";

export default function ModuleDropdown({ value, onChange, options, className = "" }) {
    return (
        <AnimatedDropdown
            value={value}
            onChange={onChange}
            options={options}
            className={className}
        />
    );
}
