import type { Metadata, Viewport } from "next";
import { BRAND_NAME, SITE_URL } from "@/lib/brand";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";

const body = Inter({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
});

const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: true,
});

const themeScript = `try{var d=document.documentElement,t=localStorage.getItem("dcenter_theme");if(t==="dark"||t==="light"){d.dataset.theme=t;d.classList.toggle("dark",t==="dark")}else if(matchMedia("(prefers-color-scheme: dark)").matches){d.classList.add("dark")}}catch(e){}`;


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — Bộ nguyên liệu bữa ăn, rõ nguồn gốc`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Bộ nguyên liệu bữa ăn: nguyên liệu sơ chế và bộ nguyên liệu cho bữa ăn, hỗ trợ chuẩn bị món ăn và truy xuất nguồn gốc.",
  keywords: [
    "bộ nguyên liệu bữa ăn",
    "bộ nguyên liệu bữa ăn",
    "nguyên liệu sơ chế",
    "chuẩn bị bữa ăn",
    "truy xuất nguồn gốc",
    BRAND_NAME,
  ],
  authors: [{ name: `${BRAND_NAME} Operations` }],
  creator: BRAND_NAME,
  publisher: `${BRAND_NAME} Platform`,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Bộ nguyên liệu bữa ăn, rõ nguồn gốc`,
    description:
      "Bộ nguyên liệu bữa ăn: nguyên liệu sơ chế và bộ nguyên liệu cho bữa ăn, hỗ trợ chuẩn bị món ăn và truy xuất nguồn gốc.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — Bộ nguyên liệu bữa ăn`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Bộ nguyên liệu bữa ăn, rõ nguồn gốc`,
    description:
      "Bộ nguyên liệu bữa ăn: bộ nguyên liệu sơ chế giúp chuẩn bị bữa ăn gia đình.",
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
    { media: "(prefers-color-scheme: light)", color: "Canvas" },
    { media: "(prefers-color-scheme: dark)", color: "Canvas" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${body.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
