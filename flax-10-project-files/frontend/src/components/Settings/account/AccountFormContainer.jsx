/*
 * Connected account-form container.
 */

import CourseChangeModal from "./CourseChangeModal";
import AccountFormLayout from "./AccountFormLayout";
import { hasAccountChanges } from "./accountFormConfig";
import useAccountFormState from "./useAccountFormState";
import useCourseRequestFeedback from "./useCourseRequestFeedback";
import {
  createAccountSubmitHandler,
  createCancelCourseRequestHandler,
  createCourseRequestSuccessHandler,
} from "./useCourseRequestActions";

function useAccountFormController(user, onSave) {
  const account = useAccountFormState(user);
  const feedback = useCourseRequestFeedback();
  const context = {
    formData: account.formData,
    hasUnsaved: hasAccountChanges(account.formData, account.initialFormData),
    onSave,
    refreshProfile: account.refreshProfile,
    setInitialFormData: account.setInitialFormData,
    setPendingRequest: account.setPendingRequest,
    setShowModal: feedback.showModal[1],
    setCancellingRequest: feedback.cancellingRequest[1],
    setCourseRequestNotice: feedback.courseRequestNotice[1],
    setCourseRequestError: feedback.courseRequestError[1],
    setSaveSignal: feedback.saveSignal[1],
  };
  return { account, feedback, context };
}

function buildContainerProps(controller, isSaving) {
  const [showModal, setShowModal] = controller.feedback.showModal;
  const [cancellingRequest] = controller.feedback.cancellingRequest;
  const [courseRequestNotice] = controller.feedback.courseRequestNotice;
  const [courseRequestError] = controller.feedback.courseRequestError;
  const [saveSignal] = controller.feedback.saveSignal;
  return { showModal, setShowModal, cancellingRequest, courseRequestNotice, courseRequestError, saveSignal, isSaving };
}

function buildLayoutProps(controller, view) {
  return {
    onSubmit: createAccountSubmitHandler(controller.context),
    formData: controller.account.formData,
    handleChange: controller.account.handleChange,
    currentCourse: controller.account.currentCourse,
    pendingRequest: controller.account.pendingRequest,
    onRequestClick: () => view.setShowModal(true),
    onCancelRequest: createCancelCourseRequestHandler(controller.context),
    cancellingRequest: view.cancellingRequest,
    courseRequestNotice: view.courseRequestNotice,
    courseRequestError: view.courseRequestError,
    isSaving: view.isSaving,
    hasUnsaved: controller.context.hasUnsaved,
    saveSignal: view.saveSignal,
  };
}

function CourseRequestModal({ showModal, setShowModal, onSuccess }) {
  return showModal ? <CourseChangeModal onClose={() => setShowModal(false)} onSuccess={onSuccess} /> : null;
}

function AccountFormBody({ controller, view }) {
  const layoutProps = buildLayoutProps(controller, view);
  return (
    <>
      <AccountFormLayout {...layoutProps} />
      <CourseRequestModal showModal={view.showModal} setShowModal={view.setShowModal} onSuccess={createCourseRequestSuccessHandler(controller.context)} />
    </>
  );
}

export default function AccountFormContainer({ user, onSave, isSaving }) {
  const controller = useAccountFormController(user, onSave);
  const view = buildContainerProps(controller, isSaving);
  return <AccountFormBody controller={controller} view={view} />;
}
