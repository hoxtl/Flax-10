/*
 * Lightweight feedback components for settings forms.
 */
import InlineAlert from "../../Common/InlineAlert/InlineAlert";

export function SuccessBanner({ message }) {
  return <InlineAlert message={message} variant="success" />;
}

export function ErrorMessage({ message }) {
  return <InlineAlert message={message} variant="error" />;
}
