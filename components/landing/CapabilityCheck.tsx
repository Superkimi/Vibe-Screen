"use client";

import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { detectCapabilities, type BrowserCapabilities } from "@/lib/capabilities";

export function CapabilityCheck() {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  useEffect(() => {
    const timeout = window.setTimeout(() => setCapabilities(detectCapabilities()), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!capabilities) return <span className="capability-loading">Checking this browser...</span>;
  return (
    <span className={capabilities.recommended ? "capability-ready" : "capability-warning"}>
      {capabilities.recommended ? <CheckCircle size={17} weight="fill" /> : <WarningCircle size={17} weight="fill" />}
      {capabilities.recommended
        ? "This browser is ready to record"
        : "Chrome or Edge is recommended for recording"}
    </span>
  );
}
