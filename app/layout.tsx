import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aihubhub.com/vibe-screen"),
  title: {
    default: "Vibe Screen | 在线录屏与视频编辑器",
    template: "%s | Vibe Screen",
  },
  description: "在浏览器完成录屏、编辑与高质量导出，素材与工程默认保存在本地。",
  openGraph: {
    title: "Vibe Screen",
    description: "在浏览器完成录屏、剪辑和高质量导出，无需上传原始素材。",
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
