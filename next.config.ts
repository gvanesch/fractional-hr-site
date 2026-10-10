import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  output: "standalone",
  async headers() {
    const headers = [
      {key:"X-Robots-Tag",value:"noindex, nofollow, noarchive"},
      {key:"Referrer-Policy",value:"no-referrer"},
      {key:"Cache-Control",value:"private, no-store"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"X-Content-Type-Options",value:"nosniff"},
    ];
    return [{source:"/baseline/:path*",headers},{source:"/api/baseline/:path*",headers}];
  },
  async redirects() {
    return [
      {
        source: "/advisor\\*",
        destination: "/advisor",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
