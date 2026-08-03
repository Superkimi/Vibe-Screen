"use client";

import { createContext, type ReactNode, useContext, useEffect } from "react";
import { editorCopy, type EditorLocale } from "@/lib/editor-copy";

const EditorLocaleContext = createContext<EditorLocale>("en");

export function EditorI18nProvider({ locale, children }: { locale: EditorLocale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return <EditorLocaleContext.Provider value={locale}>{children}</EditorLocaleContext.Provider>;
}

export function useEditorCopy() {
  return editorCopy[useContext(EditorLocaleContext)];
}

export function useEditorLocale() {
  return useContext(EditorLocaleContext);
}
