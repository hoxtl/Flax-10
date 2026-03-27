/*
 * Shared auth input wrapper.
 */

import * as Components from "../utils/AuthComponents";

export function AuthInputField(props) {
  return (
    <Components.Input
      type={props.type}
      placeholder={props.placeholder}
      value={props.value}
      onChange={props.onChange}
      required
      minLength={props.minLength}
      disabled={props.disabled}
    />
  );
}
