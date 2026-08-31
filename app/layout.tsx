import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/navbar";

const notoSerif = Noto_Serif({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
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
    "Hệ thống phân phối thực phẩm hữu cơ, nông sản đạt chuẩn VietGAP và thực phẩm cấp đông sâu với công nghệ giám sát nhiệt độ chuỗi lạnh liên tục -18°C. Minh bạch 100% nguồn gốc.",
  keywords: [
    "thực phẩm sạch",
    "nông sản hữu cơ",
    "chuỗi lạnh",
    "VietGAP",
    "GlobalGAP",
    "cá hồi Na Uy",
    "thịt bò Wagyu",
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
      "Hệ thống phân phối thực phẩm hữu cơ, nông sản đạt chuẩn VietGAP và thực phẩm cấp đông sâu với công nghệ giám sát nhiệt độ chuỗi lạnh liên tục -18°C.",
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
      "Thực phẩm sạch từ nông trại hữu cơ đến bàn ăn gia đình. Chuỗi lạnh -18°C kiểm soát liên tục.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121410" },
  ],
};

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Việt Sạch",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Chuỗi cung ứng thực phẩm sạch, nông sản VietGAP và chuỗi lạnh -18°C an toàn thực phẩm hàng đầu Việt Nam.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Thành phố Hồ Chí Minh",
    addressCountry: "VN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84-1900-8888",
    contactType: "customer service",
    availableLanguage: ["Vietnamese"],
  },
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Việt Sạch",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/products?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${notoSerif.variable} ${beVietnamPro.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <div className="flex-1">{children}</div>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
