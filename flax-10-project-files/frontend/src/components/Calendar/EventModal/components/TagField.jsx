import { useTags } from '../../../../context/TagContext';
import AnimatedDropdown from '../../../ui/AnimatedDropdown';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const options = (tags || []).map(tag => ({ value: tag.id, label: tag.label }));

    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <AnimatedDropdown value={value || ''} onChange={(val) => onChange({ target: { value: val } })} options={options} placeholder="Select type" />
        </div>
    );
}
