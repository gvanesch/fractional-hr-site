import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://vanesch.uk";

  const routes = [
    "",
    "/services",
    "/diagnostic",
    "/approach",
    "/case-studies",
    "/about",
    "/pricing",
    "/contact",
    "/insights",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}