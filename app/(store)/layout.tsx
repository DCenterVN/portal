import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StoreFrame } from "@/features/store/store-frame";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vietsach.reborn.vn";

export const metadata: Metadata = {
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

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite).replace(/</g, "\\u003c") }}
      />
      <StoreFrame>{children}</StoreFrame>
    </>
  );
}
