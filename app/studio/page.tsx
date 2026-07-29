import type { Metadata } from "next";
import { ScreenStudio } from "@/components/editor/ScreenStudio";

export const metadata: Metadata = {
  title: "Studio | Vibe Screen",
  description: "Record, edit, and export polished screen videos in your browser.",
};

export default function StudioPage() {
  return <ScreenStudio />;
}
