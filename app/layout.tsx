import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aihubhub.com/vibe-screen"),
  title: {
    default: "Vibe Screen | Record beautifully in your browser",
    template: "%s | Vibe Screen",
  },
  description:
    "A private, local-first browser screen recorder and editor for polished product demos, tutorials, and walkthroughs.",
  openGraph: {
    title: "Vibe Screen",
    description: "Record, edit, and export polished screen videos without leaving your browser.",
    type: "website",
    images: ["/images/vibe-screen-studio.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ff" },
    { media: "(prefers-color-scheme: dark)", color: "#17141d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
