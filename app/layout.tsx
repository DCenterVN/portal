import type {Metadata, Viewport} from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCenter Portal",
  description: "Resort IAM console and API lab for DCenterVN operators"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f4f4a"
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
