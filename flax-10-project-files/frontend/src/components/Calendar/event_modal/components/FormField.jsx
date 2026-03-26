export function FormField({ label, type = 'text', ...props }) {
    const id = `field-${label.toLowerCase()}`;
    const Component = type === 'textarea' ? 'textarea' : 'input';
    return (
        <div className="form-field">
            <label htmlFor={id}>{label}</label>
            <Component id={id} type={type} {...props} />
        </div>
    );
}
