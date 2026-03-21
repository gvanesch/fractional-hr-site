import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/advisor/", "/api/"],
      },
    ],
    sitemap: "https://vanesch.uk/sitemap.xml",
  };
}