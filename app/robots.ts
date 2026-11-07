import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/gioi-thieu", "/truy-xuat", "/products", "/san-pham"],
        disallow: [
          "/api/",
          "/ops/",
          "/system/",
          "/driver/",
          "/work/",
          "/console/",
          "/branches/",
          "/switch-branch/",
          "/memberships/",
          "/roles/",
          "/me/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
