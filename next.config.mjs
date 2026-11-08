/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  agentRules: false,
  typedRoutes: true,
  experimental: { optimizePackageImports: ["radix-ui"] },
  async redirects() {
    return [
      {source: "/staff/switch-org", destination: "/staff/switch-branch", permanent: false},
      {source: "/company/account", destination: "/account", permanent: false},
      {source: "/platform/account", destination: "/account", permanent: false},
      {source: "/platform/audit", destination: "/audit", permanent: false},
      {source: "/company", destination: "/roles", permanent: false},
      {source: "/platform/:path*", destination: "/roles", permanent: false},
      {source: "/platform", destination: "/roles", permanent: false},
    ];
  },
  async headers() {
    return [{source: "/activate", headers: [{key: "Referrer-Policy", value: "no-referrer"}]}];
  }
};

export default nextConfig;
