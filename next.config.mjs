/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  agentRules: false,
  typedRoutes: true,
  async headers() {
    return [{source: "/activate", headers: [{key: "Referrer-Policy", value: "no-referrer"}]}];
  }
};

export default nextConfig;
