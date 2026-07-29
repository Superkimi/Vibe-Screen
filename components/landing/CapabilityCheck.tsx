"use client";

import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { detectCapabilities, type BrowserCapabilities } from "@/lib/capabilities";
import { landingCopy, type LandingLocale } from "@/lib/landing-copy";

export function CapabilityCheck({ locale }: { locale: LandingLocale }) {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const copy = landingCopy[locale].capability;
  useEffect(() => {
    const timeout = window.setTimeout(() => setCapabilities(detectCapabilities()), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!capabilities) return <span className="capability-loading">{copy.checking}</span>;
  return (
    <span className={capabilities.recommended ? "capability-ready" : "capability-warning"}>
      {capabilities.recommended ? <CheckCircle size={17} weight="fill" /> : <WarningCircle size={17} weight="fill" />}
      {capabilities.recommended
        ? copy.ready
        : copy.warning}
    </span>
  );
}
