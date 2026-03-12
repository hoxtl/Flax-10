import { useTags } from '../../../../context/TagContext';
import AnimatedDropdown from '../../../common/AnimatedDropdown';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const uniqueTags = Array.from(
        new Map((tags || []).map(t => [t.label.toLowerCase(), t])).values()
    );
    const options = uniqueTags.map(tag => ({ value: tag.id, label: tag.label }));

    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <AnimatedDropdown
                value={value || ''}
                onChange={(val) => onChange({ target: { value: val } })}
                options={options}
                placeholder="Select type"
                align="left"
            />
        </div>
    );
}
