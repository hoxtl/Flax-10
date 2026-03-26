/*
 * Text input element used by settings form controls.
 */
<<<<<<< HEAD

import TextInput from "../../common/text_input/TextInput";
=======
import TextInput from "../../common/TextInput/TextInput";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export default function FormTextInput(props) {
  const { type, id, name, value, onChange, required, maxLength, autoComplete } = props;
  return <TextInput type={type} id={id} name={name} value={value} onChange={onChange} required={required} maxLength={maxLength} autoComplete={autoComplete} />;
}
