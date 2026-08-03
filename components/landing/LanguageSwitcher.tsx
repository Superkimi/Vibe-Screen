"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { LandingLocale } from "@/lib/landing-copy";

const STORAGE_KEY = "vibe_screen_locale";

export function LanguageSwitcher({
  locale,
  ariaLabel,
  pathForLocale = (nextLocale) => `/${nextLocale}`,
}: {
  locale: LandingLocale;
  ariaLabel: string;
  pathForLocale?: (locale: LandingLocale) => string;
}) {
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `${STORAGE_KEY}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [locale]);

  return (
    <div className="language-switcher" role="group" aria-label={ariaLabel}>
      <Link
        href={pathForLocale("zh")}
        lang="zh-CN"
        aria-current={locale === "zh" ? "page" : undefined}
        onClick={() => window.localStorage.setItem(STORAGE_KEY, "zh")}
      >
        中文
      </Link>
      <Link
        href={pathForLocale("en")}
        lang="en"
        aria-current={locale === "en" ? "page" : undefined}
        onClick={() => window.localStorage.setItem(STORAGE_KEY, "en")}
      >
        EN
      </Link>
    </div>
  );
}
