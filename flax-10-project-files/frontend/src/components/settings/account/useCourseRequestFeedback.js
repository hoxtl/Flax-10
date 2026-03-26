/*
 * Local UI state for account course-request interactions.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useState } from "react";
import { getCachedPendingRequest } from "./accountCourseRequests";

export default function useCourseRequestFeedback() {
  return {
    showModal: useState(false),
    cancellingRequest: useState(false),
    courseRequestNotice: useState(() => (getCachedPendingRequest() ? "Request sent." : "")),
    courseRequestError: useState(""),
    saveSignal: useState(0),
  };
}
