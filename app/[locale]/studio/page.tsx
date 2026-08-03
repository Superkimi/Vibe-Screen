import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScreenStudio } from "@/components/editor/ScreenStudio";
import { editorCopy, isEditorLocale, type EditorLocale } from "@/lib/editor-copy";

export function generateStaticParams() {
  return (["zh", "en"] as EditorLocale[]).map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEditorLocale(locale)) return {};
  const copy = editorCopy[locale];
  return {
    title: { absolute: copy.meta.title },
    description: copy.meta.description,
    alternates: {
      canonical: `/${locale}/studio`,
      languages: {
        "zh-CN": "/zh/studio",
        en: "/en/studio",
        "x-default": "/zh/studio",
      },
    },
  };
}

export default async function LocalizedStudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEditorLocale(locale)) notFound();
  return <ScreenStudio locale={locale} />;
}
