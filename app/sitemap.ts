import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.vanesch.uk";

  const routes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/services", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/services/enterprise", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/services/growing-companies", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/services/hr-chaos-signals", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/services/hr-foundations-sprint", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/services/fractional-hr-advisory", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/diagnostic-assessment", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/diagnostic", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/approach", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/case-studies", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/insights", changeFrequency: "weekly" as const, priority: 0.7 },
    {
      path: "/insights/what-is-an-hr-operating-model",
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      path: "/insights/why-hr-operations-break-as-companies-grow",
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    { path: "/cyber-essentials", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/data-protection-complaints", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/modern-slavery", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/cookies", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
