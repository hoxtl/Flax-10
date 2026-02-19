import { useState } from "react";

export function useTodoPanelState() {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  return {
    text,
    setText,
    editingId,
    setEditingId,
    editText,
    setEditText,
    menuOpen,
    setMenuOpen,};}