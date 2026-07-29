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

export function LocaleGateway() {
  useEffect(() => {
    window.location.replace(`${basePath}/${preferredLocale()}`);
  }, []);

  return (
    <main className="locale-gateway">
      <span className="brand-mark">V</span>
      <p>正在打开 Vibe Screen / Opening Vibe Screen...</p>
      <noscript>
        <a href={`${basePath}/zh`}>中文</a>
        <a href={`${basePath}/en`}>English</a>
      </noscript>
    </main>
  );
}
