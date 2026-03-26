/*
 * Lightweight feedback components for settings forms.
 */
<<<<<<< HEAD

import InlineAlert from "../../common/inline_alert/InlineAlert";
=======
import InlineAlert from "../../common/InlineAlert/InlineAlert";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function SuccessBanner({ message }) {
  return <InlineAlert message={message} variant="success" />;
}

export function ErrorMessage({ message }) {
  return <InlineAlert message={message} variant="error" />;
}
