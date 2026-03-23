/*
 * Text input element used by settings form controls.
 */

import TextInput from "../../common/TextInput/TextInput";

export default function FormTextInput(props) {
  const { type, id, name, value, onChange, required, maxLength, autoComplete } = props;
  return <TextInput type={type} id={id} name={name} value={value} onChange={onChange} required={required} maxLength={maxLength} autoComplete={autoComplete} />;
}
