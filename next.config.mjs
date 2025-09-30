/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only use for deployment purposes.
    ignoreDuringBuilds: true,
  },
  images: {
    // use remotePatterns (Next 14+) to allow serving images from Supabase Storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zajechrlsivmlyywhgwp.supabase.co",
        port: "",
        // allow both public and signed storage URLs
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "zajechrlsivmlyywhgwp.supabase.co",
        port: "",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
