import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import {
  LANDING_LOCALES,
  isLandingLocale,
  landingCopy,
} from "@/lib/landing-copy";

export function generateStaticParams() {
  return LANDING_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLandingLocale(locale)) return {};
  const copy = landingCopy[locale];

  return {
    title: { absolute: copy.meta.title },
    description: copy.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "zh-CN": "/zh",
        en: "/en",
        "x-default": "/zh",
      },
    },
    openGraph: {
      title: copy.meta.title,
      description: copy.meta.openGraph,
      type: "website",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      images: ["/images/vibe-screen-studio.png"],
    },
  };
}

export default async function LocalizedLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLandingLocale(locale)) notFound();
  return <LandingPage locale={locale} />;
}
