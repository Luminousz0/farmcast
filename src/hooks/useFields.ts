import { useState, useCallback } from "react";
import type { SavedField } from "@/types/field";

const STORAGE_KEY = "farmcast:fields";

function loadFields(): SavedField[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useFields() {
  const [fields, setFields] = useState<SavedField[]>(loadFields);

  const saveField = useCallback((field: Omit<SavedField, "id">) => {
    const newField: SavedField = { ...field, id: crypto.randomUUID() };
    setFields((prev) => {
      const updated = [...prev, newField];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { fields, saveField, removeField };
}
