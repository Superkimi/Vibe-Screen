"use client";

import { useEffect } from "react";

const STORAGE_KEY = "vibe_screen_locale";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function preferredLocale() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "zh" || stored === "en") return stored;
  const cookie = document.cookie.match(/(?:^|;\s*)vibe_screen_locale=(zh|en)(?:;|$)/)?.[1];
  if (cookie === "zh" || cookie === "en") return cookie;
  return navigator.languages.some((language) => language.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

export function StudioLocaleGateway() {
  useEffect(() => {
    window.location.replace(`${basePath}/${preferredLocale()}/studio`);
  }, []);

  return (
    <main className="studio-loading">
      <span className="brand-mark">V</span>
      <div><i /><i /><i /></div>
      <p>正在打开编辑器 / Opening the studio...</p>
      <noscript>
        <a href={`${basePath}/zh/studio`}>中文编辑器</a>
        <a href={`${basePath}/en/studio`}>English studio</a>
      </noscript>
    </main>
  );
}
