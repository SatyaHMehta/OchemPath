/** @type {import('next').NextConfig} */
const nextConfig = {
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
