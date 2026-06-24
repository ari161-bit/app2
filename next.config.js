/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint:          { ignoreDuringBuilds: true },
  typescript:      { ignoreBuildErrors:  true },
  images: {
    domains: ["dexeiusiusmkbpqtfnte.supabase.co"],
  },
};

module.exports = nextConfig;
