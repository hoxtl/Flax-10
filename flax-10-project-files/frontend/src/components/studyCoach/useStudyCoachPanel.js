/*
 * State and behaviors for the study coach panel.
 */

import { useEffect, useRef, useState } from "react";
import analyticsService from "../../api/analyticsApi";
import {
  buildNextMessages,
  createAssistantMessage,
  STUDY_COACH_ERROR,
  trimMessage,
} from "./studyCoachHelpers";

export function useStudyCoachPanel(initialMessage, period) {
  const state = useStudyCoachState(initialMessage);
  const actions = useStudyCoachActions(state, period);
  useAutoScroll(state.bottomRef, state.messages, state.loading);
  useAutoSend(initialMessage, state.loading, state.didAutoSendRef, actions.sendMessage);
  return { ...state, ...actions };
}

function useAutoScroll(bottomRef, messages, loading) {
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bottomRef, loading, messages]);
}

function useAutoSend(initialMessage, loading, didAutoSendRef, sendMessage) {
  useEffect(() => {
    const message = trimMessage(initialMessage);
    if (!message || didAutoSendRef.current || loading) return;
    didAutoSendRef.current = true;
    const timer = setTimeout(() => sendMessage(message), 400);
    return () => clearTimeout(timer);
  }, [didAutoSendRef, initialMessage, loading, sendMessage]);
}

function useStudyCoachState(initialMessage) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const didAutoSendRef = useRef(false);
  return { bottomRef, didAutoSendRef, error, input, loading, messages, setError, setInput, setLoading, setMessages };
}

function useStudyCoachActions(state, period) {
  return {
    clearMessages: createClearMessages(state.setMessages),
    handleKeyDown: createHandleKeyDown(() => sendStudyCoachMessage(state, period)),
    sendMessage: (text) => sendStudyCoachMessage(state, period, text),
  };
}

function createClearMessages(setMessages) {
  return () => setMessages([]);
}

function createHandleKeyDown(sendMessage) {
  return (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendMessage();
  };
}

async function sendStudyCoachMessage(state, period, text) {
  const message = trimMessage(text || state.input);
  if (!message || state.loading) return;
  const nextMessages = buildNextMessages(state.messages, message);
  beginRequest(state, nextMessages);
  try {
    const response = await analyticsService.aiChat(nextMessages, period);
    state.setMessages((current) => [...current, createAssistantMessage(response)]);
  } catch {
    state.setError(STUDY_COACH_ERROR);
  } finally {
    state.setLoading(false);
  }
}

function beginRequest(state, nextMessages) {
  state.setMessages(nextMessages);
  state.setInput("");
  state.setLoading(true);
  state.setError(null);
}
