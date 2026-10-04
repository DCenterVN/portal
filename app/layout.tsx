import type { Metadata, Viewport } from "next";
import { Nunito, Quicksand } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const quicksand = Quicksand({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vietsach.reborn.vn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Việt Sạch — Chuỗi Cung Ứng Thực Phẩm Sạch & Chuỗi Lạnh An Toàn",
    template: "%s | Việt Sạch",
  },
  description:
    "Fresh Meal Kit: nguyên liệu sơ chế và bộ nguyên liệu cho bữa ăn, hỗ trợ chuẩn bị món ăn và truy xuất nguồn gốc.",
  keywords: [
    "Fresh Meal Kit",
    "bộ nguyên liệu bữa ăn",
    "nguyên liệu sơ chế",
    "chuẩn bị bữa ăn",
    "truy xuất nguồn gốc",
    "Việt Sạch",
  ],
  authors: [{ name: "Việt Sạch Operations" }],
  creator: "Việt Sạch",
  publisher: "Việt Sạch Cold Chain Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "Việt Sạch",
    title: "Việt Sạch — Chuỗi Cung Ứng Thực Phẩm Sạch & Chuỗi Lạnh An Toàn",
    description:
      "Fresh Meal Kit: nguyên liệu sơ chế và bộ nguyên liệu cho bữa ăn, hỗ trợ chuẩn bị món ăn và truy xuất nguồn gốc.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Việt Sạch — Chuỗi Cung Ứng Thực Phẩm Sạch",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Việt Sạch — Chuỗi Cung Ứng Thực Phẩm Sạch & Chuỗi Lạnh An Toàn",
    description:
      "Fresh Meal Kit: bộ nguyên liệu sơ chế giúp chuẩn bị bữa ăn gia đình.",
    images: ["/og-image.png"],
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1D1714" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${quicksand.variable} ${nunito.variable}`}
    >
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
