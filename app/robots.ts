import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vietsach.reborn.vn";

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
