/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"]
  },
  async rewrites() {
    const target = process.env.NEXT_INTERNAL_API_URL || "http://localhost:8000";
    return [
      {
        source: "/backend/:path*",
        destination: `${target}/:path*`
      }
    ];
  }
};

export default nextConfig;
