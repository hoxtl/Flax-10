/*
 * Save handlers for the settings feature.
 */
import {
  saveAccount,
  saveAddress,
  savePassword,
  savePreferences,
  saveSleepWindow,
  saveStudyTime,
  saveWeekPreference,
  saveWorktimePreference,
} from "./settingsHandlerHelpers";
import useSettingsState from "./useSettingsState";

function createActions(state) {
  const {
    setHomeAddressError,
    setIsSaving,
    setPasswordError,
    setBannerMessage,
  } = state;

  return {
    setHomeAddressError,
    setIsSaving,
    setPasswordError,
    setBannerMessage,
  };
}

function useHandlerFactory(state) {
  const actions = createActions(state);
  return createBoundHandlers(state, actions);
}

function createHandlerBinder(actions) {
  return (handler, beforeSave) => async (payload) => {
    actions.setBannerMessage("");
    if (beforeSave) beforeSave();
    return handler(payload, actions);
  };
}

function createBoundHandlers(state, actions) {
  const bind = createHandlerBinder(actions);
  return {
    handleAccountSave: bind(saveAccount, () => { state.setIsSaving(true); state.setPasswordError(""); }),
    handlePasswordSave: bind(savePassword, () => state.setPasswordError("")),
    handlePreferencesSave: bind(savePreferences, () => state.setIsSaving(true)),
    handleHomeAddressSave: bind(saveAddress),
    handleSleepSave: bind(saveSleepWindow),
    handleStudyTimeSave: bind(saveStudyTime),
    handleWeekPreferenceSave: bind(saveWeekPreference),
    handleWorktimePreferenceSave: bind(saveWorktimePreference),
  };
}

export default function useSettingsHandlers() {
  const state = useSettingsState();
  const handlers = useHandlerFactory(state);

  return {
    isSaving: state.isSaving,
    bannerMessage: state.bannerMessage,
    passwordError: state.passwordError,
    homeAddressError: state.homeAddressError,
    ...handlers,
  };
}
